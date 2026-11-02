// 서버 응답 형태에 맞게 수정
export type StatusLevel = 'normal' | 'warning' | 'danger'

export interface StatusData {
  id: string
  label: string
  value: number
  level: StatusLevel
}