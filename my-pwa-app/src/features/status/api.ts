import type { StatusData } from './types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export async function fetchStatus(signal?: AbortSignal): Promise<StatusData> {
  const res = await fetch(`${BASE_URL}/status`, { signal })
  if (!res.ok) {
    throw new Error(`요청 실패: ${res.status}`)
  }
  return res.json() as Promise<StatusData>
}