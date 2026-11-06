import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { LEVEL_COLORS, LEVEL_LABELS, getWorstLevel } from './colors'
import type { Category } from './types'
import './StatusCard.css'

export function CategoryCard({ category }: { category: Category }) {
  const level = getWorstLevel(category.items)

  const style = { '--status-color': LEVEL_COLORS[level] } as CSSProperties

  return (
    <Link
      to={`/category/${category.id}`}
      className="status-card status-card--link"
      style={style}
    >
      <span className="status-card__indicator" />
      <div className="status-card__body">
        <h3>{category.label}</h3>
        <p>
          {LEVEL_LABELS[level]}
        </p>
      </div>
      <span aria-hidden="true">›</span>
    </Link>
  )
}