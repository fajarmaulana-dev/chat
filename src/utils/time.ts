export const formatTime = (time: string, options?: Intl.DateTimeFormatOptions) =>
  new Date(time).toLocaleString('id-ID', options)

export const formatHour12 = (time: string) =>
  formatTime(time, { hour: '2-digit', minute: '2-digit', hour12: true })

export const getDayDifference = (time: string) => {
  const now = new Date()
  const target = new Date(time)

  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate())

  const diffMs = targetMidnight.getTime() - todayMidnight.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  return diffDays
}
