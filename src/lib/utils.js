export function formatDate(val) {
  if (!val) return '—'
  const [y, m, d] = val.split('-')
  return `${d}/${m}/${y}`
}
