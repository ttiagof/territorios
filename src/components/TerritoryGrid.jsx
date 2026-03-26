import { useState, useEffect } from 'react'
import TerritoryHistoryModal from './TerritoryHistoryModal'
import AddTerritoryForm from './AddTerritoryForm'
import PendingEditsPanel from './PendingEditsPanel'
import ReturnDatesPanel from './ReturnDatesPanel'
import { formatDate } from '../lib/utils'
import { supabase } from '../lib/supabase'

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'available', label: 'Disponíveis' },
  { value: 'assigned', label: 'Designados' },
]

export default function TerritoryGrid({ territories, setTerritories, loading, onSignOut }) {
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pendingEdits, setPendingEdits] = useState([])
  const [showEdits, setShowEdits] = useState(false)
  const [showReturns, setShowReturns] = useState(false)

  useEffect(() => {
    supabase
      .from('pending_edits')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => setPendingEdits(data ?? []))
  }, [])

  async function handleDone(id) {
    await supabase.from('pending_edits').delete().eq('id', id)
    setPendingEdits(prev => prev.filter(e => e.id !== id))
  }

  const filtered = territories
    .filter(t => !statusFilter || t.status === statusFilter)
    .filter(t => {
      if (!search) return true
      const q = search.toLowerCase()
      const full = `${t.name ?? ''} ${t.number ?? ''}`.toLowerCase()
      return full.includes(q)
    })
    .sort((a, b) => {
      const na = parseInt(a.number) || 0
      const nb = parseInt(b.number) || 0
      return na - nb
    })

  function handleAdded(territory) {
    setTerritories(prev => [...prev, territory])
    setShowAdd(false)
  }

  function handleUpdated(updated) {
    setTerritories(prev => prev.map(t => t.id === updated.id ? updated : t))
    setSelected(updated)
  }

  return (
    <div className="h-screen bg-[#f0f0f0] flex gap-4 p-4">

      {/* Left sidebar — desktop 30% */}
      <div className="hidden lg:flex flex-col w-[30%] shrink-0 gap-4">
        <div className="rounded-3xl bg-white shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <PendingEditsPanel
            entries={pendingEdits}
            onDone={handleDone}
            sidebar
          />
        </div>
        <div className="rounded-3xl bg-white shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <ReturnDatesPanel territories={territories} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 rounded-3xl bg-white shadow-sm overflow-hidden flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900">Territórios</span>
          {territories.length > 0 && (
            <span className="text-xs font-semibold bg-indigo-600 text-white rounded-full px-2 py-0.5 leading-none">
              {territories.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReturns(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full bg-[#f0f0f0] hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
            title="Próximas devoluções"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </button>
          {pendingEdits.length > 0 && (
            <button
              onClick={() => setShowEdits(true)}
              className="lg:hidden flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
              <span className="text-xs font-semibold bg-indigo-600 text-white rounded-full px-1.5 py-0.5 leading-none">
                {pendingEdits.length}
              </span>
            </button>
          )}
          <button
            onClick={onSignOut}
            className="text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors bg-[#f0f0f0] hover:bg-gray-200 px-3 py-1.5 rounded-full cursor-pointer"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">

        {/* Filter pills */}
        <div className="flex justify-start gap-2 mb-5">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search + Add */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Pesquisar"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-12 bg-[#f0f0f0] border border-transparent rounded-full pl-11 pr-5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
            />
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="w-12 h-12 shrink-0 bg-indigo-600 hover:bg-indigo-700 rounded-full flex items-center justify-center active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm shadow-indigo-200 cursor-pointer"
            title="Adicionar território"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-[#e8e8e8] animate-pulse">
                <div className="w-full aspect-[4/3] bg-[#d8d8d8]" />
                <div className="px-3 py-2.5 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f0f0f0] flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Nenhum território encontrado</p>
            <p className="text-sm text-gray-400">Tente ajustar os filtros ou adicione um novo.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filtered.map(t => (
                <TerritoryCard key={t.id} territory={t} onClick={() => setSelected(t)} />
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-5 text-center">{filtered.length} território(s)</p>
          </>
        )}
      </div>

      {selected && (
        <TerritoryHistoryModal
          territory={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
          onPendingEdit={entry => setPendingEdits(prev => [entry, ...prev])}
        />
      )}
      {/* Mobile slide-in panel */}
      {showEdits && (
        <PendingEditsPanel
          entries={pendingEdits}
          onDone={handleDone}
          onClose={() => setShowEdits(false)}
        />
      )}
      {showReturns && (
        <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowReturns(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl w-full max-h-[80vh] flex flex-col overflow-hidden">
            <ReturnDatesPanel territories={territories} onClose={() => setShowReturns(false)} />
          </div>
        </div>
      )}
      {showAdd && (
        <AddTerritoryForm
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}
      </div>

    </div>
  )
}

function TerritoryCard({ territory, onClick }) {
  const isAvailable = territory.status === 'available'
  const name = territory.name ?? ''
  const number = territory.number ?? ''
  const label = name ? `${name} ${number}` : number

  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-2xl overflow-hidden bg-[#f0f0f0] hover:bg-[#e8e8e8] hover:scale-[1.02] transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-[#f0f0f0] cursor-pointer"
    >
      {/* Image area */}
      <div className="w-full aspect-[4/3] overflow-hidden bg-[#d8d8d8] relative">
        {territory.card_front_image_url ? (
          <img
            src={territory.card_front_image_url}
            alt={label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
          </div>
        )}
        {/* Status indicator dot */}
        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ring-white ${isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
      </div>

      {/* Info bar */}
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{label}</p>
        {!isAvailable && territory.assigned_to && (
          <div className="mt-0.5">
            <p className="text-xs text-gray-500 truncate">{territory.assigned_to}</p>
            {territory.assigned_date && (
              <p className="text-[10px] text-gray-400">desde {formatDate(territory.assigned_date)}</p>
            )}
          </div>
        )}
        {isAvailable && territory.return_date && (
          <div className="mt-0.5">
            <p className="text-[10px] text-gray-400">desde {formatDate(territory.return_date)}</p>
          </div>
        )}
        {isAvailable && !territory.return_date && (
          <p className="text-[10px] text-emerald-500 font-medium mt-0.5">Livre</p>
        )}
      </div>
    </button>
  )
}
