# 밥길 ESP32-C3 관측 펌웨어

ESP32-C3가 30초 구간마다 BLE 광고를 25초 동안 스캔합니다. 5초씩 다섯 구간의 수신 횟수를 집계하고, RSSI별 5초 평균과 원본 횟수를 Wi-Fi로 밥길 백엔드에 전송합니다.

## 보드에 올리기

1. Arduino IDE에 Espressif ESP32 보드 패키지 **3.3.2**를 설치합니다. **ESP32C3 Dev Module**, **USB CDC On Boot → Enabled**, **Partition Scheme → Huge APP**을 선택합니다.
2. `Secrets.example.h`를 같은 폴더의 `Secrets.h`로 복사합니다. `WIFI_SSID`에는 설치 위치에서 사용할 2.4 GHz Wi-Fi 이름을, `WIFI_PASSWORD`에는 비밀번호를 입력합니다. 비밀번호 없이 인터넷에 연결되는 네트워크라면 `""`로 둡니다. `OBSERVATION_URL`에는 밥길 주소 `https://adventure-design05.vercel.app/api/observations`가 들어 있습니다. 데모 수신기의 `RECEIVER_TOKEN`에는 `bapgil-hall2-demo` 같은 임시 값을 넣고, HTTPS 연결에 쓸 루트 CA PEM을 설정합니다.
3. `BapgilObserver.ino`를 업로드하고 시리얼 모니터를 **115200**으로 엽니다. 시각 동기화 후 첫 온전한 구간부터 관측합니다. `Scan complete`와 `POST … -> 200` 로그가 뜨면 웹 API가 받았다는 뜻입니다. 첫 전송까지 시각 동기화 후 약 1분 걸릴 수 있습니다.

로컬 개발 서버를 신뢰하는 LAN에서 시험할 때는 PC의 LAN IP가 들어간 HTTP URL을 지정하고 `ALLOW_LAN_HTTP`를 `true`로 설정할 수 있습니다. 운영 서버에는 기본값인 HTTPS 설정을 사용합니다. 실제 접속 정보는 `Secrets.h`에 둡니다. 이 파일은 Git에서 제외됩니다.

## 웹 백엔드에서 받는 형식

ESP32는 `POST /api/observations`에 `Content-Type: application/json`과 설정된 토큰을 실어 전송합니다. 데모용 웹 수신기는 v3 JSON을 검사하고 수신 확인 응답을 보냅니다.

```json
{
  "windowStart": "2026-11-18T03:00:00Z",
  "durationSec": 30,
  "scanSec": 25.012,
  "count": 31,
  "configVersion": 3,
  "averageWindowSec": 5,
  "averageCount": 6.2,
  "rssiCounts": {"-87": 13, "-75": 11, "-62": 7},
  "averageRssiCounts": {"-87": 2.6, "-75": 2.2, "-62": 1.4}
}
```

| 필드 | 의미 |
| --- | --- |
| `windowStart` | UTC 구간 시작 시각. 매분 00초와 30초에 맞춥니다. |
| `durationSec` | 구간 길이 30초 |
| `scanSec` | 스캔 요청부터 완료 이벤트까지 경과한 초. 통계에는 요청부터 25초 이내에 도착한 결과를 집계합니다. |
| `count` | 유효한 RSSI가 있는 BLE 광고 수신 횟수. 같은 기기가 보낸 반복 광고도 포함됩니다. |
| `configVersion` | 5초 평균을 포함한 형식은 `3`입니다. |
| `rssiCounts` | RSSI별 수신 횟수. 키는 `"-127"`부터 `"20"`까지의 정수 dBm 문자열이며, 값은 양의 정수입니다. 수신이 없었던 RSSI는 생략합니다. 모든 값의 합은 `count`이고, `count=0`이면 `{}`입니다. |
| `averageWindowSec` | 평균을 내는 단위인 5초입니다. 한 번의 스캔에서 다섯 구간을 사용합니다. |
| `averageCount` / `averageRssiCounts` | 전체와 RSSI별 5초당 평균입니다. 수신이 없었던 구간을 0회로 포함해 원본 횟수를 5로 나눕니다. `count`가 0이면 `averageCount`는 `0.0`, 두 분포는 `{}`입니다. |

예를 들어 −62 dBm 광고를 25초 동안 7번 받으면 5초당 평균은 `1.4`입니다. 전송 항목은 구간 시각과 집계값입니다.

웹 수신 API는 성공 시 `200`과 `status: "received"`를 응답합니다. Vercel 프로젝트의 **Logs**에서 `ESP32 observation received`를 찾으면 `windowStart`, `averageCount`, `averageRssiCounts`를 확인할 수 있습니다. 이 단계에서는 수신 로그로 전송을 검증합니다.

## 2학생회관 웹에 표시하기

Vercel 서버 환경 변수 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`을 설정한 뒤 배포합니다. API가 최신 분포 한 건을 최대 2분간 유지하고, 2학생회관 상세 화면(`/category/2`)이 15초마다 새 값을 조회합니다. POST 응답의 `latestUpdated: true`로 최신값 반영을 확인할 수 있습니다.

기본값은 `HALL2_RSSI_SPLIT_DBM=-70`, `HALL2_MODERATE_MIN=500`, `HALL2_BUSY_MIN=1000`입니다. −70 dBm 초과는 1·2, 이하이면 A·B에 같은 값으로 반영합니다. 그룹별 5초당 평균 수신 횟수가 500 미만이면 원활, 500 이상 1000 미만이면 보통, 1000 이상이면 혼잡입니다.

## k-NN에서 사용하는 방법

백엔드에서 `averageRssiCounts`를 필요한 RSSI 구간으로 다시 묶어 5초당 평균을 구할 수 있습니다. Android 앱과 비교할 때는 −55 이상, −56~−65, −66~−75, −76 이하로 합칩니다. 모델 학습 때는 같은 `windowStart`에 팀원이 센 **A·B구역별 실제 인원수**를 해당 분포에 연결합니다. 예를 들어 `A 5명·B 0명`과 `A 0명·B 5명`처럼 총인원은 같고 배치가 다른 상황을 각각 여러 번 측정해 구분 가능한지 검증합니다.

ESP32-C3 빌드와 모의 JSON의 웹 API 수신을 확인했습니다. 팀원 보드로 무선 전송을 검증한 뒤 실측 데이터를 모읍니다.
