import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import StatusBadge from './StatusBadge'
import TerritoryModal from './TerritoryModal'
import AddTerritoryForm from './AddTerritoryForm'

const columnHelper = createColumnHelper()

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'available', label: 'Disponível' },
  { value: 'assigned', label: 'Designado' },
  { value: 'completed', label: 'Concluído' },
]

export default function TerritoryTable({ territories, setTerritories }) {
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sorting, setSorting] = useState([])

  const filtered = useMemo(() => {
    let rows = territories
    if (statusFilter) rows = rows.filter(r => r.status === statusFilter)
    if (globalFilter) {
      const q = globalFilter.toLowerCase()
      rows = rows.filter(r =>
        (r.number ?? '').toLowerCase().includes(q) ||
        (r.assigned_to ?? '').toLowerCase().includes(q)
      )
    }
    return rows
  }, [territories, statusFilter, globalFilter])

  const columns = useMemo(() => [
    columnHelper.accessor('number', {
      header: 'Nº',
      cell: info => <span className="font-medium text-gray-900 dark:text-gray-100">{info.getValue()}</span>,
    }),
    columnHelper.accessor('assigned_to', {
      header: 'Designado a',
      cell: info => info.getValue() || <span className="text-gray-400 dark:text-gray-500 italic">—</span>,
    }),
    columnHelper.accessor('assigned_date', {
      header: 'Designação',
      cell: info => formatDate(info.getValue()),
    }),
    columnHelper.accessor('return_date', {
      header: 'Devolução',
      cell: info => formatDate(info.getValue()),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => <StatusBadge status={info.getValue()} />,
    }),
  ], [])

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  function handleSaved(updated) {
    setTerritories(prev => prev.map(t => t.id === updated.id ? updated : t))
    setSelected(updated)
  }

  function handleAdded(territory) {
    setTerritories(prev => [territory, ...prev])
    setShowAdd(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 shrink-0">Territórios</h1>
        <div className="flex items-center gap-3 flex-1 max-w-xl">
          <input
            type="text"
            placeholder="Buscar por número ou nome..."
            value={globalFilter}
            onChange={e => setGlobalFilter(e.target.value)}
            className="flex-1 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
          />
          <div className="flex gap-1 shrink-0">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${statusFilter === f.value ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="shrink-0 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-300 transition-colors"
        >
          + Adicionar
        </button>
      </div>

      {/* Table */}
      <div className="p-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th
                      key={h.id}
                      onClick={h.column.getToggleSortingHandler()}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getIsSorted() === 'asc' ? ' ↑' : h.column.getIsSorted() === 'desc' ? ' ↓' : ''}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {table.getRowModel().rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">Nenhum território encontrado.</td>
                </tr>
              )}
              {table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  onClick={() => setSelected(row.original)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">{filtered.length} território(s)</p>
      </div>

      {selected && (
        <TerritoryModal
          territory={selected}
          onClose={() => setSelected(null)}
          onSaved={handleSaved}
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

function formatDate(val) {
  if (!val) return <span className="text-gray-400 dark:text-gray-500 italic">—</span>
  const [y, m, d] = val.split('-')
  return `${d}/${m}/${y}`
}
