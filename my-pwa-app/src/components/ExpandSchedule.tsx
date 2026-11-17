import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { IconCalendarMonth, IconChevronDown } from "@tabler/icons-react";
import { type Lesson, formatTime } from "../features/timetable/model";
import { useSprings } from "./motion/useSprings";
import { clamp, presets as p } from "./motion/spring";
import "./motion/components.css";
export function ExpandSchedule({ lessons }: { lessons: Lesson[] }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    details = useRef<HTMLDivElement>(null);
  const id = useId();
  const motion = useSprings({ p: [0, ...p.expand], a: [0, ...p.detail] });
  motion.frame.current = (s) => {
    if (!root.current || !details.current) return;
    root.current.style.height = `${72 + s.p.x * (112 + details.current.offsetHeight)}px`;
    root.current.style.setProperty("--expand", `${clamp(s.p.x)}`);
    root.current.style.setProperty("--detail-opacity", `${clamp(s.a.x)}`);
  };
  useEffect(() => {
    motion.values.p.t = open ? 1 : 0;
    if (!open) motion.values.a.t = 0;
    const timer = window.setTimeout(
      () => {
        motion.values.a.t = open ? 1 : 0;
        motion.wake.current();
      },
      open ? 160 : 0,
    );
    motion.wake.current();
    return () => clearTimeout(timer);
  }, [open]);
  useEffect(() => {
    const observer = new ResizeObserver(() => motion.wake.current());
    if (details.current) observer.observe(details.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={root} className="expand-schedule">
      <button
        className="expand-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
      >
        <span className="expand-art">
          <IconCalendarMonth size={28} />
        </span>
        <span className="expand-heading">
          <strong>오늘의 시간표</strong>
          <small>
            {lessons.length
              ? `${lessons.length}개 수업 · ${formatTime(lessons[0].start)} 시작`
              : "등록된 수업 없음"}
          </small>
        </span>
        <IconChevronDown className="expand-chevron" size={20} />
      </button>
      <div
        ref={details}
        id={id}
        className="expand-details"
        inert={!open}
        aria-hidden={!open}
      >
        {lessons.length ? (
          lessons.map((l) => (
            <Link className="expand-lesson" key={l.id} to="/timetable">
              <time>
                {formatTime(l.start)}–{formatTime(l.end)}
              </time>
              <strong>{l.title}</strong>
            </Link>
          ))
        ) : (
          <p>시간표에 수업을 추가하거나 에브리타임 링크를 가져오세요.</p>
        )}
        <Link className="expand-action" to="/timetable">
          시간표 열기
        </Link>
      </div>
    </div>
  );
}
