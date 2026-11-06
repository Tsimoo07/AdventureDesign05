import { CategoryCard } from '../features/status/CategoryCard'
import { fetchCategories } from '../features/status/api'
import { useFetch } from '../features/status/useFetch'

export default function HomePage() {
  const { data, loading, error, refetch } = useFetch(fetchCategories)

  if (loading && !data) return <p>불러오는 중...</p>

  if (error && !data) {
    return (
      <div>
        <p>데이터를 불러오지 못했습니다.</p>
        <button onClick={refetch}>다시 시도</button>
      </div>
    )
  }

  return (
    <section>
      <header className="page-header">
        <h1>상태 현황</h1>
        <button onClick={refetch} disabled={loading}>
          새로고침
        </button>
      </header>
      <div className="status-list">
        {data?.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  )
}