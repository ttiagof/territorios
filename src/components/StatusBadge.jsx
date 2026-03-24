const STATUS_STYLES = {
  available: 'bg-green-100 text-green-800',
  assigned: 'bg-blue-100 text-blue-800',
  completed: 'bg-gray-100 text-gray-600',
}

const STATUS_LABELS = {
  available: 'Disponível',
  assigned: 'Designado',
  completed: 'Concluído',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
