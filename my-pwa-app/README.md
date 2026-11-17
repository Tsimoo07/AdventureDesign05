# 밥길 · bapgil

Figma `02 How to make`의 `Examples/` 모바일 화면을 기반으로 만든 React + TypeScript + Vite PWA입니다. SUIT Variable 폰트와 `@tabler/icons-react` 아이콘을 사용합니다.

## 실행

```sh
npm ci
npm run dev
```

기본은 **예시 모드**입니다. 백엔드 없이 화면을 탐색할 수 있습니다. Figma의 제1학생회관 도면과 구역별 예시 혼잡도, 버스 경로 예시, 빈 시간표를 표시합니다. iPhone 목업의 기기 테두리·상태 표시줄은 웹 UI에 복제하지 않고 실제 기기의 안전 영역을 사용합니다.

- 홈: 캠퍼스 대시보드, 오늘의 저장된 수업, 주요 기능 바로가기
- 검색: 장소명/구역명으로 필터링
- 식사: 구역별 혼잡도, 장소 선택, 전체 식당 및 즐겨찾기
- 버스: Figma 경로 예시와 상세 안내 (실시간 API 미연결)
- 시간표: 수업 추가·수정·삭제, 시간 겹침 방지, 기기 내 저장
- 메뉴: 기기 내 프로필 수정, 설치 안내

즐겨찾기·시간표·프로필은 해당 브라우저의 localStorage에만 저장됩니다. 로그인이나 기기 간 동기화 기능은 없습니다. 시간표를 처음 열면 빈 격자를 표시하며, 직접 추가한 수업만 표시합니다.

## PWA 설치 및 오프라인 검증

```sh
npm run build
npm test
npm run preview
```

미리보기 주소는 기본 `http://localhost:4173`입니다. 개발 서버에서는 서비스 워커가 활성화되지 않으므로 설치·오프라인 확인은 빌드 미리보기에서 진행하세요. 처음 온라인으로 방문한 뒤 앱 화면·폰트·아이콘·예시 데이터는 오프라인에서도 열립니다. 실시간 API 응답은 오프라인 캐시하지 않습니다.

배포할 때는 `dist/`를 HTTPS 정적 호스팅에 올리고, `/bus` 등의 경로가 `index.html`로 연결되도록 SPA fallback을 설정하세요. 실제 휴대폰에서 설치하려면 HTTPS 주소가 필요합니다. iPhone은 Safari 공유 메뉴의 ‘홈 화면에 추가’, Android는 브라우저의 설치 메뉴를 이용합니다.

## 기존 API 연결

`.env.example`을 참고해 `.env.local`에 설정합니다.

```dotenv
VITE_USE_DEMO=false
VITE_API_URL=http://localhost:3000
```

환경변수를 변경하면 개발 서버를 재시작하거나 다시 빌드하세요. HTTPS 배포에서는 API도 HTTPS로 제공해야 합니다. 별도 터미널에서 기존 샘플 서버를 실행할 수 있습니다.

```sh
npx json-server db.json --port 3000
```

API: `GET /categories`, `GET /categories/:id`. 각 category는 문자열 `id`, `label`, `items`를 가지며, item은 문자열 `id`, `label`, 숫자 `value`(0–100), 선택적 `level`(`normal`, `warning`, `danger`)을 가집니다. 잘못된 응답은 오류 화면으로 처리합니다. 제1학생회관은 API 구역 ID를 도면에 연결하며, 미연결 구역은 정보 없음으로 표시합니다.

## 검증

- TypeScript / production build 통과
- `npm test`: API 응답 검증, manifest, PNG 아이콘 크기, 로컬 폰트·도면 검사
- 브라우저: 320px / 402px, 장소 검색, 즐겨찾기, 시간표 저장·재로드·중복 방지, 네이티브 모달
- 프로덕션 서버 중단 후 새로고침 및 화면 이동 확인
- 위 브라우저 확인은 초기 UI 기준입니다. 동적 도면·지도 추가 이후 최종 브라우저 검증은 미완료입니다.
- 실제 지도 키·센서 API 연결 및 iOS/Android 기기 설치는 미검증

## 디자인 및 에셋

