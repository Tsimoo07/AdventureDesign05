import type { StatusData, StatusLevel } from './types'

export const LEVEL_COLORS: Record<StatusLevel, string> = {
  normal: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
}

// 서버가 level을 주지 않고 수치만 준다면 여기서 직접 판정
export function getColor(data: StatusData): string {
  if (data.level) return LEVEL_COLORS[data.level]

  if (data.value >= 80) return LEVEL_COLORS.danger
  if (data.value >= 50) return LEVEL_COLORS.warning
  return LEVEL_COLORS.normal
}