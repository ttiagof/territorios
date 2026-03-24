import { useState } from 'react'
import TerritoryHistoryModal from './TerritoryHistoryModal'
import AddTerritoryForm from './AddTerritoryForm'

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'available', label: 'Disponíveis' },
  { value: 'assigned', label: 'Designados' },
]

export default function TerritoryGrid({ territories, setTerritories }) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900 shrink-0">Territórios</h1>
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Buscar por nome ou número..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-1 shrink-0">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  statusFilter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="shrink-0 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Adicionar
        </button>
      </div>

      {/* Grid */}
      <div className="p-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">Nenhum território encontrado.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filtered.map(t => (
              <TerritoryCard key={t.id} territory={t} onClick={() => setSelected(t)} />
            ))}
          </div>
        )}
        <p className="text-xs text-gray-400 mt-4 text-right">{filtered.length} território(s)</p>
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

  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-2xl overflow-hidden bg-gray-200 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
    >
      {/* Image area */}
      <div className="w-full aspect-[4/3] bg-[repeating-conic-gradient(#ccc_0%_25%,#e5e5e5_0%_50%)] bg-[length:16px_16px] overflow-hidden">
        {territory.card_front_image_url && (
          <img
            src={territory.card_front_image_url}
            alt={`${name} ${number}`}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Info bar */}
      <div className="px-3 py-2.5 bg-gray-200">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-semibold text-gray-700 truncate">
            {name && <span>{name} </span>}
            <span>{number}</span>
          </p>
          <span
            className={`shrink-0 w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}
          />
        </div>
        {/* Decorative lines mimicking text */}
        <div className="mt-1.5 space-y-1">
          <div className="h-1.5 rounded-full bg-gray-300 w-full" />
          <div className="h-1.5 rounded-full bg-gray-300 w-4/5" />
        </div>
      </div>
    </button>
  )
}
