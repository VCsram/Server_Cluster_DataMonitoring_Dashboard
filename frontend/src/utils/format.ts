export function formatHour(hour: string) {
  return hour.slice(5, 16)
}

export function formatMem(mb: number) {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb.toFixed(0)} MB`
}

export function statusLabel(status: string) {
  if (status === 'alert') return '告警'
  if (status === 'offline') return '离线'
  return '正常'
}

export function levelColor(level: string) {
  if (level === 'critical') return '#ff4757'
  if (level === 'warning') return '#ff6b35'
  return '#00e676'
}
