import { formatDate, getReturnDate, daysOverdue } from '../lib/utils'

export default function OverdueModal({ territories, onClose }) {
  const overdue = territories
    .filter(t => t.status === 'assigned' && t.assigned_date)
    .filter(t => {
      const ret = getReturnDate(t.assigned_date)
      return ret < new Date().toISOString().split('T')[0]
    })
    .sort((a, b) => getReturnDate(a.assigned_date).localeCompare(getReturnDate(b.assigned_date)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Territórios atrasados</span>
            <span className="text-xs font-semibold bg-red-500 text-white rounded-full px-2 py-0.5 leading-none">
              {overdue.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f0f0f0] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
          {overdue.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Nenhum território atrasado</p>
          ) : (
            overdue.map(t => {
              const label = t.name ? `${t.name} ${t.number}` : t.number
              const days = daysOverdue(t.assigned_date)
              const weeksOver = Math.floor(days / 7)
              const overLabel = days < 7
                ? `${days} dia${days !== 1 ? 's' : ''} atrasado`
                : `${weeksOver} semana${weeksOver !== 1 ? 's' : ''} atrasado`

              return (
                <div key={t.id} className="rounded-2xl bg-red-50 dark:bg-red-900/20 px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</p>
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                      {overLabel}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.assigned_to}</p>
                  <p className="text-[10px] text-red-400 mt-0.5">
                    Devolução era {formatDate(getReturnDate(t.assigned_date))}
                  </p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
