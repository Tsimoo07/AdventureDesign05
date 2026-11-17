import { useEffect, useId, useRef, useState } from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import { useSprings } from "./motion/useSprings";
import { clamp, presets as p } from "./motion/spring";
import "./motion/components.css";

export function SpringDropdown({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  const motion = useSprings({
    h: [0, ...p.menu],
    o: [0, ...p.fade],
    c: [0, ...p.chevron],
    top: [6, ...p.lead],
    bottom: [50, ...p.lead],
    roll: [1, ...p.roll],
  });
  const selected =
    options.find((o) => o.id === value)?.label ?? "학생회관 선택";
  motion.frame.current = (s) => {
    const el = root.current;
    if (!el) return;
    el.style.setProperty("--menu-h", `${Math.max(0, s.h.x)}px`);
    el.style.setProperty("--menu-o", `${clamp(s.o.x)}`);
    el.style.setProperty("--chevron", `${s.c.x * 180}deg`);
    el.style.setProperty("--highlight-y", `${s.top.x}px`);
    el.style.setProperty(
      "--highlight-h",
      `${Math.max(16, s.bottom.x - s.top.x)}px`,
    );
    el.style.setProperty("--roll-y", `${(1 - s.roll.x) * 20}px`);
    el.style.setProperty("--roll-o", `${clamp(s.roll.x)}`);
  };
  useEffect(() => {
    motion.values.h.t = open ? 12 + options.length * 44 : 0;
    motion.values.o.t = motion.values.c.t = open ? 1 : 0;
    motion.wake.current();
  }, [open, options.length]);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  const focus = (index: number) => {
    index = clamp(index, 0, options.length - 1);
    const down = index > hover;
    [motion.values.top.k, motion.values.top.c] = down ? p.trail : p.lead;
    [motion.values.bottom.k, motion.values.bottom.c] = down ? p.lead : p.trail;
    motion.values.top.t = 6 + index * 44;
    motion.values.bottom.t = 50 + index * 44;
    setHover(index);
    motion.wake.current();
  };
  const choose = (index: number) => {
    motion.values.roll.x = 0;
    motion.values.roll.v = 0;
    motion.wake.current();
    onChange(options[index].id);
    setOpen(false);
  };
  return (
    <div
      className="spring-dropdown"
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        className="spring-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={id}
        aria-label={`학생회관 선택: ${selected}`}
        aria-activedescendant={open ? `${id}-${hover}` : undefined}
        onClick={() => {
          focus(options.findIndex((o) => o.id === value));
          setOpen(!open);
        }}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
            e.preventDefault();
            setOpen(true);
            focus(
              e.key === "Home"
                ? 0
                : e.key === "End"
                  ? options.length - 1
                  : hover + (e.key === "ArrowDown" ? 1 : -1),
            );
          }
          if ((e.key === "Enter" || e.key === " ") && open) {
            e.preventDefault();
            choose(hover);
          }
          if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
          }
        }}
      >
        <span>{selected}</span>
        <IconChevronDown size={21} />
      </button>
      <div
        className="spring-menu"
        id={id}
        role="listbox"
        aria-label="학생회관"
        aria-hidden={!open}
        inert={!open}
      >
        <i className="spring-highlight" />
        {options.map((o, i) => (
          <button
            type="button"
            tabIndex={-1}
            role="option"
            id={`${id}-${i}`}
            aria-selected={value === o.id}
            key={o.id}
            className="spring-option"
            // Keep focus on the trigger so blur cannot close the menu before click.
            onPointerDown={(e) => e.preventDefault()}
            onPointerEnter={() => focus(i)}
            onClick={() => choose(i)}
          >
            {o.label}
            {value === o.id && <IconCheck size={18} />}
          </button>
        ))}
      </div>
    </div>
  );
}
