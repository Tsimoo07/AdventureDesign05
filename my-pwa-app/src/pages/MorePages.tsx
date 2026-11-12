import {
  isLesson,
  formatTime,
  shareIdentifier,
  type Lesson,
} from "../features/timetable/model";
import { parseTimetable } from "../features/timetable/import";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  IconLink,
  IconHome,
  IconBackpack,
  IconChevronRight,
  IconSettings,
  IconPlus,
  IconX,
  IconDownload,
  IconStar,
  IconToolsKitchen2,
} from "@tabler/icons-react";
import { CampusMap } from "../components/CampusMap";
import { SearchHeader } from "../components/SearchHeader";
import { useSaved } from "../useSaved";
import { fetchCategories } from "../features/status/api";
import { useFetch } from "../features/status/useFetch";

export function BusPage() {
  const [direction, setDirection] = useState<"home" | "school" | null>(null);
  return (
    <section>
      <SearchHeader />
      <p className="eyebrow bus-label">버스 안내 · 예시 데이터</p>
      <div className="commute-card">
        <button
          onClick={() => setDirection("home")}
          aria-pressed={direction === "home"}
        >
          <span className="commute-label">
            <IconHome size={17} />
            집으로
            <IconChevronRight size={16} />
          </span>
          <strong>43분</strong>
          <span className="bus-row">
            <span>
              <i>마을</i> 1
            </span>
            <b>3분</b>
          </span>
          <span className="bus-row muted">
            충대서문<b>33분</b>
          </span>
        </button>
        <button
          onClick={() => setDirection("school")}
          aria-pressed={direction === "school"}
        >
          <span className="commute-label">
            <IconBackpack size={17} />
            학교로
            <IconChevronRight size={16} />
          </span>
          <p className="muted">근처에 있습니다</p>
        </button>
      </div>
      <CampusMap />
      <div className="bus-panel" hidden={!direction}>
        {direction && (
          <div className="route-info">
            <IconBackpack size={30} />
            <h2>
              {direction === "home" ? "집으로 가는 길" : "학교로 가는 길"}
            </h2>
            <p>
              {direction === "home"
                ? "충대서문 → 마을버스 1번 → 목적지"
                : "충남대학교 인근 정류장"}
            </p>
            <p className="muted">
              Figma의 경로 예시입니다.
              <br />
              실시간 도착 정보와 길 안내는 아직 연결되지 않았어요.
            </p>
            <button className="text-button" onClick={() => setDirection(null)}>
              닫기
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export function FoodPage() {
  const { data, error, loading, refetch } = useFetch(fetchCategories);
  const [favorites] = useSaved<string[]>(
    "chacha-favorites",
    [],
    (v) => Array.isArray(v) && v.every((x) => typeof x === "string"),
  );
  const [searchParams] = useSearchParams();
  const [onlySaved, setOnlySaved] = useState(searchParams.get("saved") === "1");
  const places = data?.filter(
    (place) => !onlySaved || favorites.includes(place.id),
  );
  return (
    <section>
      <SearchHeader />
      <div className="page-heading">
        <h1>오늘, 어디서 먹을까요?</h1>
        <p>식사 공간을 확인하고 나에게 맞게 선택하세요</p>
      </div>
      <div className="segmented">
        <button
          className={!onlySaved ? "active" : ""}
          onClick={() => setOnlySaved(false)}
        >
          전체 식당
        </button>
        <button
          className={onlySaved ? "active" : ""}
          onClick={() => setOnlySaved(true)}
        >
          <IconStar size={16} /> 즐겨찾기
        </button>
      </div>
      {loading && <p role="status">불러오는 중...</p>}
      {error && (
        <p role="alert">
          정보를 불러오지 못했어요. <button onClick={refetch}>다시 시도</button>
        </p>
      )}
      <div className="place-list">
        {places?.map((place) => (
          <Link
            to={`/category/${place.id}`}
            className="place-card"
            key={place.id}
          >
            <IconToolsKitchen2 />
            <span>
              <strong>{place.label}</strong>
              <small>구역별 혼잡도 확인</small>
            </span>
            <IconChevronRight size={20} />
          </Link>
        ))}
      </div>
      {places?.length === 0 && (
        <p className="empty">
          즐겨찾기가 비어 있어요.
          <br />
          혼잡도 화면의 별을 눌러 추가하세요.
        </p>
      )}
    </section>
  );
}

const days = ["월", "화", "수", "목", "금", "토", "일"];
export function TimetablePage() {
  const [lessons, save, saveError] = useSaved<Lesson[]>(
    "chacha-lessons",
    [],
    (v) => Array.isArray(v) && v.every(isLesson),
  );
  const [importOpen, setImportOpen] = useState(false);
  const subjectTitles = [...new Set(lessons.map((l) => l.title.trim()))].sort();
  const [link, setLink] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [preview, setPreview] = useState<ReturnType<
    typeof parseTimetable
  > | null>(null);
  const [untimed, saveUntimed] = useSaved<string[]>(
    "chacha-untimed",
    [],
    (v) => Array.isArray(v) && v.every((x) => typeof x === "string"),
  );
  const firstHour = Math.min(8, ...lessons.map((l) => Math.floor(l.start)));
  const dayCount = lessons.some((l) => l.day > 4) ? 7 : 5;
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (editing) dialog.current?.showModal();
  }, [editing?.id]);
  return (
    <section>
      <SearchHeader />
      <div className="timetable-title">
        <h1>내 시간표</h1>
        <div className="timetable-actions">
          <button
            className="round"
            aria-label="시간표 링크 가져오기"
            title="시간표 링크 가져오기"
            aria-expanded={importOpen}
            aria-controls="timetable-import"
            onClick={() => setImportOpen(!importOpen)}
          >
            <IconLink size={23} />
          </button>
          <button
            className="round"
            aria-label="수업 추가"
            onClick={() => {
              setEditing({
                id: crypto.randomUUID(),
                title: "",
                day: 0,
                start: 9,
                end: 10,
              });
              setError("");
            }}
          >
            <IconPlus size={27} />
          </button>
        </div>
      </div>
      <p className="eyebrow">
        {lessons.length
          ? "이 기기에 저장된 시간표"
          : "등록된 수업 없음 · + 버튼으로 수업 추가"}
      </p>
      <div id="timetable-import" hidden={!importOpen}>
        <form
          className="profile-form"
          onSubmit={async (e) => {
            e.preventDefault();
            setImportError("");
            setPreview(null);
            try {
              shareIdentifier(link);
              setImporting(true);
              const response = await fetch("/api/everytime", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: link.trim() }),
                signal: AbortSignal.timeout(15000),
              });
              if (
                !response.headers
                  .get("content-type")
                  ?.includes("application/json")
              )
                throw new Error("시간표 연동 서버가 연결되지 않았어요.");
              const data = await response.json();
              if (!response.ok)
                throw new Error(data.error || "시간표를 가져오지 못했어요.");
              if (typeof data.xml !== "string")
                throw new Error("잘못된 서버 응답입니다.");
              setPreview(parseTimetable(data.xml));
            } catch (error) {
              setImportError(
                error instanceof Error
                  ? error.message
                  : "시간표를 가져오지 못했어요.",
              );
            } finally {
              setImporting(false);
            }
          }}
        >
          <label>
            에브리타임 시간표 링크
            <input
              type="url"
              required
              value={link}
              onChange={(e) => {
                setLink(e.target.value);
                setPreview(null);
              }}
              placeholder="https://everytime.kr/@…"
              disabled={importing}
            />
          </label>
          <button className="primary" disabled={importing}>
            {importing ? "불러오는 중…" : "링크로 불러오기"}
          </button>
          <small>
            공개 시간표를 가져와 이 기기에 저장합니다. 자동 갱신되지 않아요.
          </small>
        </form>
        {importError && <p role="alert">{importError}</p>}
        {preview && (
          <div className="notice">
            <h2>가져올 시간표 확인</h2>
            <ul>
              {preview.lessons.map((l) => (
                <li key={l.id}>
                  {days[l.day]} {formatTime(l.start)}–{formatTime(l.end)} ·{" "}
                  {l.title}
                </li>
              ))}
              {preview.untimed.map((name, i) => (
                <li key={i}>시간 미지정 · {name}</li>
              ))}
            </ul>
            <p>
              저장하면 기존 수업 {lessons.length}개와 시간 미지정 수업{" "}
              {untimed.length}개를 교체합니다.
            </p>
            <button
              className="primary"
              onClick={() => {
                const old = untimed;
                if (!saveUntimed(preview.untimed)) {
                  setImportError("저장 공간을 확인해 주세요.");
                  return;
                }
                if (save(preview.lessons)) {
                  setPreview(null);
                  setImportOpen(false);
                } else saveUntimed(old);
              }}
            >
              확인 후 시간표 교체
            </button>
            <button className="text-button" onClick={() => setPreview(null)}>
              취소
            </button>
          </div>
        )}
      </div>
      {untimed.length > 0 && (
        <p className="notice">시간 미지정: {untimed.join(", ")}</p>
      )}
      <div className="timetable">
        <div
          className="weekdays"
          style={{ gridTemplateColumns: `42px repeat(${dayCount}, 1fr)` }}
        >
          <span />
          {days.slice(0, dayCount).map((day) => (
            <b key={day}>{day}</b>
          ))}
        </div>
        <div className="calendar-body">
          <div className="hours">
            {Array.from({ length: (24 - firstHour) * 2 }, (_, i) => (
              <span key={i}>{formatTime(firstHour + i / 2)}</span>
            ))}
          </div>
          <div
            className="calendar-grid"
            style={{ height: (24 - firstHour) * 60 }}
          >
            {lessons.map((lesson) => (
              <button
                className="lesson"
                key={lesson.id}
                style={{
                  backgroundColor: `hsl(${(subjectTitles.indexOf(lesson.title.trim()) * 137.508 + 255) % 360} 34% 27%)`,
                  borderColor: `hsl(${(subjectTitles.indexOf(lesson.title.trim()) * 137.508 + 255) % 360} 40% 48%)`,
                  left: `${(lesson.day * 100) / dayCount}%`,
                  width: `${100 / dayCount}%`,
                  top: (lesson.start - firstHour) * 60,
                  height: (lesson.end - lesson.start) * 60,
                }}
                onClick={() => {
                  setEditing(lesson);
                  setError("");
                }}
              >
                <strong>{lesson.title}</strong>
                <small>
                  {formatTime(lesson.start)}–{formatTime(lesson.end)}
                </small>
              </button>
            ))}
          </div>
        </div>
      </div>
      {saveError && <p role="alert">{saveError}</p>}
      {editing && (
        <dialog
          ref={dialog}
          className="sheet"
          aria-labelledby="lesson-title"
          onCancel={() => setEditing(null)}
        >
          <div className="sheet-heading">
            <h2 id="lesson-title">수업 편집</h2>
            <button
              className="round"
              aria-label="닫기"
              onClick={() => setEditing(null)}
            >
              <IconX />
            </button>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!isLesson(editing) || !editing.title.trim()) {
                setError("수업명과 올바른 시작·종료 시간을 입력해 주세요.");
                return;
              }
              if (
                lessons.some(
                  (l) =>
                    l.id !== editing.id &&
                    l.day === editing.day &&
                    l.start < editing.end &&
                    editing.start < l.end,
                )
              ) {
                setError("같은 시간에 이미 수업이 있어요.");
                return;
              }
              if (
                save([
                  ...lessons.filter((l) => l.id !== editing.id),
                  { ...editing, title: editing.title.trim() },
                ])
              )
                setEditing(null);
            }}
          >
            <label>
              수업명
              <input
                required
                maxLength={40}
                autoFocus
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </label>
            <label>
              요일
              <select
                value={editing.day}
                onChange={(e) =>
                  setEditing({ ...editing, day: Number(e.target.value) })
                }
              >
                {days.map((day, i) => (
                  <option key={day} value={i}>
                    {day}요일
                  </option>
                ))}
              </select>
            </label>
            <div className="form-row">
              <label>
                시작 시간
                <input
                  type="time"
                  step="1800"
                  min="00:00"
                  max="23:30"
                  required
                  value={formatTime(editing.start)}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      start: e.target.value
                        .split(":")
                        .reduce((h, v, i) => h + Number(v) / (i ? 60 : 1), 0),
                    })
                  }
                />
              </label>
              <label>
                종료 시간
                <input
                  type="time"
                  step="1800"
                  min="00:30"
                  max="23:59"
                  required
                  value={formatTime(editing.end)}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      end: e.target.value
                        .split(":")
                        .reduce((h, v, i) => h + Number(v) / (i ? 60 : 1), 0),
                    })
                  }
                />
              </label>
            </div>
            {(error || saveError) && (
              <p role="alert" className="error">
                {error || saveError}
              </p>
            )}
            <button className="primary" type="submit">
              저장
            </button>
            {lessons.some((l) => l.id === editing.id) && (
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  if (save(lessons.filter((l) => l.id !== editing.id)))
                    setEditing(null);
                }}
              >
                이 수업 삭제
              </button>
            )}
          </form>
        </dialog>
      )}
    </section>
  );
}

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function MenuPage() {
  const [profile, save, saveError] = useSaved(
    "chacha-profile",
    { name: "박지훈", department: "26 · 컴퓨터인공지능학부" },
    (v) =>
      !!v &&
      typeof v === "object" &&
      typeof (v as { name: unknown }).name === "string" &&
      typeof (v as { department: unknown }).department === "string",
  );
  const [editing, setEditing] = useState(false);
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installHelp, setInstallHelp] = useState(false);
  useEffect(() => {
    const handle = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallPrompt);
    };
    window.addEventListener("beforeinstallprompt", handle);
    return () => window.removeEventListener("beforeinstallprompt", handle);
  }, []);
  return (
    <section>
      <SearchHeader />
      <div className="profile">
        <div className="avatar" aria-hidden="true" />
        <div>
          <h1>{profile.name}</h1>
          <p>{profile.department}</p>
        </div>
        <button
          className="round"
          aria-label="프로필 설정"
          onClick={() => setEditing(!editing)}
        >
          <IconSettings size={24} />
        </button>
      </div>
      {editing && (
        <form
          className="profile-form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            if (
              save({
                name: String(form.get("name")).trim(),
                department: String(form.get("department")).trim(),
              })
            )
              setEditing(false);
          }}
        >
          <label>
            이름
            <input
              name="name"
              required
              maxLength={30}
              defaultValue={profile.name}
            />
          </label>
          <label>
            학번 · 학과
            <input
              name="department"
              required
              maxLength={60}
              defaultValue={profile.department}
            />
          </label>
          <button className="primary">저장</button>
        </form>
      )}
      {saveError && <p role="alert">{saveError}</p>}
      <button
        className="menu-row"
        onClick={async () => {
          if (prompt) {
            try {
              await prompt.prompt();
              await prompt.userChoice;
              setPrompt(null);
            } catch {
              setInstallHelp(true);
            }
          } else setInstallHelp(!installHelp);
        }}
      >
        <IconDownload size={22} />
        <span>홈 화면에 추가</span>
        <IconChevronRight size={18} />
      </button>
      {installHelp && (
        <p className="notice">
          iPhone: Safari의 공유 → 홈 화면에 추가.
          <br />
          Android: 브라우저 메뉴 → 앱 설치 / 홈 화면에 추가.
          <br />
          이미 설치했다면 홈 화면에서 실행해 주세요.
        </p>
      )}
      <Link className="menu-row" to="/food/places?saved=1">
        <IconStar size={22} />
        <span>즐겨찾는 식사 공간</span>
        <IconChevronRight size={18} />
      </Link>
      <p className="app-info">
        여기, 차차 <span>chachaMap</span>
        <br />
        충남대학교 · 어드벤처디자인 5조
      </p>
    </section>
  );
}
