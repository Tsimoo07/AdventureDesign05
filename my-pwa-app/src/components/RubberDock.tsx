import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IconHome,
  IconBusStop,
  IconToolsKitchen2,
  IconCalendarMonth,
  IconMenu2,
} from "@tabler/icons-react";
import { useSprings } from "./motion/useSprings";
import { clamp, presets as p } from "./motion/spring";
import "./motion/components.css";
const tabs = [
  {
    to: "/",
    label: "홈",
    Icon: IconHome,
    text: "오늘의 수업과 학생회관 혼잡도를 한눈에 확인하세요.",
  },
  {
    to: "/bus",
    label: "버스",
    Icon: IconBusStop,
    text: "캠퍼스 정류장과 버스 운행 정보를 확인하세요.",
  },
  {
    to: "/food",
    label: "식사",
    Icon: IconToolsKitchen2,
    text: "학생회관을 고르고 구역별 혼잡도를 확인하세요.",
  },
  {
    to: "/timetable",
    label: "시간표",
    Icon: IconCalendarMonth,
    text: "수업을 추가하거나 에브리타임 링크로 시간표를 가져오세요.",
  },
  {
    to: "/menu",
    label: "메뉴",
    Icon: IconMenu2,
    text: "화면 모드를 바꾸고 즐겨찾는 식사 공간을 확인하세요.",
  },
];
export function RubberDock({ active }: { active: number }) {
  const nav = useNavigate();
  const root = useRef<HTMLElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const drag = useRef<{
    id: number;
    start: number;
    live: boolean;
    index: number;
  } | null>(null);
  const suppress = useRef(false);
  const measuredWidth = useRef<number | null>(null);
  const motion = useSprings({
    l: [0, ...p.dockLead],
    r: [56, ...p.dockLead],
    h: [68, ...p.close],
    pop: [1, ...p.pop],
  });
  const move = (index: number, dragging = false, snap = false) => {
    const width = (bar.current?.clientWidth ?? 340) / 5;
    const left = index * width;
    const right = left + width;
    const forward = left > motion.values.l.t;
    const lead = dragging ? p.dragLead : p.dockLead,
      trail = dragging ? p.dragTrail : p.dockTrail;
    [motion.values.l.k, motion.values.l.c] = forward ? trail : lead;
    [motion.values.r.k, motion.values.r.c] = forward ? lead : trail;
    motion.values.l.t = left;
    motion.values.r.t = right;
    if (snap) {
      motion.values.l.x = left;
      motion.values.r.x = right;
    }
    motion.wake.current();
  };
  motion.frame.current = (s) => {
    if (!root.current || !bar.current) return;
    const width = Math.max(24, s.r.x - s.l.x),
      normal = bar.current.clientWidth / 5;
    const height = 54 * clamp(1 / Math.sqrt(width / normal), 0.66, 1.1);
    root.current.style.height = `${Math.max(68, s.h.x)}px`;
    root.current.style.setProperty("--dock-left", `${s.l.x}px`);
    root.current.style.setProperty("--dock-width", `${width}px`);
    root.current.style.setProperty("--dock-height", `${height}px`);
    root.current.style.setProperty("--dock-top", `${(54 - height) / 2}px`);
    root.current.style.setProperty("--dock-pop", `${s.pop.x}`);
  };
  useEffect(() => {
    move(active);
    motion.values.pop.v = -3.2;
    setExpanded(false);
  }, [active]);
  useEffect(() => {
    const resize = new ResizeObserver(() => {
      const width = bar.current?.clientWidth;
      // Observers emit an initial notification on every subscription, including tab changes.
      if (width === undefined || width === measuredWidth.current) return;
      measuredWidth.current = width;
      move(active, false, true);
    });
    if (bar.current) resize.observe(bar.current);
    return () => resize.disconnect();
  }, [active]);
  useEffect(() => {
    motion.values.h.t = expanded ? 184 : 68;
    [motion.values.h.k, motion.values.h.c] = expanded ? p.openH : p.close;
    motion.wake.current();
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setExpanded(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [expanded]);
  const end = (cancel = false) => {
    const d = drag.current;
    drag.current = null;
    if (!d?.live) return;
    suppress.current = true;
    if (!cancel) nav(tabs[clamp(Math.round(d.index), 0, 4)].to);
    move(cancel ? active : clamp(Math.round(d.index), 0, 4));
  };
  return (
    <nav
      ref={root}
      className="bottom-nav rubber-dock"
      aria-label="주 메뉴"
      onKeyDown={(e) => {
        if (e.key === "Escape") setExpanded(false);
      }}
    >
      <div className="dock-detail" inert={!expanded} aria-hidden={!expanded}>
        <strong>{tabs[active].label}</strong>
        <p>{tabs[active].text}</p>
        <button onClick={() => setExpanded(false)}>접기</button>
      </div>
      <div
        className="rubber-tabs"
        ref={bar}
        onPointerDown={(e) => {
          suppress.current = false;
          drag.current = {
            id: e.pointerId,
            start: e.clientX,
            live: false,
            index: active,
          };
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || d.id !== e.pointerId) return;
          if (!d.live && Math.abs(e.clientX - d.start) > 4) {
            d.live = true;
            e.currentTarget.setPointerCapture(e.pointerId);
          }
          if (!d.live) return;
          const raw =
            (e.clientX - e.currentTarget.getBoundingClientRect().left) /
              (e.currentTarget.clientWidth / 5) -
            0.5;
          d.index =
            raw < 0
              ? (-0.55 * -raw) / (1 + -raw)
              : raw > 4
                ? 4 + (0.55 * (raw - 4)) / (1 + raw - 4)
                : raw;
          move(d.index, true);
        }}
        onPointerUp={() => end()}
        onPointerCancel={() => end(true)}
        onLostPointerCapture={() => {
          if (drag.current) end(true);
        }}
      >
        <span className="rubber-indicator" aria-hidden="true" />
        {tabs.map(({ to, label, Icon }, i) => (
          <Link
            key={to}
            to={to}
            className={active === i ? "active" : ""}
            aria-current={active === i ? "page" : undefined}
            aria-label={`${label}${active === i ? ", 다시 누르면 안내 펼치기" : ""}`}
            onClick={(e) => {
              if (suppress.current) {
                e.preventDefault();
                suppress.current = false;
                return;
              }
              if (i === active) {
                e.preventDefault();
                setExpanded((v) => !v);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                const next = clamp(i + (e.key === "ArrowRight" ? 1 : -1), 0, 4);
                (
                  bar.current?.querySelectorAll("a")[next] as HTMLElement
                )?.focus();
                nav(tabs[next].to);
              }
            }}
          >
            <Icon size={27} stroke={1.7} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
