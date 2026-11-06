import type { Category } from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { signal })
  if (!res.ok) {
    throw new Error(`요청 실패: ${res.status}`)
  }
  return res.json() as Promise<T>
}

export const fetchCategories = (signal?: AbortSignal) =>
  request<Category[]>('/categories', signal)

export const fetchCategory = (id: string, signal?: AbortSignal) =>
  request<Category>(`/categories/${id}`, signal)