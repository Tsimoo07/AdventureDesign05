import { useEffect, useRef } from "react";
import { spring, step, type Spring } from "./spring";

export function useSprings(
  initial: Record<string, readonly [number, number, number]>,
) {
  const values = useRef<Record<string, Spring> | null>(null);
  if (!values.current)
    values.current = Object.fromEntries(
      Object.entries(initial).map(([key, [x, k, c]]) => [key, spring(x, k, c)]),
    );
  const frame = useRef<(s: Record<string, Spring>) => void>(() => {});
  const wake = useRef<() => void>(() => {});
  useEffect(() => {
    let raf = 0,
      last = 0;
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;
      let moving = false;
      for (const s of Object.values(values.current!)) {
        if (media.matches) {
          s.x = s.t;
          s.v = 0;
        } else for (let i = 0; i < 4; i++) step(s, dt / 4);
        if (Math.abs(s.x - s.t) > 0.001 || Math.abs(s.v) > 0.001) moving = true;
        else {
          s.x = s.t;
          s.v = 0;
        }
      }
      frame.current(values.current!);
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    wake.current = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    media.addEventListener("change", wake.current);
    wake.current();
    return () => {
      cancelAnimationFrame(raf);
      media.removeEventListener("change", wake.current);
      wake.current = () => {};
    };
  }, []);
  return { values: values.current!, frame, wake };
}
