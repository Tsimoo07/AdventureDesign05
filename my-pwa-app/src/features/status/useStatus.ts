import { useCallback, useEffect, useState } from 'react'
import { fetchStatus } from './api'
import type { StatusData } from './types'

interface UseStatusResult {
  data: StatusData | null
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function useStatus(pollMs?: number): UseStatusResult {
  const [data, setData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    fetchStatus(controller.signal)
      .then((result) => {
        setData(result)
        setError(null)
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError(e instanceof Error ? e : new Error('알 수 없는 오류'))
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [tick])

  // 주기적 갱신이 필요한 경우에만
  useEffect(() => {
    if (!pollMs) return
    const id = setInterval(refetch, pollMs)
    return () => clearInterval(id)
  }, [pollMs, refetch])

  return { data, loading, error, refetch }
}