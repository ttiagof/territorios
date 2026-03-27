import { useState } from 'react'
import { formatDate, getReturnDate, isOverdue, isDueSoon } from '../lib/utils'
import OverdueModal from './OverdueModal'

export default function ReturnDatesPanel({ territories, onClose, onSelect }) {
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
      <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${overdueCount > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-[#f0f0f0] dark:bg-gray-800'}`}>
            <svg className={`w-3.5 h-3.5 ${overdueCount > 0 ? 'text-red-400' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Próximas devoluções</span>
          {assigned.length > 0 && (
            <span className="text-xs font-semibold bg-accent-600 text-white rounded-full px-2 py-0.5 leading-none">
              {assigned.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {overdueCount > 0 && (
            <button
              onClick={() => setShowOverdue(true)}
              className="text-[11px] font-semibold text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            >
              {overdueCount} atrasado{overdueCount !== 1 ? 's' : ''}
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f0f0f0] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
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
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Nenhum território designado</p>
        ) : (
          assigned.map(t => {
            const label = t.name ? `${t.name} ${t.number}` : t.number
            let bgClass = 'bg-[#f0f0f0] dark:bg-gray-800'
            let dateClass = 'text-gray-400 dark:text-gray-500'
            let badgeEl = null

            if (t.overdue) {
              bgClass = 'bg-red-50 dark:bg-red-900/20'
              dateClass = 'text-red-400'
              badgeEl = (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                  Atrasado
                </span>
              )
            } else if (t.dueSoon) {
              bgClass = 'bg-amber-50 dark:bg-amber-900/20'
              dateClass = 'text-amber-500'
              badgeEl = (
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
                  Em breve
                </span>
              )
            }

            return (
              <button
                key={t.id}
                onClick={() => onSelect?.(t)}
                className={`w-full text-left rounded-2xl px-4 py-3 transition-opacity active:opacity-70 ${bgClass} ${onSelect ? 'cursor-pointer hover:opacity-80 dark:hover:opacity-80' : ''}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{label}</p>
                  {badgeEl}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{t.assigned_to}</p>
                <p className={`text-[10px] mt-0.5 ${dateClass}`}>
                  Devolução: {formatDate(t.returnDate)}
                </p>
              </button>
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
