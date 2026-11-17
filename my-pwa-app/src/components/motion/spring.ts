// Design Bookmark motion.js: semi-implicit Euler, four substeps, unit mass.
export type Spring = { x: number; v: number; t: number; k: number; c: number };
export const spring = (x: number, k: number, c: number): Spring => ({
  x,
  v: 0,
  t: x,
  k,
  c,
});
export function step(s: Spring, dt: number) {
  s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt;
  s.x += s.v * dt;
}
export const clamp = (x: number, min = 0, max = 1) =>
  Math.max(min, Math.min(max, x));
// Exact source values: dropdown/expand use component-local presets, dock uses tokens.css.
export const presets = {
  menu: [300, 23],
  fade: [400, 34],
  chevron: [300, 18],
  roll: [340, 26],
  lead: [620, 36],
  trail: [200, 20],
  row: [300, 24],
  dockLead: [640, 38],
  dockTrail: [150, 16],
  dragLead: [1100, 56],
  dragTrail: [320, 26],
  openW: [340, 21],
  openH: [230, 21],
  close: [420, 30],
  pop: [520, 16],
  expand: [240, 21],
  detail: [260, 28],
} as const;
