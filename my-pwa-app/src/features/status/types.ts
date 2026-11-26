export type StatusLevel = "normal" | "warning" | "danger";

export interface Hall2ZoneGroup {
  averageCount: number;
  level: StatusLevel;
}

export interface Hall2Observation extends Hall2ZoneGroup {
  windowStart: string;
  dining: Hall2ZoneGroup;
  serving: Hall2ZoneGroup;
}

export interface StatusData {
  id: string;
  label: string;
  value: number;
  zoneId?: string;
  status?: "ready";
  level?: StatusLevel; // 서버가 주지 않으면 value로 계산
}

export interface Category {
  id: string;
  label: string;
  updatedAt?: string;
  items: StatusData[];
}
