import type { Hall2Observation, StatusData } from "./types";

const SENSOR_ZONES = [
  { id: "1", label: "학생식", group: "serving" },
  { id: "2", label: "교직원식", group: "serving" },
  { id: "3", label: "식사구역 1", group: "dining" },
  { id: "4", label: "식사구역 2", group: "dining" },
] as const;

export function isHall2SensorZone(item: StatusData) {
  return SENSOR_ZONES.some(({ id }) => id === (item.zoneId ?? item.id));
}

export function applyHall2Observation(items: StatusData[], observation: Hall2Observation | null) {
  const zones = new Map(items.map((item) => [item.zoneId ?? item.id, item]));
  for (const { id, label, group } of SENSOR_ZONES) {
    const reading = observation?.[group];
    zones.set(id, {
      ...(zones.get(id) ?? { id, label }),
      value: reading?.averageCount ?? 0,
      level: reading?.level,
      status: reading ? undefined : "ready",
    });
  }
  return [...zones.values()];
}
