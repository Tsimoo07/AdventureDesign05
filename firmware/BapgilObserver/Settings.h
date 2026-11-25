#pragma once

constexpr int OBSERVATION_SECONDS = 30;
constexpr int AVERAGE_WINDOW_SECONDS = 5;
constexpr int AVERAGE_WINDOW_COUNT = 5;
constexpr int SCAN_SECONDS = AVERAGE_WINDOW_SECONDS * AVERAGE_WINDOW_COUNT;
constexpr int CONFIG_VERSION = 3;
constexpr char NTP_SERVER[] = "pool.ntp.org";
