import type { StatusData, StatusLevel } from './types'

export const LEVEL_COLORS: Record<StatusLevel, string> = {
  normal: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
}

export const LEVEL_LABELS: Record<StatusLevel, string> = {
  normal: '원활',
  warning: '보통',
  danger: '혼잡',
}

const LEVEL_ORDER: StatusLevel[] = ['normal', 'warning', 'danger']

// 작은 구역 하나의 상태
export function getLevel(data: StatusData): StatusLevel {
  if (data.level) return data.level
  if (data.value >= 80) return 'danger'
  if (data.value >= 50) return 'warning'
  return 'normal'
}

export function getColor(data: StatusData): string {
  return LEVEL_COLORS[getLevel(data)]
}

// 큰 범주의 상태: 작은 구역 중 가장 나쁜 상태
export function getWorstLevel(items: StatusData[]): StatusLevel {
  return items.reduce<StatusLevel>((worst, item) => {
    const level = getLevel(item)
    return LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(worst)
      ? level
      : worst
  }, 'normal')
}