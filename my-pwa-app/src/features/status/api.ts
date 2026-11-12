import type { Category } from "./types";
import { demoCategories } from "./demo";
import { isCategory } from "./validate";

const BASE_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
export const isDemo = import.meta.env.VITE_USE_DEMO !== "false";

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
  const data = await request("/categories", signal);
  if (!Array.isArray(data) || !data.every(isCategory))
    throw new Error("잘못된 장소 데이터입니다.");
  return data;
}

export async function fetchCategory(
  id: string,
  signal: AbortSignal,
): Promise<Category> {
  const data = isDemo
    ? demoCategories.find((category) => category.id === id)
    : await request(`/categories/${encodeURIComponent(id)}`, signal);
  if (!isCategory(data))
    throw new Error("존재하지 않거나 잘못된 장소 데이터입니다.");
  return data;
}
