import { isEvaluation } from "./evaluation";
import {
  BrowserRouter,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";
import { RubberDock } from "./components/RubberDock";
import DashboardPage from "./pages/DashboardPage";
import CategoryPage from "./pages/CategoryPage";
import HomePage from "./pages/HomePage";
import { BusPage, FoodPage, MenuPage, TimetablePage } from "./pages/MorePages";

import { useSaved } from "./useSaved";

function AppContent() {
  const { pathname } = useLocation();
  const [theme, saveTheme, themeError] = useSaved<"light" | "dark">(
    "chacha-theme",
    "light",
    (v) => v === "light" || v === "dark",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "light" ? "#f5f5f7" : "#101010");
  }, [theme]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const activeTab =
    pathname.startsWith("/category") || pathname.startsWith("/food")
      ? 2
      : pathname.startsWith("/bus")
        ? 1
        : pathname.startsWith("/timetable")
          ? 3
          : pathname.startsWith("/menu")
            ? 4
            : 0;
  return (
    <>
      <a className="skip-link" href="#content">
        본문으로 이동
      </a>
      <main id="content">
        {isEvaluation && <aside className="evaluation-notice" aria-label="형성평가 데모 안내">
          <strong>밥길 체험용 데모</strong>
          <span>혼잡도·버스는 예시입니다. 실제 이동 판단에 사용하지 마세요. 입력 내용은 이 브라우저에만 저장됩니다.</span>
        </aside>}
        <div key={pathname} className="page-transition">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/search" element={<HomePage />} />
            <Route path="/category/:id" element={<CategoryPage />} />
            <Route path="/bus" element={<BusPage />} />
            <Route path="/food" element={<FoodPage />} />
            <Route path="/food/places" element={<FoodPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route
              path="/menu"
              element={
                <MenuPage
                  theme={theme}
                  onThemeChange={saveTheme}
                  themeError={themeError}
                />
              }
            />
            <Route
              path="*"
              element={
                <section className="empty">
                  <h1>페이지를 찾을 수 없어요</h1>
                  <Link to="/">홈으로 돌아가기</Link>
                </section>
              }
            />
          </Routes>
        </div>
      </main>
      <RubberDock active={activeTab} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
