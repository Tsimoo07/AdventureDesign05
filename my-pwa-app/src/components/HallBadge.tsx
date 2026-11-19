import { zoneLabels, congestionSummary } from "../features/status/zones";

export function HallBadge({ level }: { level: ReturnType<typeof congestionSummary> }) {
  return <span className={`badge ${level ?? "unknown"}`}>{level ? zoneLabels[level] : "정보 없음"}</span>;
}
