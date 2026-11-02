import type { CSSProperties } from 'react'
import { getColor } from './colors'
import { useStatus } from './useStatus'
import './StatusCard.css'

export function StatusCard() {
  const { data, loading, error, refetch } = useStatus()

  if (loading && !data) return <div className="status-card">불러오는 중...</div>

  if (error && !data) {
    return (
      <div className="status-card status-card--error">
        <p>데이터를 불러오지 못했습니다.</p>
        <button onClick={refetch}>다시 시도</button>
      </div>
    )
  }

  if (!data) return null

  // CSS 변수로 색을 전달하면 스타일은 CSS에서 관리할 수 있음
  const style = { '--status-color': getColor(data) } as CSSProperties

  return (
    <div className="status-card" style={style}>
      <span className="status-card__indicator" />
      <div>
        <h3>{data.label}</h3>
        <p>{data.value}</p>
      </div>
      <button onClick={refetch}>새로고침</button>
    </div>
  )
}