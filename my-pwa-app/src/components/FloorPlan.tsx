import type { StatusData } from "../features/status/types";
import { floorZones, zoneLabels, zoneLevel } from "../features/status/zones";

export function FloorPlan({
  items,
  selected,
  onSelect,
}: {
  items: StatusData[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div
      className="live-floor"
      role="group"
      aria-label="제1학생회관 구역별 혼잡도 평면도"
    >
      <div className="floor-corridor" aria-label="공용 통로" />
      {floorZones.map((zone) => {
        const item = items.find((item) => (item.zoneId ?? item.id) === zone.id);
        const level = zoneLevel(item);
        return (
          <button
            key={zone.id}
            className={`floor-zone floor-zone-${zone.id} ${level}`}
            style={{
              left: `${(zone.x / 293) * 100}%`,
              top: `${(zone.y / 166) * 100}%`,
              width: `${(zone.w / 293) * 100}%`,
              height: `${(zone.h / 166) * 100}%`,
            }}
            disabled={!item}
            aria-label={`${zone.id} ${item?.label ?? "미연결 구역"} · ${zoneLabels[level]}`}
            aria-pressed={!!item && selected === item.id}
            onClick={() =>
              item && onSelect(selected === item.id ? null : item.id)
            }
          >
            {zone.id}
          </button>
        );
      })}
    </div>
  );
}
