import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

export default function TerritoryHistoryModal({ territory, onClose, onUpdated }) {
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [showAssignForm, setShowAssignForm] = useState(false)
  const [showReturnForm, setShowReturnForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [assignForm, setAssignForm] = useState({ person_name: '', assigned_date: '' })
  const [returnDate, setReturnDate] = useState('')
  const [editForm, setEditForm] = useState({ name: territory.name ?? '', number: territory.number ?? '', notes: territory.notes ?? '' })
  const [frontImageFile, setFrontImageFile] = useState(null)
  const [backImageFile, setBackImageFile] = useState(null)
  const [frontPreview, setFrontPreview] = useState(territory.card_front_image_url ?? null)
  const [backPreview, setBackPreview] = useState(territory.card_back_image_url ?? null)
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [territory.id])

  // Sync previews if territory prop updates (e.g. after saving edit)
  useEffect(() => {
    if (!frontImageFile) setFrontPreview(territory.card_front_image_url ?? null)
    if (!backImageFile) setBackPreview(territory.card_back_image_url ?? null)
  }, [territory.card_front_image_url, territory.card_back_image_url])

  async function fetchHistory() {
    setLoadingHistory(true)
    const { data } = await supabase
      .from('territory_history')
      .select('*')
      .eq('territory_id', territory.id)
      .order('created_at', { ascending: false })
    setHistory(data ?? [])
    setLoadingHistory(false)
  }

  const isAvailable = territory.status === 'available'
  const territoryTitle = territory.name
    ? `${territory.name} ${territory.number}`
    : territory.number

  async function handleAssign(e) {
    e.preventDefault()
    if (!assignForm.person_name.trim()) { setError('Nome obrigatório.'); return }
    if (!assignForm.assigned_date) { setError('Data de designação obrigatória.'); return }
    setSaving(true)
    setError(null)
    try {
      const { data: updated } = await supabase
        .from('territories')
        .update({
          status: 'assigned',
          assigned_to: assignForm.person_name,
          assigned_date: assignForm.assigned_date,
          return_date: null,
        })
        .eq('id', territory.id)
        .select()
        .single()

      onUpdated(updated)
      setShowAssignForm(false)
      setAssignForm({ person_name: '', assigned_date: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeliver(e) {
    e.preventDefault()
    if (!returnDate) { setError('Data de entrega obrigatória.'); return }
    setSaving(true)
    setError(null)
    try {
      // Rolling cap: max 50 entries
      const { count } = await supabase
        .from('territory_history')
        .select('*', { count: 'exact', head: true })
        .eq('territory_id', territory.id)

      if (count >= 50) {
        const { data: oldest } = await supabase
          .from('territory_history')
          .select('id')
          .eq('territory_id', territory.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .single()
        await supabase.from('territory_history').delete().eq('id', oldest.id)
      }

      const { error: insertError } = await supabase.from('territory_history').insert({
        territory_id: territory.id,
        person_name: territory.assigned_to,
        assigned_date: territory.assigned_date,
        return_date: returnDate,
      })
      if (insertError) throw insertError

      const { data: updated } = await supabase
        .from('territories')
        .update({ status: 'available', return_date: returnDate })
        .eq('id', territory.id)
        .select()
        .single()

      onUpdated(updated)
      setShowReturnForm(false)
      setReturnDate('')
      fetchHistory()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteEntry(id) {
    await supabase.from('territory_history').delete().eq('id', id)
    fetchHistory()
  }

  async function downloadOne(url, filename) {
    const res = await fetch(url)
    const blob = await res.blob()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
    URL.revokeObjectURL(a.href)
  }

  async function downloadBoth() {
    if (frontPreview) await downloadOne(frontPreview, `${territoryTitle}-frente.jpg`)
    if (backPreview) {
      await new Promise(r => setTimeout(r, 300))
      await downloadOne(backPreview, `${territoryTitle}-verso.jpg`)
    }
  }

  async function handleSaveEdit() {
    setSaving(true)
    setError(null)
    try {
      const updates = {
        name: editForm.name,
        number: editForm.number,
        notes: editForm.notes,
      }

      if (frontImageFile) {
        const ext = frontImageFile.name.split('.').pop()
        const path = `${territory.id}-front.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('territory-cards')
          .upload(path, frontImageFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('territory-cards').getPublicUrl(path)
        updates.card_front_image_url = urlData.publicUrl
      } else if (!frontPreview && territory.card_front_image_url) {
        updates.card_front_image_url = null
      }

      if (backImageFile) {
        const ext = backImageFile.name.split('.').pop()
        const path = `${territory.id}-back.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('territory-cards')
          .upload(path, backImageFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('territory-cards').getPublicUrl(path)
        updates.card_back_image_url = urlData.publicUrl
      } else if (!backPreview && territory.card_back_image_url) {
        updates.card_back_image_url = null
      }

      const { data: updated } = await supabase
        .from('territories')
        .update(updates)
        .eq('id', territory.id)
        .select()
        .single()

      onUpdated(updated)
      setShowEditForm(false)
      setFrontImageFile(null)
      setBackImageFile(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    {/* Lightbox */}
    {lightboxSrc && (
      <div
        className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
        onClick={() => setLightboxSrc(null)}
      >
        <button
          onClick={() => setLightboxSrc(null)}
          className="absolute top-4 right-6 text-white text-2xl leading-none hover:text-gray-300"
        >
          ✕
        </button>
        <img
          src={lightboxSrc}
          alt="Cartão ampliado"
          className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
          onClick={e => e.stopPropagation()}
        />
      </div>
    )}
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-gray-900">{territoryTitle}</span>
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className={`text-xs font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {isAvailable ? 'Disponível' : 'Designado'}
              </span>
            </div>
            {!isAvailable && territory.assigned_to && (
              <p className="text-sm text-gray-500 mt-0.5">
                Com <span className="font-medium text-gray-700">{territory.assigned_to}</span>
                {territory.assigned_date && (
                  <span className="text-gray-400"> · desde {formatDate(territory.assigned_date)}</span>
                )}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Card images — side by side */}
          <div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { src: frontPreview, label: 'Frente', suffix: 'frente' },
                { src: backPreview, label: 'Verso', suffix: 'verso' },
              ].map(({ src, label, suffix }) => (
                <div key={label}>
                  <div className="relative">
                    <div
                      onClick={() => src && setLightboxSrc(src)}
                      className={`rounded-xl overflow-hidden bg-gray-100 border border-gray-200 ${src ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                    >
                      {src ? (
                        <img src={src} alt={`${territoryTitle} — ${label}`} className="w-full object-cover aspect-[5/3]" />
                      ) : (
                        <div className="aspect-[5/3] flex items-center justify-center text-gray-400 text-xs">Sem imagem</div>
                      )}
                    </div>
                    {src && (
                      <button
                        onClick={e => { e.stopPropagation(); downloadOne(src, `${territoryTitle}-${suffix}.jpg`) }}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-lg px-2 py-1 text-xs leading-none transition-colors"
                        title={`Baixar ${label}`}
                      >
                        ⬇
                      </button>
                    )}
                  </div>
                  <p className="text-center text-xs text-gray-500 mt-1 font-medium">{label}</p>
                </div>
              ))}
            </div>
            {(frontPreview || backPreview) && (
              <button
                onClick={downloadBoth}
                className="mt-2 w-full text-sm py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                ⬇ Baixar cartões
              </button>
            )}
          </div>

          {/* Edit territory toggle */}
          {showEditForm ? (
            <div className="border border-gray-200 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Editar território</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                  <input
                    value={editForm.number}
                    onChange={e => setEditForm(f => ({ ...f, number: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Imagem da frente</label>
                <ImageDropZone
                  preview={frontPreview}
                  onFile={file => { setFrontImageFile(file); setFrontPreview(URL.createObjectURL(file)) }}
                  onClear={() => { setFrontImageFile(null); setFrontPreview(null) }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Imagem do verso</label>
                <ImageDropZone
                  preview={backPreview}
                  onFile={file => { setBackImageFile(file); setBackPreview(URL.createObjectURL(file)) }}
                  onClear={() => { setBackImageFile(null); setBackPreview(null) }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowEditForm(false); setFrontImageFile(null); setBackImageFile(null) }}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="text-sm px-3 py-1.5 rounded-lg bg-gray-900 text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowEditForm(true)}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Editar território
            </button>
          )}

          {/* History */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Histórico</h3>
            {loadingHistory ? (
              <p className="text-sm text-gray-400">Carregando...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Nenhum registro ainda.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {history.map(entry => (
                  <div key={entry.id} className="flex items-start justify-between text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <div>
                      <p className="font-medium text-gray-800">{entry.person_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Recebeu: {formatDate(entry.assigned_date)}
                        {entry.return_date && ` · Entregou: ${formatDate(entry.return_date)}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="shrink-0 ml-2 text-gray-300 hover:text-red-400 transition-colors text-base leading-none mt-0.5"
                      title="Remover"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign form */}
          {showAssignForm && (
            <form onSubmit={handleAssign} className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">Atribuir território</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome da pessoa</label>
                  <input
                    value={assignForm.person_name}
                    onChange={e => setAssignForm(f => ({ ...f, person_name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Data de designação</label>
                  <input
                    type="date"
                    value={assignForm.assigned_date}
                    onChange={e => setAssignForm(f => ({ ...f, assigned_date: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowAssignForm(false); setError(null) }}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          )}

          {/* Deliver form */}
          {showReturnForm && (
            <form onSubmit={handleDeliver} className="border border-red-100 bg-red-50 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Entregar — {territory.assigned_to}
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data de entrega</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setShowReturnForm(false); setError(null) }}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Salvando...' : 'Confirmar entrega'}
                </button>
              </div>
            </form>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 flex gap-2 border-t border-gray-100 pt-4">
          <div className="flex gap-2 flex-1 justify-end">
            {isAvailable && !showAssignForm && (
              <button
                onClick={() => { setShowAssignForm(true); setShowReturnForm(false); setError(null) }}
                className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
              >
                Atribuir
              </button>
            )}
            {!isAvailable && !showReturnForm && (
              <button
                onClick={() => { setShowReturnForm(true); setShowAssignForm(false); setError(null) }}
                className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
              >
                Entregar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

function ImageDropZone({ preview, onFile, onClear }) {
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef(null)

  function handleDrop(e) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) onFile(file)
  }

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed transition-colors cursor-pointer overflow-hidden
        ${dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'}`}
      style={{ minHeight: '7rem' }}
      onDragOver={e => { e.preventDefault(); setDragActive(true) }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files[0]; if (f) onFile(f) }}
      />
      {preview ? (
        <>
          <img src={preview} alt="preview" className="w-full object-cover" style={{ minHeight: '7rem', maxHeight: '10rem' }} />
          <button
            onClick={e => { e.stopPropagation(); onClear() }}
            className="absolute top-1.5 right-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs leading-none transition-colors"
            title="Remover imagem"
          >
            ✕
          </button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 gap-1 text-gray-400 select-none" style={{ minHeight: '7rem' }}>
          <span className="text-2xl">🖼</span>
          <span className="text-xs text-center px-2">Arraste uma imagem ou clique para selecionar</span>
        </div>
      )}
    </div>
  )
}

function formatDate(val) {
  if (!val) return '—'
  const [y, m, d] = val.split('-')
  return `${d}/${m}/${y}`
}
