const STATUS_STYLES = {
  available: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
  assigned: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
  completed: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
}

const STATUS_LABELS = {
  available: 'Disponível',
  assigned: 'Designado',
  completed: 'Concluído',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
