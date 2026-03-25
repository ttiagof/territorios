import { useState, useEffect } from 'react'
import TerritoryHistoryModal from './TerritoryHistoryModal'
import AddTerritoryForm from './AddTerritoryForm'
import PendingEditsPanel from './PendingEditsPanel'
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
    <div className="min-h-screen bg-[#f0f0f0] flex">

      {/* Pending edits sidebar — desktop left 30% */}
      <div className="hidden lg:flex flex-col w-[30%] shrink-0 h-screen sticky top-0 bg-white border-r border-gray-200">
        <PendingEditsPanel
          entries={pendingEdits}
          onDone={handleDone}
          sidebar
        />
      </div>

      {/* Main content — 70% */}
      <div className="flex-1 min-w-0 relative">

      {/* Top-right actions */}
      <div className="absolute top-5 right-6 flex items-center gap-3 z-10">
        {/* Badge — mobile only */}
        {pendingEdits.length > 0 && (
          <button
            onClick={() => setShowEdits(true)}
            className="lg:hidden flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <span>✎</span>
            <span className="text-xs font-semibold bg-gray-900 text-white rounded-full px-1.5 py-0.5 leading-none">
              {pendingEdits.length}
            </span>
          </button>
        )}
        <button
          onClick={onSignOut}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sair
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-16 pb-12">

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-7xl font-black text-gray-900 tracking-tight leading-none">Territórios</h1>
          <p className="text-2xl text-gray-400 font-normal mt-2">Ventosa</p>
        </div>

        {/* Filter pills */}
        <div className="flex justify-center gap-3 mb-5">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-8 py-3 rounded-full text-sm font-medium border transition-all ${
                statusFilter === f.value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search + Add */}
        <div className="flex gap-3 mb-8 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              placeholder="Pesquisar"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-14 bg-white border border-gray-200 rounded-full pl-12 pr-5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition"
            />
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="w-14 h-14 shrink-0 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400"
            title="Adicionar território"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-3xl overflow-hidden bg-white animate-pulse">
                <div className="w-full aspect-[5/3] bg-gray-200" />
                <div className="px-3 py-2.5 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">Nenhum território encontrado</p>
            <p className="text-sm text-gray-400">Tente ajustar os filtros ou adicione um novo.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
      className="group flex flex-col rounded-3xl overflow-hidden bg-white hover:shadow-lg hover:scale-[1.02] transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-[#f0f0f0]"
    >
      {/* Image area */}
      <div className="w-full aspect-[5/3] overflow-hidden bg-[#e8e8e8] relative">
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
      </div>

      {/* Info bar */}
      <div className="px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{label}</p>
          <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
          }`}>
            {isAvailable ? 'Livre' : 'Ocupado'}
          </span>
        </div>
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
            <p className="text-[10px] text-gray-400">disponível desde {formatDate(territory.return_date)}</p>
          </div>
        )}
      </div>
    </button>
  )
}

