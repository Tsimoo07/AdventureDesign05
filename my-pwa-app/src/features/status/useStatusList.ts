import { useCallback, useEffect, useState } from 'react'
import { fetchStatusList } from './api'
import type { StatusData } from './types'

interface UseStatusListResult {
  items: StatusData[]
  loading: boolean
  error: Error | null
  refetch: () => void
}

export function useStatusList(pollMs?: number): UseStatusListResult {
  const [items, setItems] = useState<StatusData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [tick, setTick] = useState(0)

  const refetch = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    const controller = new AbortController()

    setLoading(true)
    fetchStatusList(controller.signal)
      .then((result) => {
        setItems(result)
        setError(null)
      })
      .catch((e: unknown) => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError(e instanceof Error ? e : new Error('알 수 없는 오류'))
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [tick])

  useEffect(() => {
    if (!pollMs) return
    const id = setInterval(refetch, pollMs)
    return () => clearInterval(id)
  }, [pollMs, refetch])

  return { items, loading, error, refetch }
}