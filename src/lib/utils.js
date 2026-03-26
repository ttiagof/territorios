export function formatDate(val) {
  if (!val) return '—'
  const [y, m, d] = val.split('-')
  return `${d}/${m}/${y}`
}

export function addMonths(dateStr, months) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1 + months, d)
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function getReturnDate(assignedDate) {
  return addMonths(assignedDate, 4)
}

export function isOverdue(assignedDate) {
  const returnDate = getReturnDate(assignedDate)
  const today = new Date().toISOString().split('T')[0]
  return returnDate < today
}

export function isDueSoon(assignedDate) {
  const returnDate = getReturnDate(assignedDate)
  const today = new Date()
  const twoWeeksLater = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
    .toISOString().split('T')[0]
  const todayStr = today.toISOString().split('T')[0]
  return returnDate >= todayStr && returnDate <= twoWeeksLater
}

export function daysOverdue(assignedDate) {
  const returnDate = getReturnDate(assignedDate)
  const today = new Date()
  const ret = new Date(returnDate)
  const diff = Math.floor((today - ret) / (1000 * 60 * 60 * 24))
  return diff
}
