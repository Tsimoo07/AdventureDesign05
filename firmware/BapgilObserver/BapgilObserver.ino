#include <Arduino.h>
#include <array>
#include <BLEDevice.h>
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <esp_timer.h>
#include <freertos/queue.h>
#include <freertos/semphr.h>
#include <freertos/task.h>
#include <host/ble_gap.h>
#include <host/ble_hs.h>
#include <nimble/hci_common.h>
#include <stdlib.h>
#include <sys/time.h>
#include "Settings.h"

#if __has_include("Secrets.h")
#include "Secrets.h"
#else
#include "Secrets.example.h"
#endif

#if !defined(CONFIG_IDF_TARGET_ESP32C3) || !defined(CONFIG_NIMBLE_ENABLED)
#error "Build for ESP32C3 Dev Module with Arduino ESP32 3.3.2 / NimBLE."
#endif

constexpr int MIN_RSSI = -127;
constexpr int MAX_RSSI = 20;
using RssiCounts = std::array<uint32_t, MAX_RSSI - MIN_RSSI + 1>;
constexpr int64_t AVERAGE_WINDOW_US = AVERAGE_WINDOW_SECONDS * 1000000LL;
constexpr int64_t SCAN_US = SCAN_SECONDS * 1000000LL;
constexpr int64_t WINDOW_MS = OBSERVATION_SECONDS * 1000LL;
constexpr int64_t MAX_START_DELAY_MS = 1000;
constexpr int64_t SEND_DELAY_MS = 1000;  // Give receiver and server clocks a small margin.
constexpr int64_t MIN_VALID_UTC_MS = 1704067200000LL;  // 2024-01-01 UTC
constexpr size_t MAX_OUTBOX = 8;

struct ScanStats {
  std::array<RssiCounts, AVERAGE_WINDOW_COUNT> windows{};
  int64_t startedUs = 0;
  int64_t endedUs = 0;
};

struct Observation {
  time_t start;
  uint32_t scanMs;
  uint32_t count;
  RssiCounts rssiCounts;
};

struct Pending {
  Observation value;
  uint8_t attempts;
};

ScanStats scan;
SemaphoreHandle_t gapDone;
QueueHandle_t finishedWindows;
bool gapOk = false;
uint8_t ownAddressType;
ble_gap_disc_params scanParameters{};
Pending outbox[MAX_OUTBOX];
size_t pendingCount = 0;
int64_t lastWindowMs = 0;
int64_t retryAfterMs = 0;

int64_t utcMs() {
  timeval tv{};
  gettimeofday(&tv, nullptr);
  return int64_t(tv.tv_sec) * 1000 + tv.tv_usec / 1000;
}

void failSetup(const char *message) {
  Serial.println(message);
  while (true) delay(1000);
}

int onGap(ble_gap_event *event, void *) {
  if (event->type == BLE_GAP_EVENT_DISC_COMPLETE) {
    scan.endedUs = esp_timer_get_time();
    gapOk = event->disc_complete.reason == 0;
    xSemaphoreGive(gapDone);
  } else if (event->type == BLE_GAP_EVENT_DISC &&
             event->disc.event_type != BLE_HCI_ADV_RPT_EVTYPE_SCAN_RSP &&
             event->disc.rssi >= MIN_RSSI && event->disc.rssi <= MAX_RSSI) {
    const int64_t elapsedUs = esp_timer_get_time() - scan.startedUs;
    if (elapsedUs < SCAN_US) {
      const size_t window = elapsedUs / AVERAGE_WINDOW_US;
      ++scan.windows[window][event->disc.rssi - MIN_RSSI];
    }
  }
  return 0;
}

void removeOldest() {
  for (size_t i = 1; i < pendingCount; ++i) outbox[i - 1] = outbox[i];
  --pendingCount;
}

void enqueue(const Observation &observation) {
  if (pendingCount == MAX_OUTBOX) {
    Serial.println("Outbox full; oldest unsent observation dropped.");
    removeOldest();
  }
  outbox[pendingCount++] = {observation, 0};
}

