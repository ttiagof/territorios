import { useState } from 'react'
import { formatDate } from '../lib/utils'

export default function PendingEditsPanel({ entries, onDone, onClose, sidebar }) {
  const [doneIds, setDoneIds] = useState(new Set())

  function markDone(id) {
    setDoneIds(prev => new Set([...prev, id]))
    setTimeout(() => onDone(id), 1500)
  }

  const content = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Edições pendentes</span>
          {entries.length > 0 && (
            <span className="text-xs font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full px-2 py-0.5 leading-none">
              {entries.length}
            </span>
          )}
        </div>
        {!sidebar && (
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

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#f0f0f0] dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm text-gray-400 dark:text-gray-500">Nenhuma edição pendente</p>
          </div>
        ) : (
          entries.map(entry => {
            const done = doneIds.has(entry.id)
            const isAssign = entry.type === 'assign'
            return (
              <div
                key={entry.id}
                className={`rounded-2xl px-4 py-3 transition-all duration-300 ${
                  done ? 'opacity-30' : 'bg-[#f0f0f0] dark:bg-gray-800'
                }`}
              >
                <div className={done ? 'line-through' : ''}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                    isAssign ? 'text-gray-500' : 'text-red-400'
                  }`}>
                    {isAssign ? 'Designar' : 'Entregar'}
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{entry.territory_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {isAssign ? '→' : '←'} {entry.person_name} · {formatDate(entry.date)}
                  </p>
                </div>
                {!done && (
                  <button
                    onClick={() => markDone(entry.id)}
                    className="mt-2.5 w-full text-xs py-1.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-300 transition-colors font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    Feito
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </>
  )

  if (sidebar) {
    return <div className="flex flex-col flex-1 min-h-0">{content}</div>
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      {/* Panel — bottom sheet on mobile, right panel on sm+ */}
      <div className="fixed bottom-0 left-0 right-0 sm:top-0 sm:bottom-auto sm:left-auto sm:right-0 sm:h-full sm:w-80 bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-none shadow-2xl z-50 flex flex-col max-h-[85dvh] sm:max-h-full">
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-0 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        {content}
        {/* Safe area spacer — mobile only */}
        <div className="sm:hidden h-[env(safe-area-inset-bottom)] shrink-0" />
      </div>
    </>
  )
}
