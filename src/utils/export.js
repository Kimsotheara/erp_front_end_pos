// Tiny client-side CSV export. Rows is an array of objects; columns is an
// array of { key, label }. Triggers a file download in the browser.
export function exportCsv(filename, rows, columns) {
  const header = columns.map((c) => escape(c.label))
  const body = rows.map((r) => columns.map((c) => escape(r[c.key])).join(','))
  const csv = [header.join(','), ...body].join('\n')
  download(filename, csv, 'text/csv;charset=utf-8;')
}

function escape(value) {
  if (value == null) return ''
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function download(filename, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