void measure(int64_t windowMs) {
  for (auto &window : scan.windows) window.fill(0);
  gapOk = false;
  const int64_t startUtcMs = utcMs();
  scan.startedUs = esp_timer_get_time();
  if (ble_gap_disc(ownAddressType, SCAN_SECONDS * 1000, &scanParameters, onGap, nullptr) != 0) {
    Serial.println("BLE scan request failed; window skipped.");
    return;
  }
  if (xSemaphoreTake(gapDone, pdMS_TO_TICKS((SCAN_SECONDS + 2) * 1000)) != pdTRUE) {
    Serial.println("BLE scan timed out; restarting radio.");
    delay(200);
    ESP.restart();
    return;
  }
  if (!gapOk || scan.endedUs <= scan.startedUs) {
    Serial.println("BLE scan failed; window skipped.");
    return;
  }

  const int64_t endUtcMs = utcMs();
  const int64_t requestElapsedMs = (esp_timer_get_time() - scan.startedUs) / 1000;
  const uint32_t scanMs = (scan.endedUs - scan.startedUs) / 1000;
  if (startUtcMs < windowMs || endUtcMs < startUtcMs ||
      endUtcMs > windowMs + WINDOW_MS || llabs(endUtcMs - startUtcMs - requestElapsedMs) > 250 ||
      !scanMs || scanMs > WINDOW_MS) {
    Serial.println("Clock shifted or scan crossed the window; observation skipped.");
    return;
  }
  Observation observation{time_t(windowMs / 1000), scanMs, 0, {}};
  for (const auto &window : scan.windows) {
    for (size_t i = 0; i < window.size(); ++i) {
      observation.count += window[i];
      observation.rssiCounts[i] += window[i];
    }
  }
  if (xQueueSend(finishedWindows, &observation, 0) != pdTRUE) {
    Serial.println("Sender busy; observation dropped.");
    return;
  }
  Serial.printf("Scan complete: %lu BLE reports (%.1f per %d s).\n",
                (unsigned long)observation.count, double(observation.count) / AVERAGE_WINDOW_COUNT,
                AVERAGE_WINDOW_SECONDS);
}

size_t appendRssiCounts(char *json, size_t capacity, const RssiCounts &counts, bool average) {
  size_t length = 0;
  const char *separator = "";
  for (int dbm = MIN_RSSI; dbm <= MAX_RSSI; ++dbm) {
    const uint32_t count = counts[dbm - MIN_RSSI];
    if (!count) continue;
    if (average) {
      length += snprintf(json + length, capacity - length, "%s\"%d\":%.1f",
                         separator, dbm, double(count) / AVERAGE_WINDOW_COUNT);
    } else {
      length += snprintf(json + length, capacity - length, "%s\"%d\":%lu",
                         separator, dbm, (unsigned long)count);
    }
    separator = ",";
  }
  return length;
}

int postObservation(const Observation &value) {
  tm utc{};
  char start[25];
  gmtime_r(&value.start, &utc);
  strftime(start, sizeof start, "%Y-%m-%dT%H:%M:%SZ", &utc);
  // Only the transmitter task uses this buffer. Keep it off the TLS call stack.
  // Allow 20 bytes per RSSI bucket in each map, including its separator.
  static char json[256 + 2 * RssiCounts{}.size() * 20];
  size_t length = snprintf(json, sizeof json,
                           "{\"windowStart\":\"%s\",\"durationSec\":%d,\"scanSec\":%lu.%03lu,"
                           "\"count\":%lu,\"configVersion\":%d,\"averageWindowSec\":%d,"
                           "\"averageCount\":%.1f,\"rssiCounts\":{",
                           start, OBSERVATION_SECONDS, (unsigned long)(value.scanMs / 1000),
                           (unsigned long)(value.scanMs % 1000), (unsigned long)value.count,
                           CONFIG_VERSION, AVERAGE_WINDOW_SECONDS, double(value.count) / AVERAGE_WINDOW_COUNT);
  length += appendRssiCounts(json + length, sizeof json - length, value.rssiCounts, false);
  length += snprintf(json + length, sizeof json - length, "},\"averageRssiCounts\":{");
  length += appendRssiCounts(json + length, sizeof json - length, value.rssiCounts, true);
  memcpy(json + length, "}}", 3);
  length += 2;

  WiFiClient tcp;
  WiFiClientSecure tls;
  HTTPClient http;
  const bool https = strncmp(OBSERVATION_URL, "https://", 8) == 0;
  if (https) {
    tls.setCACert(SERVER_ROOT_CA);
    tls.setHandshakeTimeout(3);
  }
  http.setConnectTimeout(1500);
  http.setTimeout(1500);
  http.setFollowRedirects(HTTPC_DISABLE_FOLLOW_REDIRECTS);
  if (!(https ? http.begin(tls, OBSERVATION_URL) : http.begin(tcp, OBSERVATION_URL))) return -1;
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", String("Bearer ") + RECEIVER_TOKEN);
  const int status = http.POST(reinterpret_cast<uint8_t *>(json), length);
  http.end();
  Serial.printf("POST %s -> %d\n", start, status);
  return status;
}

