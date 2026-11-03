import type { CSSProperties } from 'react'
import { getColor } from './colors'
import type { StatusData } from './types'
import './StatusCard.css'

interface StatusCardProps {
  data: StatusData
}

export function StatusCard({ data }: StatusCardProps) {
  const style = { '--status-color': getColor(data) } as CSSProperties

  return (
    <div className="status-card" style={style}>
      <span className="status-card__indicator" />
      <div>
        <h3>{data.label}</h3>
        <p>{data.value}</p>
      </div>
    </div>
  )
}