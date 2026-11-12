import { Link } from "react-router-dom";
import {
  IconArrowUpRight,
  IconBusStop,
  IconCalendarMonth,
  IconChevronRight,
  IconMapPin,
  IconSearch,
  IconStar,
  IconToolsKitchen2,
} from "@tabler/icons-react";
import { fetchCategories, isDemo } from "../features/status/api";
import { useFetch } from "../features/status/useFetch";
import { useSaved } from "../useSaved";
import { isLesson, formatTime, type Lesson } from "../features/timetable/model";

export default function DashboardPage() {
  const { data, loading, error, refetch } = useFetch(fetchCategories);
  const [lessons] = useSaved<Lesson[]>(
    "chacha-lessons",
    [],
    (value) => Array.isArray(value) && value.every(isLesson),
  );
  const [favorites] = useSaved<string[]>(
    "chacha-favorites",
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
          여기, 차차<span>chachaMap</span>
        </Link>
        <Link className="round" to="/search" aria-label="장소 검색">
          <IconSearch size={25} />
        </Link>
      </header>
      <div className="dashboard-greeting">
        <p>{date}</p>
        <h1>
          오늘의 캠퍼스,
          <br />
          한눈에 차차.
        </h1>
      </div>
      <Link className="dashboard-hero" to="/food">
        <div className="hero-orb" aria-hidden="true" />
        <span className="hero-kicker">
          <IconToolsKitchen2 size={17} /> CAMPUS DINING
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
      <div className="dashboard-section-heading">
        <h2>오늘의 시간표</h2>
        <Link to="/timetable" aria-label="전체 시간표 보기">
          <IconChevronRight size={21} />
        </Link>
      </div>
      <div className="dashboard-schedule">
        {todayLessons.length ? (
          todayLessons.map((lesson) => (
            <Link key={lesson.id} to="/timetable" className="dashboard-lesson">
              <span>
                {formatTime(lesson.start)}
                <small>{formatTime(lesson.end)}</small>
              </span>
              <strong>{lesson.title}</strong>
              <IconChevronRight size={18} />
            </Link>
          ))
        ) : (
          <Link to="/timetable" className="dashboard-empty">
            <span className="dashboard-calendar">
              <IconCalendarMonth size={25} />
            </span>
            <span>
              <strong>
                {lessons.length
                  ? "오늘은 등록된 수업이 없어요"
                  : "나만의 시간표를 채워보세요"}
              </strong>
              <small>
                {lessons.length
                  ? "잠깐의 여유, 캠퍼스에서 즐겨요."
                  : "수업을 추가하면 여기에 모아드려요."}
              </small>
            </span>
            <IconChevronRight size={18} />
          </Link>
        )}
      </div>
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
            {favorites.includes(place.id) ? (
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
