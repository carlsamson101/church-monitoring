export const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
export const fmtTime = (t: string | null) => (t ? t.slice(0, 5) : '')
// Local-date helpers (toISOString() is UTC and gives the wrong day early in the morning in UTC+8).
export const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
export const today = () => ymd(new Date())
export function weekRange(offset = 0) {
  const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7)
  const e = new Date(d); e.setDate(e.getDate() + 6); return [ymd(d), ymd(e)] as const
}
export function monthRange(offset = 0) {
  const n = new Date(); return [ymd(new Date(n.getFullYear(), n.getMonth() + offset, 1)), ymd(new Date(n.getFullYear(), n.getMonth() + offset + 1, 0))] as const
}
