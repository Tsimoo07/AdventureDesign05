import { useEffect, useId, useRef } from "react";
import { IconSun, IconMoon } from "@tabler/icons-react";
import "./MorphThemePicker.css";

const modes = [
  {
    value: "light",
    label: "라이트",
    help: "밥길을 밝은 화면으로",
    Icon: IconSun,
  },
  {
    value: "dark",
    label: "다크",
    help: "어두운 곳에서는 다크 모드",
    Icon: IconMoon,
  },
] as const;
const spring = (x: number, k: number, c: number) => ({ x, t: x, v: 0, k, c });
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

// Motion and spring values adapted from designbookmark.com/motion-src/morph-tooltip/.
export function MorphThemePicker({
  theme,
  onChange,
}: {
  theme: "light" | "dark";
  onChange: (theme: "light" | "dark") => boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    const group = root.current!;
    const buttons = [...group.querySelectorAll("button")];
    const labels = [...group.querySelectorAll<HTMLElement>(".morph-label")];
    const tip = group.querySelector<HTMLElement>(".morph-tip")!;
    const tail = group.querySelector<HTMLElement>(".morph-tail")!;
    const highlight = group.querySelector<HTMLElement>(".morph-highlight")!;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const L = spring(0, 620, 36),
      R = spring(0, 620, 36),
      X = spring(0, 300, 22);
    const HL = spring(0, 620, 36),
      HR = spring(0, 620, 36),
      A = spring(0, 420, 24);
    const fades = labels.map(() => spring(0, 420, 32));
    const pops = buttons.map(() => spring(1, 520, 16));
    const directions = [0, 0];
    const springs = [L, R, X, HL, HR, A, ...fades, ...pops];
    let current = -1,
      timer = 0,
      frame = 0,
      last = 0;
    const render = () => {
      const a = clamp(A.x, 0, 1.15),
        opacity = clamp(A.x, 0, 1);
      const width = Math.max(30, R.x - L.x);
      const left = clamp(L.x, 0, Math.max(0, group.clientWidth - width));
      tip.style.width = `${width}px`;
      tip.style.opacity = String(opacity);
      tip.style.transform = `translate(${left}px, ${(1 - a) * 6}px) scale(${0.72 + 0.28 * a})`;
      tail.style.opacity = String(opacity);
      tail.style.transform = `translate(${clamp(X.x, left + 12, left + width - 12) - 6}px, ${(1 - a) * 8}px) rotate(45deg) scale(${a})`;
      highlight.style.opacity = String(opacity);
      highlight.style.width = `${Math.max(20, HR.x - HL.x)}px`;
      highlight.style.transform = `translateX(${HL.x}px)`;
      labels.forEach((label, i) => {
        const o = clamp(fades[i].x, 0, 1);
        label.style.opacity = String(o);
        label.style.transform = `translateX(calc(-50% + ${directions[i] * (1 - o) * 14}px))`;
        label.style.filter =
          o > 0.02 && o < 0.98 ? `blur(${(1 - o) * 3}px)` : "none";
        buttons[i].querySelector("svg")!.style.transform =
          `scale(${pops[i].x})`;
      });
    };
    const tick = (time: number) => {
      const dt = Math.min((time - last) / 1000, 1 / 30) / 4;
      last = time;
      for (let j = 0; j < 4; j++)
        for (const s of springs) {
          if (media.matches) {
            s.x = s.t;
            s.v = 0;
          } else {
            s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt;
            s.x += s.v * dt;
          }
        }
      render();
      frame = springs.some(
        (s) => Math.abs(s.x - s.t) > 0.001 || Math.abs(s.v) > 0.001,
      )
        ? requestAnimationFrame(tick)
        : 0;
    };
    const run = () => {
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };
    const point = (i: number) => {
      clearTimeout(timer);
      const button = buttons[i],
        center = button.offsetLeft + button.offsetWidth / 2;
      const width = Math.min(labels[i].offsetWidth, group.clientWidth);
      const left = clamp(center - width / 2, 0, group.clientWidth - width);
      const snap = A.x < 0.3,
        direction = current < 0 ? 0 : Math.sign(i - current);
      const targets: [typeof L, number][] = [
        [L, left],
        [R, left + width],
        [X, center],
        [HL, button.offsetLeft],
        [HR, button.offsetLeft + button.offsetWidth],
      ];
      if (i !== current) {
        [R, HR].forEach((s) => {
          s.k = direction >= 0 ? 620 : 190;
          s.c = direction >= 0 ? 36 : 19;
        });
        [L, HL].forEach((s) => {
          s.k = direction >= 0 ? 190 : 620;
          s.c = direction >= 0 ? 19 : 36;
        });
        fades.forEach((s, k) => {
          directions[k] = k === i ? direction : -direction;
          s.t = k === i ? 1 : 0;
          if (snap) {
            s.x = s.t;
            s.v = 0;
            directions[k] = 0;
          }
        });
      }
      targets.forEach(([s, t]) => {
        s.t = t;
        if (snap) {
          s.x = t;
          s.v = 0;
        }
      });
      current = i;
      A.t = 1;
      tip.setAttribute("aria-hidden", "false");
      labels.forEach((l, k) => l.setAttribute("aria-hidden", String(k !== i)));
      run();
    };
    const hide = () => {
      clearTimeout(timer);
      A.t = 0;
      current = -1;
      tip.setAttribute("aria-hidden", "true");
      run();
    };
    const leave = () => {
      clearTimeout(timer);
      timer = window.setTimeout(hide, 140);
    };
    const enter = (event: Event) => {
      const i = buttons.indexOf(event.currentTarget as HTMLButtonElement);
      point(i);
    };
    const click = (event: Event) => {
      const i = buttons.indexOf(event.currentTarget as HTMLButtonElement);
      point(i);
      pops[i].x = 0.78;
      A.x = Math.min(A.x, 0.9);
      run();
    };
    const exit = () => {
      if (!group.contains(document.activeElement)) leave();
    };
    const blur = () => {
      if (!group.matches(":hover")) leave();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide();
    };
    buttons.forEach((b) => {
      b.addEventListener("pointerenter", enter);
      b.addEventListener("focus", enter);
      b.addEventListener("blur", blur);
      b.addEventListener("click", click);
    });
    group.addEventListener("pointerleave", exit);
    group.addEventListener("keydown", escape);
    const observer = new ResizeObserver(() => {
      if (current >= 0) point(current);
    });
    observer.observe(group);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      observer.disconnect();
      buttons.forEach((b) => {
        b.removeEventListener("pointerenter", enter);
        b.removeEventListener("focus", enter);
        b.removeEventListener("blur", blur);
        b.removeEventListener("click", click);
      });
      group.removeEventListener("pointerleave", exit);
      group.removeEventListener("keydown", escape);
    };
  }, []);
  return (
    <div className="morph-theme" ref={root} role="group" aria-label="화면 모드">
      <div className="morph-tip" id={id} role="tooltip" aria-hidden="true">
        {modes.map((m) => (
          <span className="morph-label" key={m.value}>
            {m.help}
          </span>
        ))}
      </div>
      <span className="morph-tail" aria-hidden="true" />
      <span className="morph-highlight" aria-hidden="true" />
      {modes.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          aria-pressed={theme === value}
          aria-describedby={id}
          onClick={() => onChange(value)}
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
