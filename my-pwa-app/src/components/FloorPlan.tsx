import type { StatusData } from "../features/status/types";
import {
  zoneLabels,
  zoneLevel,
  type FloorPlanDef,
} from "../features/status/zones";

export function FloorPlan({
  plan,
  items,
  selected,
  onSelect,
}: {
  plan: FloorPlanDef;
  items: StatusData[];
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div
      className={`live-floor floor-plan-${plan.id}`}
      role="group"
      aria-label={`${plan.label} 구역별 혼잡도 평면도`}
      style={{ aspectRatio: `${plan.width} / ${plan.height}` }}
    >
      {plan.corridor && <div className="floor-corridor" aria-label="공용 통로" />}
      {plan.zones.map((zone) => {
        const item = items.find((item) => (item.zoneId ?? item.id) === zone.id);
        const level = zoneLevel(item);
        return (
          <button
            key={zone.id}
            className={`floor-zone floor-zone-${zone.id} ${level}`}
            style={{
              left: `${(zone.x / plan.width) * 100}%`,
              top: `${(zone.y / plan.height) * 100}%`,
              width: `${(zone.w / plan.width) * 100}%`,
              height: `${(zone.h / plan.height) * 100}%`,
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