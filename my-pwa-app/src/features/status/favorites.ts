export const ZONE_FAVORITES_KEY = "chacha-zone-favorites";

// 구역 id는 장소마다 겹칠 수 있으므로 "장소id:구역id"로 구분
export const zoneKey = (categoryId: string, itemId: string) =>
  `${categoryId}:${itemId}`;

export const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === "string");