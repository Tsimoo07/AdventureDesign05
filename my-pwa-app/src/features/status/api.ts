import type { StatusData } from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export async function fetchStatusList(
  signal?: AbortSignal,
): Promise<StatusData[]> {
  const res = await fetch(`${BASE_URL}/statuses`, { signal })
  if (!res.ok) {
    throw new Error(`요청 실패: ${res.status}`)
  }
  return res.json() as Promise<StatusData[]>
}