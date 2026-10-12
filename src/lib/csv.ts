// CSV with a UTF-8 BOM so Excel opens accents/Filipino names correctly.
const esc = (v: unknown) => {
  let s = String(v ?? '')
  // Block spreadsheet formula injection, but leave phone numbers alone.
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s) && !/^\+?[\d\s()-]+$/.test(s)) s = "'" + s
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
export function downloadCsv(name: string, columns: string[], rows: (string | number)[][]) {
  const csv = '\ufeff' + [columns, ...rows].map((r) => r.map(esc).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a'); a.href = url; a.download = `${name}.csv`; a.click(); URL.revokeObjectURL(url)
}
