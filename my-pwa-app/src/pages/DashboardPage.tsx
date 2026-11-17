import { ZONE_FAVORITES_KEY, zoneKey } from "../features/status/favorites";
import { ExpandSchedule } from "../components/ExpandSchedule";
import { Link } from "react-router-dom";
import {
  IconArrowUpRight,
  IconBusStop,
  IconCalendarMonth,
  IconChevronRight,
  IconMapPin,
  IconStar,
  IconToolsKitchen2,
} from "@tabler/icons-react";
import { fetchCategories, isDemo } from "../features/status/api";
import { useFetch } from "../features/status/useFetch";
import { useSaved } from "../useSaved";
import { isLesson, type Lesson } from "../features/timetable/model";

export default function DashboardPage() {
  const { data, loading, error, refetch } = useFetch(fetchCategories);
  const [lessons] = useSaved<Lesson[]>(
    "chacha-lessons",
    [],
    (value) => Array.isArray(value) && value.every(isLesson),
  );
  const [favorites] = useSaved<string[]>(
    ZONE_FAVORITES_KEY,
    [],
    (value) =>
      Array.isArray(value) && value.every((item) => typeof item === "string"),
  );
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    weekday: "short",
  }).format(now);
  const day = ["Mon", "Tue", "Wed", "Thu", "Fri"].indexOf(weekday);
  const todayLessons = lessons
    .filter((lesson) => lesson.day === day)
    .sort((a, b) => a.start - b.start);
  const date = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(now);
  return (
    <section className="dashboard">
      <header className="dashboard-header">
        <Link className="wordmark" to="/">
          밥길<span>bapgil</span>
        </Link>
      </header>
      <div className="dashboard-greeting">
        <p>{date}</p>
        <h1>
          오늘의 캠퍼스,
          <br />
          한눈에 밥길.
        </h1>
      </div>
      <Link className="dashboard-hero" to="/food">
        <div className="hero-orb" aria-hidden="true" />
        <span className="hero-kicker">
          <IconToolsKitchen2 size={17} />{" "}
          {isDemo ? "학생회관 · 예시 혼잡도" : "학생회관 혼잡도"}
        </span>
        <h2>
          밥 먹으러 가기 전,
          <br />
          지금 얼마나 붐빌까요?
        </h2>
        <span className="hero-bottom">
          학생회관 혼잡도 확인{" "}
          <span className="hero-arrow">
            <IconArrowUpRight size={24} />
          </span>
        </span>
      </Link>
      <div className="dashboard-shortcuts">
        <Link to="/bus">
          <IconBusStop />
          <span>버스</span>
        </Link>
        <Link to="/food/places">
          <IconToolsKitchen2 />
          <span>식사 공간</span>
        </Link>
        <Link to="/timetable">
          <IconCalendarMonth />
          <span>시간표</span>
        </Link>
        <Link to="/food/places?saved=1">
          <IconStar />
          <span>즐겨찾기</span>
        </Link>
      </div>
      <ExpandSchedule lessons={todayLessons} />
      <div className="dashboard-section-heading">
        <h2>캠퍼스 둘러보기</h2>
        <span>{isDemo ? "예시 정보" : "식사 공간"}</span>
      </div>
      <div className="dashboard-places">
        {loading && <p role="status">불러오는 중...</p>}
        {error && (
          <p role="alert">
            장소를 불러오지 못했어요.{" "}
            <button className="text-button" onClick={refetch}>
              다시 시도
            </button>
          </p>
        )}
        {data?.map((place) => (
          <Link to={`/category/${place.id}`} key={place.id}>
            <span className="dashboard-pin">
              <IconMapPin size={20} />
            </span>
            <span>
              <strong>{place.label}</strong>
              <small>{place.items.length}개 구역 살펴보기</small>
            </span>
            {place.items.some(item => favorites.includes(zoneKey(place.id, item.id))) ? (
              <IconStar size={18} className="saved-star" />
            ) : (
              <IconChevronRight size={18} />
            )}
          </Link>
        ))}
      </div>
      <p className="dashboard-signoff">조금 더 편한 캠퍼스 생활.</p>
    </section>
  );
}
