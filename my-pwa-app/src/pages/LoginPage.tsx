import { useState } from "react";
import { Link } from "react-router-dom";
import { IconChevronLeft, IconBrandGoogle } from "@tabler/icons-react";
import "./WelcomePage.css";

export default function LoginPage() {
  const [message, setMessage] = useState("");
  return (
    <section className="login-page">
      <header className="welcome-header">
        <Link to="/" aria-label="밥길 소개로 돌아가기" className="round">
          <IconChevronLeft size={24} />
        </Link>
        <Link className="wordmark" to="/">
          밥길<span>bapgil</span>
        </Link>
      </header>
      <div className="login-heading">
        <h1>
          반가워요.
          <br />
          여기는 밥길이에요.
        </h1>
        <p>
          밥 먹을 곳부터 오늘의 시간표까지,
          <br />
          캠퍼스의 하루를 함께 준비해요.
        </p>
      </div>
      <div className="login-demo-notice">
        <strong>로그인은 준비 중이에요.</strong>
        <p>
          현재는 로그인 화면을 미리 볼 수 있어요.
          <br />
          계정 없이 모든 데모 기능을 체험할 수 있습니다.
        </p>
      </div>
      <button
        type="button"
        className="login-provider"
        aria-describedby="login-status"
        onClick={() =>
          setMessage(
            "Google 로그인은 아직 연결되지 않았어요. 아래에서 로그인 없이 체험해 주세요.",
          )
        }
      >
        <IconBrandGoogle aria-hidden="true" />
        Google로 계속하기
      </button>
      <p id="login-status" className="login-message" role="status">
        {message}
      </p>
      <Link className="welcome-primary" to="/home">
        로그인 없이 체험하기
      </Link>
      <Link className="login-guest" to="/">
        밥길 소개 보기
      </Link>
      <footer className="welcome-footer">
        <span>
          지금 저장하는 시간표와 즐겨찾기는
          <br />이 브라우저에만 보관됩니다.
        </span>
      </footer>
    </section>
  );
}
