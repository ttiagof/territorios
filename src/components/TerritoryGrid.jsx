import { useState } from 'react'
import TerritoryHistoryModal from './TerritoryHistoryModal'
import AddTerritoryForm from './AddTerritoryForm'

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'available', label: 'Disponíveis' },
  { value: 'assigned', label: 'Designados' },
]

export default function TerritoryGrid({ territories, setTerritories, onSignOut }) {
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

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
    <div className="min-h-screen bg-[#f0f0f0] relative">

      {/* Sair — subtle top right */}
      <button
        onClick={onSignOut}
        className="absolute top-5 right-6 text-sm text-gray-400 hover:text-gray-600 transition-colors z-10"
      >
        Sair
      </button>

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
        {filtered.length === 0 ? (
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
        />
      )}
      {showAdd && (
        <AddTerritoryForm
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}
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

function formatDate(val) {
  if (!val) return ''
  const [y, m, d] = val.split('-')
  return `${d}/${m}/${y}`
}
