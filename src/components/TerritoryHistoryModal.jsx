import { useState, useEffect } from 'react'

import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/imageUtils'
import { formatDate, isOverdue, isDueSoon } from '../lib/utils'
import ImageDropZone from './ImageDropZone'

export default function TerritoryHistoryModal({ territory, onClose, onUpdated, onPendingEdit }) {
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
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [showEditAssignedDate, setShowEditAssignedDate] = useState(false)
  const [editAssignedDate, setEditAssignedDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchHistory()
  }, [territory.id])

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
  const overdue = !isAvailable && territory.assigned_date && isOverdue(territory.assigned_date)
  const dueSoon = !isAvailable && territory.assigned_date && !overdue && isDueSoon(territory.assigned_date)
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

      const editEntry = { type: 'assign', territory_name: territoryTitle, person_name: assignForm.person_name, date: assignForm.assigned_date }
      const { data: editData } = await supabase.from('pending_edits').insert(editEntry).select().single()
      if (editData) onPendingEdit(editData)
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

      const editEntry = { type: 'deliver', territory_name: territoryTitle, person_name: territory.assigned_to, date: returnDate }
      const { data: editData } = await supabase.from('pending_edits').insert(editEntry).select().single()
      if (editData) onPendingEdit(editData)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateAssignedDate(e) {
    e.preventDefault()
    if (!editAssignedDate) { setError('Data obrigatória.'); return }
    setSaving(true)
    setError(null)
    try {
      const { data: updated } = await supabase
        .from('territories')
        .update({ assigned_date: editAssignedDate })
        .eq('id', territory.id)
        .select()
        .single()
      onUpdated(updated)
      setShowEditAssignedDate(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteEntry(id) {
    await supabase.from('territory_history').delete().eq('id', id)
    setPendingDeleteId(null)
    fetchHistory()
  }

  async function shareImages() {
    const files = []
    if (frontPreview) {
      const res = await fetch(frontPreview)
      const blob = await res.blob()
      files.push(new File([blob], `${territoryTitle}-frente.jpg`, { type: 'image/jpeg' }))
    }
    if (backPreview) {
      const res = await fetch(backPreview)
      const blob = await res.blob()
      files.push(new File([blob], `${territoryTitle}-verso.jpg`, { type: 'image/jpeg' }))
    }
    if (files.length && navigator.canShare?.({ files })) {
      await navigator.share({ files })
    }
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
        const compressed = await compressImage(frontImageFile)
        const path = `${territory.id}-front.jpg`
        const { error: uploadError } = await supabase.storage
          .from('territory-cards')
          .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('territory-cards').getPublicUrl(path)
        updates.card_front_image_url = urlData.publicUrl
      } else if (!frontPreview && territory.card_front_image_url) {
        updates.card_front_image_url = null
      }

      if (backImageFile) {
        const compressed = await compressImage(backImageFile)
        const path = `${territory.id}-back.jpg`
        const { error: uploadError } = await supabase.storage
          .from('territory-cards')
          .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
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
          className="absolute top-4 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <img
          src={lightboxSrc}
          alt="Cartão ampliado"
          className="max-h-[90vh] max-w-[90vw] object-contain rounded-2xl"
          onClick={e => e.stopPropagation()}
        />
      </div>
    )}

    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-0 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-base font-semibold text-gray-900">{territoryTitle}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                isAvailable ? 'bg-emerald-50 text-emerald-600' :
                overdue     ? 'bg-red-50 text-red-500'         :
                dueSoon     ? 'bg-amber-50 text-amber-500'     :
                              'bg-accent-200 text-accent-600'
              }`}>
                {isAvailable ? 'Disponível' : overdue ? 'Atrasado' : dueSoon ? 'Em breve' : 'Designado'}
              </span>
            </div>
            {!isAvailable && territory.assigned_to && (
              <div className="mt-0.5">
                <p className="text-sm text-gray-400">
                  Com <span className="font-medium text-gray-600">{territory.assigned_to}</span>
                  {territory.assigned_date && !showEditAssignedDate && (
                    <>
                      <span> · desde {formatDate(territory.assigned_date)}</span>
                      <button
                        onClick={() => { setEditAssignedDate(territory.assigned_date); setShowEditAssignedDate(true) }}
                        className="ml-1.5 text-gray-300 hover:text-accent-500 transition-colors leading-none align-middle inline-flex cursor-pointer"
                        title="Editar data"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                        </svg>
                      </button>
                    </>
                  )}
                </p>
                {showEditAssignedDate && (
                  <form onSubmit={handleUpdateAssignedDate} className="flex items-center gap-2 mt-1.5">
                    <input
                      type="date"
                      value={editAssignedDate}
                      onChange={e => setEditAssignedDate(e.target.value)}
                      className="bg-[#f0f0f0] rounded-lg px-2 py-1 text-xs border-0 focus:outline-none focus:ring-2 focus:ring-accent-400"
                      autoFocus
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className="text-xs px-2.5 py-1 rounded-lg bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-40 font-semibold transition-colors cursor-pointer"
                    >
                      {saving ? '...' : 'Salvar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowEditAssignedDate(false); setError(null) }}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Cancelar
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f0f0f0] hover:bg-gray-200 text-gray-500 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-5">
          {/* Card images */}
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
                      className={`rounded-2xl overflow-hidden bg-[#f0f0f0] ${src ? 'cursor-pointer' : ''}`}
                    >
                      {src ? (
                        <img src={src} alt={`${territoryTitle} — ${label}`} className="w-full object-cover aspect-[5/3]" />
                      ) : (
                        <div className="aspect-[5/3] flex items-center justify-center text-gray-300 text-xs">Sem imagem</div>
                      )}
                    </div>
                    {src && (
                      <button
                        onClick={e => { e.stopPropagation(); downloadOne(src, `${territoryTitle}-${suffix}.jpg`) }}
                        className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white rounded-lg p-1.5 transition-colors cursor-pointer"
                        title={`Baixar ${label}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <p className="text-center text-xs text-gray-400 mt-1.5 font-medium">{label}</p>
                </div>
              ))}
            </div>
            {(frontPreview || backPreview) && (
              <div className="mt-2.5 flex gap-2">
                <button
                  onClick={downloadBoth}
                  className="flex-1 text-sm py-2 rounded-xl bg-[#f0f0f0] text-gray-600 hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Baixar cartões
                </button>
                {navigator.canShare && (
                  <button
                    onClick={shareImages}
                    className="flex-1 text-sm py-2 rounded-xl bg-[#f0f0f0] text-gray-600 hover:bg-gray-200 transition-colors font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
                    </svg>
                    Partilhar
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {!showEditForm && territory.notes && (
            <div className="bg-[#f0f0f0] rounded-2xl px-4 py-3">
              <p className="text-xs font-medium text-gray-500 mb-1">Observações</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{territory.notes}</p>
            </div>
          )}

          {/* Edit form */}
          {showEditForm ? (
            <div className="bg-[#f0f0f0] rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Editar território</h3>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Nome</label>
                  <input
                    value={editForm.name}
                    onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-white rounded-xl px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-accent-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Número</label>
                  <input
                    value={editForm.number}
                    onChange={e => setEditForm(f => ({ ...f, number: e.target.value }))}
                    className="w-full bg-white rounded-xl px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-accent-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Imagem da frente</label>
                <ImageDropZone
                  preview={frontPreview}
                  onFile={file => { setFrontImageFile(file); setFrontPreview(URL.createObjectURL(file)) }}
                  onClear={() => { setFrontImageFile(null); setFrontPreview(null) }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Imagem do verso</label>
                <ImageDropZone
                  preview={backPreview}
                  onFile={file => { setBackImageFile(file); setBackPreview(URL.createObjectURL(file)) }}
                  onClear={() => { setBackImageFile(null); setBackPreview(null) }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Observações</label>
                <textarea
                  value={editForm.notes}
                  onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  className="w-full bg-white rounded-xl px-3 py-2 text-sm border-0 resize-none focus:outline-none focus:ring-2 focus:ring-accent-400"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-1">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="w-full sm:w-auto text-sm px-4 py-2.5 sm:py-2 rounded-xl bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-40 font-semibold transition-colors cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  onClick={() => { setShowEditForm(false); setFrontImageFile(null); setBackImageFile(null) }}
                  className="w-full sm:w-auto text-sm px-4 py-2.5 sm:py-2 rounded-xl bg-white text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowEditForm(true)}
              className="text-xs text-accent-500 hover:text-accent-700 transition-colors font-medium cursor-pointer"
            >
              Editar território →
            </button>
          )}

          {/* History */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Histórico</h3>
            {loadingHistory ? (
              <p className="text-sm text-gray-400">Carregando...</p>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum registro ainda.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {history.map(entry => (
                  <div key={entry.id} className="flex items-start justify-between text-sm bg-[#f0f0f0] rounded-xl px-3 py-2.5">
                    <div>
                      <p className="font-medium text-gray-800">{entry.person_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Recebeu: {formatDate(entry.assigned_date)}
                        {entry.return_date && ` · Entregou: ${formatDate(entry.return_date)}`}
                      </p>
                    </div>
                    {pendingDeleteId === entry.id ? (
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span className="text-xs text-gray-400">Apagar?</span>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setPendingDeleteId(null)}
                          className="text-gray-400 hover:text-gray-600 leading-none cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setPendingDeleteId(entry.id)}
                        className="shrink-0 ml-2 text-gray-300 hover:text-red-400 transition-colors leading-none mt-0.5 cursor-pointer"
                        title="Remover"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign form */}
          {showAssignForm && (
            <form onSubmit={handleAssign} className="bg-[#f0f0f0] rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Atribuir território</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Nome da pessoa</label>
                  <input
                    value={assignForm.person_name}
                    onChange={e => setAssignForm(f => ({ ...f, person_name: e.target.value }))}
                    className="w-full bg-white rounded-xl px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-accent-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Data de designação</label>
                  <input
                    type="date"
                    value={assignForm.assigned_date}
                    onChange={e => setAssignForm(f => ({ ...f, assigned_date: e.target.value }))}
                    className="w-full bg-white rounded-xl px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-accent-400"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto text-sm px-4 py-2.5 sm:py-2 rounded-xl bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-40 font-semibold transition-colors cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Confirmar'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAssignForm(false); setError(null) }}
                  className="w-full sm:w-auto text-sm px-4 py-2.5 sm:py-2 rounded-xl bg-white text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Deliver form */}
          {showReturnForm && (
            <form onSubmit={handleDeliver} className="bg-red-50 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">
                Entregar — {territory.assigned_to}
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Data de entrega</label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-accent-400"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto text-sm px-4 py-2.5 sm:py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-40 font-semibold transition-colors"
                >
                  {saving ? 'Salvando...' : 'Confirmar entrega'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReturnForm(false); setError(null) }}
                  className="w-full sm:w-auto text-sm px-4 py-2.5 sm:py-2 rounded-xl bg-white text-gray-600 hover:bg-gray-100 font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Footer actions */}
        <div className="px-4 sm:px-6 pb-safe sm:pb-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-2 sm:justify-end shrink-0">
          {isAvailable && !showAssignForm && (
            <button
              onClick={() => { setShowAssignForm(true); setShowReturnForm(false); setError(null) }}
              className="w-full sm:w-auto text-sm px-5 py-3 sm:py-2.5 rounded-xl bg-accent-600 text-white hover:bg-accent-700 transition-colors font-semibold cursor-pointer"
            >
              Atribuir
            </button>
          )}
          {!isAvailable && !showReturnForm && (
            <button
              onClick={() => { setShowReturnForm(true); setShowAssignForm(false); setError(null) }}
              className="w-full sm:w-auto text-sm px-5 py-3 sm:py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors font-semibold"
            >
              Entregar
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
