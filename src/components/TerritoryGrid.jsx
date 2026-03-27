import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import TerritoryHistoryModal from './TerritoryHistoryModal'
import AddTerritoryForm from './AddTerritoryForm'
import PendingEditsPanel from './PendingEditsPanel'
import ReturnDatesPanel from './ReturnDatesPanel'
import SettingsModal from './SettingsModal'
import { formatDate, isOverdue, isDueSoon } from '../lib/utils'
import { supabase } from '../lib/supabase'

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'available', label: 'Disponíveis' },
  { value: 'assigned', label: 'Designados' },
  { value: 'overdue', label: 'Atrasados' },
  { value: 'due_soon', label: 'Em breve' },
]

export default function TerritoryGrid({ territories, setTerritories, loading, onSignOut, user }) {
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pendingEdits, setPendingEdits] = useState([])
  const [showEdits, setShowEdits] = useState(false)
  const [showReturns, setShowReturns] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebarWidth')
    return saved ? parseFloat(saved) : 20
  })
  const containerRef = useRef(null)
  const sidebarRef = useRef(null)
  const isDragging = useRef(false)
  const minSidebarPx = useRef(200)

  // After each width change, detect if panel headers are cramping (text wrapping
  // causes scrollHeight > clientHeight on fixed-height h-14 elements).
  // If cramped, record the true minimum and snap back to it.
  useLayoutEffect(() => {
    if (!sidebarRef.current) return
    const headers = sidebarRef.current.querySelectorAll('.h-14')
    let cramped = false
    headers.forEach(h => {
      if (h.scrollHeight > h.clientHeight + 1) cramped = true
    })
    if (cramped) {
      const currentPx = sidebarRef.current.offsetWidth
      minSidebarPx.current = currentPx + 16
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setSidebarWidth((minSidebarPx.current / rect.width) * 100)
      }
    }
  }, [sidebarWidth])

  useEffect(() => {
    function onMove(clientX) {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((clientX - rect.left) / rect.width) * 100
      const minPct = (minSidebarPx.current / rect.width) * 100
      setSidebarWidth(Math.min(35, Math.max(minPct, pct)))
    }
    function onMouseMove(e) { onMove(e.clientX) }
    function onTouchMove(e) { onMove(e.touches[0].clientX) }
    function stopDrag() {
      isDragging.current = false
      // Save after drag ends so we don't hammer localStorage on every pixel
      if (containerRef.current) {
        setSidebarWidth(prev => {
          localStorage.setItem('sidebarWidth', String(prev))
          return prev
        })
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', stopDrag)
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', stopDrag)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', stopDrag)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', stopDrag)
    }
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', String(darkMode))
  }, [darkMode])

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
    .filter(t => {
      if (!statusFilter) return true
      if (statusFilter === 'overdue') return t.status === 'assigned' && t.assigned_date && isOverdue(t.assigned_date)
      if (statusFilter === 'due_soon') return t.status === 'assigned' && t.assigned_date && isDueSoon(t.assigned_date)
      return t.status === statusFilter
    })
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
    <div ref={containerRef} className="h-[100dvh] bg-[#f0f0f0] dark:bg-gray-950 flex p-2 sm:p-4 gap-0">

      {/* Left sidebar — resizable on desktop */}
      <div
        ref={sidebarRef}
        className="hidden lg:flex flex-col shrink-0 gap-4"
        style={{ width: `${sidebarWidth}%` }}
      >
        <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <PendingEditsPanel
            entries={pendingEdits}
            onDone={handleDone}
            sidebar
          />
        </div>
        <div className="rounded-3xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
          <ReturnDatesPanel territories={territories} onSelect={t => setSelected(t)} />
        </div>
      </div>

      {/* Drag handle — desktop only, sits in the gap between sidebar and main */}
      <div
        className="hidden lg:flex items-center justify-center w-4 shrink-0 cursor-col-resize group select-none"
        onMouseDown={e => { isDragging.current = true; e.preventDefault() }}
        onTouchStart={() => { isDragging.current = true }}
      >
        <div className="w-px h-8 rounded-full bg-gray-300 dark:bg-gray-700 group-hover:bg-gray-400 group-active:bg-gray-500 transition-colors" />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 rounded-2xl sm:rounded-3xl bg-white dark:bg-gray-900 shadow-sm overflow-hidden flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-5 h-14 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Territórios</span>
          {territories.length > 0 && (
            <span className="text-xs font-semibold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full px-2 py-0.5 leading-none">
              {territories.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReturns(true)}
            className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full bg-[#f0f0f0] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
            title="Próximas devoluções"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </button>
          {pendingEdits.length > 0 && (
            <button
              onClick={() => setShowEdits(true)}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full bg-[#f0f0f0] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
              title="Edições pendentes"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setDarkMode(d => !d)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f0f0f0] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
            title={darkMode ? 'Modo claro' : 'Modo escuro'}
          >
            {darkMode ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f0f0f0] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors cursor-pointer"
            title="Definições"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-6 pt-4 pb-6 overscroll-contain">

        {/* Filter pills */}
        <div className="flex gap-2 mb-4 sm:mb-5 overflow-x-auto no-scrollbar -mx-3 sm:-mx-6 px-3 sm:px-6 pb-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`shrink-0 px-4 sm:px-5 py-2 rounded-full text-sm font-medium border transition-all duration-200 cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search + Add */}
        <div className="flex gap-3 mb-4 sm:mb-6">
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
              className="w-full h-12 bg-[#f0f0f0] dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 border border-transparent rounded-full pl-11 pr-5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent transition"
            />
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="w-12 h-12 shrink-0 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-300 rounded-full flex items-center justify-center active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 shadow-sm cursor-pointer"
            title="Adicionar território"
          >
            <svg className="w-5 h-5 text-white dark:text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-[#e8e8e8] dark:bg-gray-800 animate-pulse">
                <div className="w-full aspect-[4/3] bg-[#d8d8d8] dark:bg-gray-700" />
                <div className="px-3 py-2.5 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3" />
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f0f0f0] dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum território encontrado</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Tente ajustar os filtros ou adicione um novo.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filtered.map(t => (
                <TerritoryCard key={t.id} territory={t} onClick={() => setSelected(t)} />
              ))}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-5 text-center">{filtered.length} território(s)</p>
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
          <div className="relative bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl w-full max-h-[85dvh] flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
            <div className="flex justify-center pt-3 pb-0 shrink-0">
              <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
            </div>
            <ReturnDatesPanel territories={territories} onClose={() => setShowReturns(false)} onSelect={t => { setShowReturns(false); setSelected(t) }} />
          </div>
        </div>
      )}
      {showAdd && (
        <AddTerritoryForm
          onClose={() => setShowAdd(false)}
          onAdded={handleAdded}
        />
      )}
      {showSettings && (
        <SettingsModal
          user={user}
          onClose={() => setShowSettings(false)}
          onSignOut={onSignOut}
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
  const overdue = !isAvailable && territory.assigned_date && isOverdue(territory.assigned_date)
  const dueSoon = !isAvailable && territory.assigned_date && !overdue && isDueSoon(territory.assigned_date)

  return (
    <button
      onClick={onClick}
      className="group flex flex-col rounded-2xl bg-[#f0f0f0] dark:bg-gray-800 hover:bg-[#e8e8e8] dark:hover:bg-gray-750 hover:scale-[1.02] transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-[#f0f0f0] dark:focus:ring-offset-gray-950 cursor-pointer p-2 pb-0"
    >
      {/* Image area — inset with own rounded corners */}
      <div className={`w-full aspect-[4/3] overflow-hidden relative rounded-xl ${
        territory.card_front_image_url
          ? 'bg-[#d8d8d8] dark:bg-gray-700'
          : isAvailable
            ? 'bg-gradient-to-br from-[#e8e8e8] to-[#dcdcdc] dark:from-gray-700 dark:to-gray-600'
            : 'bg-gradient-to-br from-[#e8e8e8] to-[#d4d4d4] dark:from-gray-700 dark:to-gray-600'
      }`}>
        {territory.card_front_image_url ? (
          <img
            src={territory.card_front_image_url}
            alt={label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-2">
            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
            <span className="text-lg font-bold text-gray-400 leading-none text-center truncate w-full px-1">{number || label}</span>
          </div>
        )}
        {/* Status indicator dot */}
        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ring-2 ring-white dark:ring-gray-800 ${
          isAvailable ? 'bg-emerald-500' :
          overdue     ? 'bg-red-500'     :
          dueSoon     ? 'bg-amber-400'   :
                        'bg-gray-400 dark:bg-gray-500'
        }`} />
      </div>

      {/* Info bar */}
      <div className="px-1 py-2.5">
        <div className="flex items-center justify-between gap-1">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate leading-tight">{label}</p>
          <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
            overdue     ? 'bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400'                   :
            dueSoon     ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400'           :
            isAvailable ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 dark:text-emerald-400'   :
                          'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
          }`}>
            {overdue ? 'Atrasado' : dueSoon ? 'Em breve' : isAvailable ? 'Livre' : 'Designado'}
          </span>
        </div>
        {!isAvailable && territory.assigned_to && (
          <div className="mt-0.5">
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{territory.assigned_to}</p>
            {territory.assigned_date && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500">desde {formatDate(territory.assigned_date)}</p>
            )}
          </div>
        )}
        {isAvailable && territory.return_date && (
          <div className="mt-0.5">
            <p className="text-[10px] text-gray-400 dark:text-gray-500">desde {formatDate(territory.return_date)}</p>
          </div>
        )}
      </div>
    </button>
  )
}
