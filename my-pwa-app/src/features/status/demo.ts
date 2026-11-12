import type { Category } from "./types";

export const demoCategories: Category[] = [
  {
    id: "1",
    label: "제 1 학생회관",
    items: [
      { id: "0", label: "99카페", value: 85, level: "danger" },
      { id: "1", label: "키오스크", status: "ready", value: 0 },
      { id: "2", label: "식사구역 1", value: 60, level: "warning" },
      { id: "3", label: "식사구역 2", value: 20, level: "normal" },
      { id: "4", label: "라면&양식", value: 25, level: "normal" },
      { id: "5", label: "스낵, 한식, 일식", value: 90, level: "danger" },
      { id: "6", label: "춘향미엔(중식)", status: "ready", value: 0 },
      { id: "7", label: "GS25", value: 65, level: "warning" },
      { id: "8", label: "식사구역 3", value: 20, level: "normal" },
      { id: "9", label: "식사구역 4", value: 15, level: "normal" },
    ],
  },
  {
    id: "2",
    label: "제 2 학생회관",
    items: [
      { id: "2-1", label: "학생식", value: 20, level: "normal" },
      { id: "2-2", label: "교직원식", value: 45, level: "warning" },
    ],
  },
];
