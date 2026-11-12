import type { StatusData } from "./types";
export const zoneLabels = {
  normal: "원활",
  warning: "보통",
  danger: "혼잡",
  ready: "준비",
  unknown: "정보 없음",
};
export function zoneLevel(item?: StatusData) {
  if (!item) return "unknown";
  if (item.status === "ready") return "ready";
  return (
    item.level ??
    (item.value >= 80 ? "danger" : item.value >= 50 ? "warning" : "normal")
  );
}
// Coordinates follow the user-supplied first student center floor plan.
export const floorZones = [
  { id: "0", x: 0, y: 0, w: 74, h: 26 },
  { id: "1", x: 190, y: 26, w: 77, h: 42 },
  { id: "2", x: 190, y: 68, w: 77, h: 62 },
  { id: "3", x: 267, y: 68, w: 26, h: 88 },
  { id: "4", x: 190, y: 130, w: 77, h: 26 },
  { id: "5", x: 114, y: 130, w: 76, h: 26 },
  { id: "6", x: 74, y: 130, w: 40, h: 26 },
  { id: "7", x: 0, y: 130, w: 74, h: 26 },
  { id: "8", x: 0, y: 88, w: 74, h: 42 },
  { id: "9", x: 74, y: 88, w: 116, h: 42 },
];
