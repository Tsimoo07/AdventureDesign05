import type { StatusData } from "./types";
import Byelidali from "../../assets/Byelidali.png";
export function congestionSummary(items: StatusData[]) {
  const measured = items.filter(item => item.status !== "ready");
  if (!measured.length) return items.length ? "ready" : null;
  const average = measured.reduce((sum, item) => sum + item.value, 0) / measured.length;
  return average >= 80 ? "danger" : average >= 50 ? "warning" : "normal";
}
const zoneSymbols: Record<string, Record<string, string>> = {
  "1": { "0": "99", "1": "K", "2": "1", "3": "2", "4": "A", "5": "B", "6": "C", "7": "GS", "8": "3", "9": "4" },
  "2": { "0": "99", "1": "A", "2": "B", "3": "1", "4": "2", "5": "GS","6": "K" },
};
const symbolImages: Record<string, string> = {
  B : Byelidali,
}
// 이미지가 없는 기호는 undefined → 화면에서는 글자로 대체
export function zoneImage(hall: string, zone: string): string | undefined {
  return symbolImages[zoneSymbol(hall, zone)];
}
export function zoneSymbol(hall: string, zone: string) {
  return zoneSymbols[hall]?.[zone] ?? "–";
}
const displayOrder = ["1", "2", "3", "4", "K", "A", "B", "C", "99", "GS"];
export function orderedZones(hall: string, items: StatusData[]) {
  const rank = (item: StatusData) => {
    const index = displayOrder.indexOf(zoneSymbol(hall, item.zoneId ?? item.id));
    return index < 0 ? displayOrder.length : index;
  };
  return [...items].sort((left, right) => rank(left) - rank(right));
}
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
export interface FloorZone {
  id: string; // 서버 응답의 zoneId 또는 id와 같아야 연결됨
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FloorPlanDef {
  id: string; // 장소(category) id
  label: string;
  width: number;
  height: number;
  corridor?: boolean; // 제 1 학생회관의 공용 통로 표시 여부
  zones: FloorZone[];
}

export const floorPlans: Record<string, FloorPlanDef> = {
  "1": {
    id: "1",
    label: "제1학생회관",
    width: 293,
    height: 166,
    corridor: true,
    zones: floorZones, // 기존 정의 그대로 사용
  },
    "2": {
    id: "2",
    label: "제2학생회관",
    width: 293,
    height: 166,
    zones: [
      { id: "0", x: 26, y: 67, w: 60, h: 101 },
      { id: "1", x: 26, y: 0, w: 150, h: 67 },
      { id: "2", x: 176, y: 0, w: 40, h: 67 },
      { id: "3", x: 136, y: 67, w: 158, h: 101 },
      { id: "4", x: 216, y: 0, w: 78, h: 67 },
      { id: "5", x: 86, y: 118, w: 50, h: 50 },
      { id: "6", x: 86, y: 67, w: 50, h: 51}
    ],
  },
};
