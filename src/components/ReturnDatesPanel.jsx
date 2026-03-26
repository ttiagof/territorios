import { useState } from 'react'
import { formatDate, getReturnDate, isOverdue, isDueSoon } from '../lib/utils'
import OverdueModal from './OverdueModal'

export default function ReturnDatesPanel({ territories, onClose }) {
  const [showOverdue, setShowOverdue] = useState(false)

  const assigned = territories
    .filter(t => t.status === 'assigned' && t.assigned_date)
    .map(t => ({
      ...t,
      returnDate: getReturnDate(t.assigned_date),
      overdue: isOverdue(t.assigned_date),
      dueSoon: isDueSoon(t.assigned_date),
    }))
    .sort((a, b) => a.returnDate.localeCompare(b.returnDate))

  const overdueCount = assigned.filter(t => t.overdue).length

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Próximas devoluções</span>
          {assigned.length > 0 && (
            <span className="text-xs font-semibold bg-indigo-600 text-white rounded-full px-2 py-0.5 leading-none">
              {assigned.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <button
              onClick={() => setShowOverdue(true)}
              className="text-[11px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            >
              {overdueCount} atrasado{overdueCount !== 1 ? 's' : ''}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f0f0f0] hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {assigned.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhum território designado</p>
        ) : (
          assigned.map(t => {
            const label = t.name ? `${t.name} ${t.number}` : t.number
            let bgClass = 'bg-[#f0f0f0]'
            let dateClass = 'text-gray-400'
            let badgeEl = null

            if (t.overdue) {
              bgClass = 'bg-red-50'
              dateClass = 'text-red-400'
              badgeEl = (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                  Atrasado
                </span>
              )
            } else if (t.dueSoon) {
              bgClass = 'bg-amber-50'
              dateClass = 'text-amber-500'
              badgeEl = (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                  Em breve
                </span>
              )
            }

            return (
              <div key={t.id} className={`rounded-2xl px-4 py-3 ${bgClass}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 truncate">{label}</p>
                  {badgeEl}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{t.assigned_to}</p>
                <p className={`text-[10px] mt-0.5 ${dateClass}`}>
                  Devolução: {formatDate(t.returnDate)}
                </p>
              </div>
            )
          })
        )}
      </div>

      {showOverdue && (
        <OverdueModal
          territories={territories}
          onClose={() => setShowOverdue(false)}
        />
      )}
    </>
  )
}
