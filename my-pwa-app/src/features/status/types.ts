export type StatusLevel = "normal" | "warning" | "danger";

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
