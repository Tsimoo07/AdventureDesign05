import type { Category } from "./types";

export function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") return false;
  const category = value as Category;
  return (
    typeof category.id === "string" &&
    typeof category.label === "string" &&
    (category.updatedAt === undefined ||
      (typeof category.updatedAt === "string" &&
        Number.isFinite(Date.parse(category.updatedAt)))) &&
    Array.isArray(category.items) &&
    new Set(category.items.map((item) => item?.id)).size ===
      category.items.length &&
    new Set(category.items.map((item) => item?.zoneId ?? item?.id)).size ===
      category.items.length &&
    category.items.every(
      (item) =>
        item !== null &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.label === "string" &&
        (item.zoneId === undefined || typeof item.zoneId === "string") &&
        (item.status === undefined || item.status === "ready") &&
        Number.isFinite(item.value) &&
        item.value >= 0 &&
        item.value <= 100 &&
        (item.level === undefined ||
          ["normal", "warning", "danger"].includes(item.level)),
    )
  );
}
