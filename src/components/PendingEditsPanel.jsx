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
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Edições pendentes</span>
          {entries.length > 0 && (
            <span className="text-xs font-semibold bg-indigo-600 text-white rounded-full px-2 py-0.5 leading-none">
              {entries.length}
            </span>
          )}
        </div>
        {!sidebar && (
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

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-[#f0f0f0] flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm text-gray-400">Nenhuma edição pendente</p>
          </div>
        ) : (
          entries.map(entry => {
            const done = doneIds.has(entry.id)
            const isAssign = entry.type === 'assign'
            return (
              <div
                key={entry.id}
                className={`rounded-2xl px-4 py-3 transition-all duration-300 ${
                  done ? 'opacity-30' : 'bg-[#f0f0f0]'
                }`}
              >
                <div className={done ? 'line-through' : ''}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                    isAssign ? 'text-indigo-500' : 'text-red-400'
                  }`}>
                    {isAssign ? 'Designar' : 'Entregar'}
                  </p>
                  <p className="text-sm font-semibold text-gray-900">{entry.territory_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {isAssign ? '→' : '←'} {entry.person_name} · {formatDate(entry.date)}
                  </p>
                </div>
                {!done && (
                  <button
                    onClick={() => markDone(entry.id)}
                    className="mt-2.5 w-full text-xs py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
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
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-80 max-w-full bg-white shadow-2xl z-50 flex flex-col">
        {content}
      </div>
    </>
  )
}
