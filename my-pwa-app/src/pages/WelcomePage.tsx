import { Link } from "react-router-dom";
import {
  IconArrowUpRight,
  IconChevronRight,
  IconToolsKitchen2,
  IconCalendarMonth,
  IconBusStop,
} from "@tabler/icons-react";
import "./WelcomePage.css";

export default function WelcomePage() {
  return (
    <section className="welcome-page">
      <header className="welcome-header">
        <Link className="wordmark" to="/">
          밥길<span>bapgil</span>
        </Link>
        <Link to="/login">
          로그인 <IconChevronRight size={15} />
        </Link>
      </header>
      <div className="welcome-intro">
        <p>충남대학교의 식사와 일상</p>
        <h1>
          오늘 밥 먹을 곳,
          <br />
          가기 전에.
        </h1>
        <p>
          학생회관의 구역별 혼잡도를 살펴보고
          <br />
          오늘의 캠퍼스 생활을 가볍게 준비하세요.
        </p>
      </div>
      <div className="welcome-preview">
        <div className="welcome-preview-heading">
          <span>
            <IconToolsKitchen2 size={19} /> 제 1 학생회관
          </span>
          <small>화면 예시</small>
        </div>
        <div className="welcome-plan" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="welcome-preview-caption">
          <span>
            <i /> 식사구역 3
          </span>
          <strong>원활</strong>
        </div>
        <p>구역마다 다른 혼잡도, 한눈에.</p>
      </div>
      <div className="welcome-actions">
        <Link className="welcome-primary" to="/home">
          로그인 없이 시작하기 <IconArrowUpRight size={21} />
        </Link>
        <small>시간표와 즐겨찾기는 이 브라우저에 저장됩니다.</small>
      </div>
      <div className="welcome-features">
        <div>
          <IconToolsKitchen2 />
          <span>
            <strong>어디서 먹을지</strong>
            <p>혼잡도를 보고, 자주 가는 구역은 즐겨찾기로.</p>
          </span>
        </div>
        <div>
          <IconCalendarMonth />
          <span>
            <strong>다음 수업은 언제인지</strong>
            <p>내 시간표와 현재 시간을 함께 확인해요.</p>
          </span>
        </div>
        <div>
          <IconBusStop />
          <span>
            <strong>캠퍼스를 오가는 길</strong>
            <p>버스 안내와 지도 링크를 한곳에서.</p>
          </span>
        </div>
      </div>
      <footer className="welcome-footer">
        <strong>밥길</strong>
        <span>충남대학교 · 어드벤처디자인 5조</span>
      </footer>
    </section>
  );
}
