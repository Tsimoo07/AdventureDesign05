import { zoneImage, zoneSymbol } from "../features/status/zones";

export function ZoneMark({ hall, zone }: { hall: string; zone: string }) {
  const src = zoneImage(hall, zone);
  if (!src) return <>{zoneSymbol(hall, zone)}</>;
  // 의미는 버튼의 aria-label과 구역 이름이 전달하므로 그림은 장식으로 처리
  return <img className="zone-mark" src={src} alt="" draggable={false} />;
}