- [Figma 원본](https://www.figma.com/design/XBhEtjHvkLNP4YA7FFJc6L/): `81:118` 혼잡도, `145:384` 버스, `144:322` 시간표, `144:120` 프로필, `32:203` 검색 셸
- `public/images/student-center-floor.png`: 원본 `113:276` 도면 참고 에셋. 현재 혼잡도 화면은 이 PNG 대신 동적 구역 도면을 사용합니다.
- `public/icons/`: 원본 `8:522` 앱 아이콘에서 생성한 PWA 크기별 PNG
- [SUIT](https://github.com/sunn-us/SUIT): 로컬 WOFF2 및 `public/fonts/OFL.txt`
- [Tabler Icons](https://docs.tabler.io/icons/libraries/react): 공식 React 패키지 (MIT)

실시간 버스·위치 기반 길 안내·AI 추천은 구현하지 않았습니다. 기본 예시 모드의 도면 색상과 버스 도착 시간은 실제 상황을 나타내지 않습니다. 실제 API 모드의 도면 색상은 수신 데이터로 갱신됩니다.

하단 메뉴의 선택 배경은 탭 사이를 양방향으로 이동합니다. 화면 진입, 홈 카드 순차 등장, 버튼 누름, 모달 등장 애니메이션을 적용했으며 운영체제의 동작 줄이기 설정을 따릅니다.

## 동적 혼잡도 도면 및 지도 연결

제1학생회관 도면은 정적 PNG 대신 개별 HTML 구역으로 렌더링합니다. 도면과 목록 모두 동일한 응답 값을 사용합니다. `zoneId`가 있으면 그것을, 없으면 `id`를 도면의 0–9 구역과 연결합니다. 배열 순서는 중요하지 않습니다. 연결되지 않은 구역은 회색 ‘정보 없음’으로 표시합니다. 다른 학생회관에는 이 도면을 적용하지 않습니다.

```json
{
  "id": "1",
  "label": "제 1 학생회관",
  "updatedAt": "2026-11-12T04:28:00Z",
  "items": [
    { "id": "sensor-cafe", "zoneId": "0", "label": "99카페", "value": 85, "level": "danger" },
    { "id": "sensor-kiosk", "zoneId": "1", "label": "키오스크", "value": 0, "status": "ready" }
  ]
}
```

구역: 0=99카페, 1=키오스크, 2=식사구역1, 3=식사구역2, 4=라면&양식, 5=스낵·한식·일식, 6=춘향미엔, 7=GS25, 8=식사구역3, 9=식사구역4.

`status: ready`는 준비 상태를 뜻합니다. 그 외에는 `level`을 우선 사용하고, 생략 시 `value` 0–49=원활, 50–79=보통, 80–100=혼잡으로 표시합니다. 관측 시각은 서버의 `updatedAt`을 표시합니다. 실제 API 모드는 화면이 보이는 동안 15초 간격으로 조회하며, 실패 시 이전 수신 값과 오류 안내를 유지합니다. 센서 수집·분류 서버 자체는 별도로 연결해야 합니다. 기존 db.json의 `1-1` 같은 ID는 도면과 일치하지 않으므로 `zoneId`를 추가하세요.

버스 화면의 지도는 [카카오 지도 Web API](https://apis.map.kakao.com/web/guide/)를 사용합니다. `.env.local`에 `VITE_KAKAO_MAP_KEY`(공개 JavaScript 키)를 지정하고, 카카오 개발자 콘솔에서 해당 키의 JavaScript SDK 도메인을 등록한 뒤 다시 빌드합니다. REST 키나 Admin 키는 넣지 마세요. 키가 없으면 외부 카카오맵 링크를 제공하며, 로딩 오류·시간 초과에는 재시도 버튼을 표시합니다. 지도 중심은 충남대학교 인근이며 실시간 버스 API와는 별개입니다.

시간표의 회색 예시 블록은 제거했습니다. 실제 저장한 수업만 표시하며 기존 저장 내용은 삭제하지 않습니다.

## 에브리타임 연동 상태

공개 공유 링크(`/@…`, `/app/@…`)를 입력하면 `/api/everytime`으로 요청합니다. 에브리타임 공개 페이지의 실제 호출 형식(POST `/find/timetable/table/friend`, 5분 단위 XML)을 기준으로 변환합니다. 미리보기에서 확인해야 기존 수업이 교체됩니다. 가져오기 실패 시 기존 시간표는 유지됩니다. 자동 주기 동기화는 하지 않습니다.

2026-11-12 로컬 미리보기에서 실제 공유 링크로 수업 블록 12개와 시간 미지정 과목 1개를 가져오고, 저장 후 새로고침해 유지되는 것을 확인했습니다. 이전 직접 요청에서는 403이 발생했으므로 모든 서버 환경에서 접근을 보장하지 않습니다. 로그인 쿠키나 차단 우회는 사용하지 않습니다. 비공식 API가 바뀌거나 접근이 제한되면 가져오기가 실패할 수 있습니다.

`npm run dev`와 `npm run preview`에는 서버 미들웨어가 연결됩니다. **dist만 정적 호스팅하면 링크 가져오기는 동작하지 않습니다.** 운영 서버에 `server/everytime.ts`의 `/api/everytime` 핸들러를 연결하고 HTTPS 및 요청 제한을 적용해야 합니다. 공유 URL·응답은 서버에 저장하거나 로그로 남기지 않습니다.

시간표는 30분 격자, 24시까지 표시하며 주말 수업이 있으면 주말 열도 표시합니다. 기존 정각 수업 저장 형식은 유지합니다. 시간 미지정 과목은 별도 목록에 보관합니다.

### 밥길 모션 컴포넌트

- 식사 화면의 학생회관 선택: Spring dropdown. 방향키로 항목 이동, Enter 선택, Escape 닫기.
- 하단 메뉴: Rubber dock. 클릭 또는 좌우 드래그로 이동하고, 현재 메뉴를 다시 누르면 안내가 펼쳐집니다.
- 홈의 오늘의 시간표: Expand card. 누르면 오늘 수업과 시간표 열기 링크가 펼쳐집니다.

원본: [Spring dropdown](https://designbookmark.com/motion-src/spring-dropdown/index.html),
[Rubber dock](https://designbookmark.com/motion-src/rubber-dock/index.html),
[Expand card](https://designbookmark.com/motion-src/expand-card/index.html).
`src/components/motion/spring.ts`는 원본 `shared/motion.js`의 4회 적분 방식과
`shared/tokens.css` 및 컴포넌트 JS의 stiffness/damping 값을 유지합니다.
기존 화면에 맞춰 독 너비는 유지하고 안내 패널은 높이로 펼칩니다.
자동 시연은 없으며, 동작 줄이기 설정에서는 즉시 전환합니다. 추가 의존성은 없습니다.

### 설정 Stack Panel

메뉴 → 설정 → 프로필 / 화면 모드에서 사용합니다. 상단 뒤로 버튼, Escape,
오른쪽 스와이프로 이전 설정으로 돌아갑니다. 기존 프로필 저장과 화면 모드
툴팁을 연결했습니다. 밥길의 SUIT·테마 색·둥근 모서리를 사용합니다.

[Kokonut UI Stack Panel](https://kokonutui.com/docs/navigation/stack-panel)의
MIT 소스를 일반 CSS와 Tabler 아이콘으로 이식했습니다. Motion의 원본
진입 0.42초, 복귀 0.34초, 높이 0.38초 및 0.3 패럴랙스를 유지합니다.
저작권 고지: `licenses/kokonut-ui-MIT.txt`.

## 형성평가용 Vercel 데모 배포

1. 이 변경이 포함된 저장소/브랜치를 Vercel에서 Import합니다.
2. **Root Directory를 `my-pwa-app`으로 설정**합니다. Framework는 Vite입니다.
3. `vercel.json`의 Build Command `npm run build:demo`, Output Directory `dist`를 사용합니다.
4. 별도 API·비밀키 없이 배포합니다. 평가 빌드는 혼잡도 예시 모드를 강제로 사용합니다.
5. 배포 URL에서 `/food`, `/category/1`, `/timetable`, `/menu`를 직접 열고 새로고침해 404가 없는지 확인합니다.
6. 참가자가 로그인 없이 접속할 수 있는 링크인지 별도 브라우저에서 확인한 뒤 URL/QR을 배포합니다.

`npm run build:demo && npm run preview`로 로컬에서도 같은 빌드를 확인할 수 있습니다.
배포 설정 참고: https://vercel.com/docs/frameworks/frontend/vite

평가 모드는 상단에 예시 데이터 안내를 표시하고 초기 프로필을 ‘체험 참여자’로 표시합니다.
시간표는 빈 상태로 시작합니다. 링크 아이콘 → ‘예시 시간표 불러오기’ → 미리보기 → 확인 후 교체 순서로
가상 수업 3개를 가져올 수 있습니다. 실제 에브리타임 URL을 입력하거나 서버로 전송하지 않습니다.
일반 `npm run build`/개발 모드의 실제 링크 가져오기는 기존대로 유지되며 별도 서버가 필요합니다.

학생 답변을 서버에 저장하는 설문 기능은 포함하지 않습니다. 저장한 수업·프로필·즐겨찾기는 브라우저에 남습니다.
공용 기기는 참여자마다 새 브라우저 프로필을 사용하세요. 기존 데이터가 있으면 빈 상태로 시작하지 않습니다.
버스 도착 정보는 예시이고, 카카오 키가 없으면 내장 지도 대신 외부 지도 링크를 제공합니다.
평가 빌드는 지도 키가 설정되어 있어도 외부 지도 링크만 제공합니다. 외부 지도 이동은 오프라인에서 동작하지 않습니다.
평가 기간에는 빌드를 고정하세요. 새 빌드가 보이지 않으면 서비스 워커 갱신 후 새로고침이 필요할 수 있습니다.

평가 자료는 저장소 `docs/evaluation/`에 있습니다:
- `plan-review.html`: 비대면 체험 안내·과제·분석 계획
- `feedback-form.html`: 학생 의견지 (자동 저장/전송 없음, 인쇄/PDF 저장)
- `survey-copy.txt`: Google Forms·네이버 폼에 복사할 문항과 설정

현재는 배포 준비 및 로컬 빌드 검증 상태입니다. Vercel 실제 배포 URL·휴대폰 설치·공유 링크 접근성은 배포 후 확인해야 합니다.

평가는 직접 관찰 없이 3가지 핵심 과제 체험 + 약 1분 설문으로 진행합니다. 온라인 설문은 별도 서비스에서 생성해 공유해야 합니다.
