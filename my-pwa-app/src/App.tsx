import {
  BrowserRouter,
  Route,
  Routes,
  Link,
  useLocation,
} from "react-router-dom";
import {
  IconHome,
  IconBusStop,
  IconToolsKitchen2,
  IconCalendarMonth,
  IconMenu2,
} from "@tabler/icons-react";
import type { CSSProperties } from "react";
import DashboardPage from "./pages/DashboardPage";
import CategoryPage from "./pages/CategoryPage";
import HomePage from "./pages/HomePage";
import { BusPage, FoodPage, MenuPage, TimetablePage } from "./pages/MorePages";

const tabs = [
  { to: "/", label: "홈", Icon: IconHome },
  { to: "/bus", label: "버스", Icon: IconBusStop },
  { to: "/food", label: "식사", Icon: IconToolsKitchen2 },
  { to: "/timetable", label: "시간표", Icon: IconCalendarMonth },
  { to: "/menu", label: "메뉴", Icon: IconMenu2 },
];

function AppContent() {
  const { pathname } = useLocation();
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
        <div key={pathname} className="page-transition">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/search" element={<HomePage />} />
            <Route path="/category/:id" element={<CategoryPage />} />
            <Route path="/bus" element={<BusPage />} />
            <Route path="/food" element={<CategoryPage />} />
            <Route path="/food/places" element={<FoodPage />} />
            <Route path="/timetable" element={<TimetablePage />} />
            <Route path="/menu" element={<MenuPage />} />
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
      <nav
        className="bottom-nav"
        aria-label="주 메뉴"
        style={{ "--active-tab": activeTab } as CSSProperties}
      >
        <span className="nav-indicator" aria-hidden="true" />
        {tabs.map(({ to, label, Icon }, index) => (
          <Link
            key={to}
            to={to}
            className={activeTab === index ? "active" : ""}
            aria-current={activeTab === index ? "page" : undefined}
          >
            <Icon size={27} stroke={1.7} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
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
