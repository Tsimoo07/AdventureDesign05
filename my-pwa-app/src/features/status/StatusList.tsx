import { StatusCard } from './StatusCard'
import { useStatusList } from './useStatusList'

export function StatusList() {
  const { items, loading, error, refetch } = useStatusList()

  if (loading && items.length === 0) return <p>불러오는 중...</p>

  if (error && items.length === 0) {
    return (
      <div>
        <p>데이터를 불러오지 못했습니다.</p>
        <button onClick={refetch}>다시 시도</button>
      </div>
    )
  }

  return (
    <section>
      <button onClick={refetch} disabled={loading}>
        새로고침
      </button>
      <div className="status-list">
        {items.map((item) => (
          <StatusCard key={item.id} data={item} />
        ))}
      </div>
    </section>
  )
}