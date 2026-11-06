import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { StatusCard } from '../features/status/StatusCard'
import { fetchCategory } from '../features/status/api'
import { useFetch } from '../features/status/useFetch'

export default function CategoryPage() {
  const { id = '' } = useParams<{ id: string }>()

  const fetcher = useCallback(
    (signal: AbortSignal) => fetchCategory(id, signal),
    [id],
  )
  const { data, loading, error, refetch } = useFetch(fetcher)

  return (
    <section>
      <Link to="/" className="back-link">
        ‹ 목록
      </Link>

      {loading && !data && <p>불러오는 중...</p>}

      {error && !data && (
        <div>
          <p>데이터를 불러오지 못했습니다.</p>
          <button onClick={refetch}>다시 시도</button>
        </div>
      )}

      {data && (
        <>
          <header className="page-header">
            <button onClick={refetch} disabled={loading}>
              새로고침
            </button>
          </header>
          <div className="status-list">
            {data.items.map((item) => (
              <StatusCard key={item.id} data={item} />
            ))}
          </div>
        </>
      )}
    </section>
  )
}