void transmitTask(void *) {
  while (true) {
    Observation observation{};
    if (xQueueReceive(finishedWindows, &observation, pdMS_TO_TICKS(200)) == pdTRUE) {
      enqueue(observation);
    }
    if (!pendingCount || WiFi.status() != WL_CONNECTED || esp_timer_get_time() / 1000 < retryAfterMs) continue;
    const int64_t start = int64_t(outbox[0].value.start) * 1000;
    if (utcMs() < start + WINDOW_MS + SEND_DELAY_MS) continue;
    const int status = postObservation(outbox[0].value);
    if (status < 0 || status == 408 || status == 429 || status >= 500) {
      auto &head = outbox[0];
      if (head.attempts < 5) ++head.attempts;
      const int64_t pauseMs = status == 429 ? 60000 : (2000LL << head.attempts);
      retryAfterMs = esp_timer_get_time() / 1000 + pauseMs;
      continue;
    }
    if (status != 201 && status != 200) Serial.println("Server rejected observation; check receiver configuration.");
    removeOldest();
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);
  const bool https = strncmp(OBSERVATION_URL, "https://", 8) == 0;
  const bool devHttp = ALLOW_LAN_HTTP && strncmp(OBSERVATION_URL, "http://", 7) == 0;
  if ((!https && !devHttp) || (https && !SERVER_ROOT_CA[0]) ||
      !WIFI_SSID[0] || !RECEIVER_TOKEN[0] || strcmp(RECEIVER_TOKEN, "replace-with-receiver-token") == 0) {
    failSetup("Configure Secrets.h: Wi-Fi, receiver token, endpoint and the HTTPS root CA.");
  }

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(true);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  configTime(0, 0, NTP_SERVER);
  gapDone = xSemaphoreCreateBinary();
  if (!gapDone) failSetup("Could not create BLE event semaphore.");
  BLEDevice::init("");
  if (!BLEDevice::getInitialized() || ble_hs_id_infer_auto(0, &ownAddressType) != 0) {
    failSetup("BLE scan setup failed.");
  }
  scanParameters.passive = 1;
  scanParameters.itvl = 160;  // 100 ms in 0.625 ms units
  scanParameters.window = 160;
  scanParameters.filter_duplicates = 0;
  finishedWindows = xQueueCreate(2, sizeof(Observation));
  if (!finishedWindows || xTaskCreate(transmitTask, "observations", 8192, nullptr, 1, nullptr) != pdPASS) {
    failSetup("Could not start observation sender.");
  }
  Serial.println("BLE ready. Waiting for Wi-Fi and UTC clock synchronization.");
}

void loop() {
  const int64_t now = utcMs();
  if (now < MIN_VALID_UTC_MS) {
    delay(250);
    return;
  }
  const int64_t window = now - now % WINDOW_MS;
  if (window > lastWindowMs && now - window <= MAX_START_DELAY_MS) {
    lastWindowMs = window;
    measure(window);
  } else {
    delay(50);
  }
}
