import { isEvaluation } from "../../evaluation";
import type { Category, Hall2Observation, Hall2ZoneGroup } from "./types";
import { demoCategories } from "./demo";
import { isCategory } from "./validate";

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
export const isDemo = isEvaluation || import.meta.env.VITE_USE_DEMO === "true";

function isHall2ZoneGroup(value: unknown): value is Hall2ZoneGroup {
  if (typeof value !== "object" || value === null) return false;
  const { averageCount, level } = value as Record<string, unknown>;
  return typeof averageCount === "number" && Number.isFinite(averageCount) && averageCount >= 0 &&
    (level === "normal" || level === "warning" || level === "danger");
}

export async function fetchHall2Observation(signal: AbortSignal): Promise<Hall2Observation | null> {
  const response = await fetch("/api/observations", {
    signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("센서 데이터를 불러오지 못했습니다.");
  const { observation } = await response.json();
  if (observation === null) return null;
  const { windowStart, dining, serving } = observation ?? {};
  if (typeof windowStart !== "string" || !Number.isFinite(Date.parse(windowStart)) ||
      !isHall2ZoneGroup(dining) || !isHall2ZoneGroup(serving) || !isHall2ZoneGroup(observation)) {
    throw new Error("잘못된 센서 데이터입니다.");
  }
  return { windowStart, dining, serving, averageCount: observation.averageCount, level: observation.level };
}

async function request(path: string, signal?: AbortSignal): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    signal: AbortSignal.any([
      signal ?? new AbortController().signal,
      AbortSignal.timeout(10000),
    ]),
  });
  if (!res.ok) throw new Error(`요청 실패: ${res.status}`);
  return res.json();
}

export async function fetchCategories(
  signal: AbortSignal,
): Promise<Category[]> {
  if (isDemo) return demoCategories;
  if (!BASE_URL) return demoCategories.map(({ id, label }) => ({ id, label, items: [] }));
  const data = await request("/categories", signal);
  if (!Array.isArray(data) || !data.every(isCategory))
    throw new Error("잘못된 장소 데이터입니다.");
  return data;
}

export async function fetchCategory(
  id: string,
  signal: AbortSignal,
): Promise<Category> {
  if (!isDemo && !BASE_URL) {
    const place = demoCategories.find((category) => category.id === id);
    if (!place) throw new Error("존재하지 않는 장소입니다.");
    return { id: place.id, label: place.label, items: [] };
  }
  const data = isDemo
    ? demoCategories.find((category) => category.id === id)
    : await request(`/categories/${encodeURIComponent(id)}`, signal);
  if (!isCategory(data))
    throw new Error("존재하지 않거나 잘못된 장소 데이터입니다.");
  return data;
}
