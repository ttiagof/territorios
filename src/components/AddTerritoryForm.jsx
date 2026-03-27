import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/imageUtils'
import ImageDropZone from './ImageDropZone'

export default function AddTerritoryForm({ onClose, onAdded }) {
  const [form, setForm] = useState({ name: '', number: '', notes: '' })
  const [frontImageFile, setFrontImageFile] = useState(null)
  const [backImageFile, setBackImageFile] = useState(null)
  const [frontPreview, setFrontPreview] = useState(null)
  const [backPreview, setBackPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function handleField(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.number.trim()) { setError('O número do território é obrigatório.'); return }
    setSaving(true)
    setError(null)

    try {
      const { data, error: insertError } = await supabase
        .from('territories')
        .insert([{ name: form.name, number: form.number, notes: form.notes, status: 'available' }])
        .select()
        .single()
      if (insertError) throw insertError

      let updates = {}

      if (frontImageFile) {
        const compressed = await compressImage(frontImageFile)
        const path = `${data.id}-front.jpg`
        const { error: uploadError } = await supabase.storage
          .from('territory-cards')
          .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('territory-cards').getPublicUrl(path)
        updates.card_front_image_url = urlData.publicUrl
      }

      if (backImageFile) {
        const compressed = await compressImage(backImageFile)
        const path = `${data.id}-back.jpg`
        const { error: uploadError } = await supabase.storage
          .from('territory-cards')
          .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('territory-cards').getPublicUrl(path)
        updates.card_back_image_url = urlData.publicUrl
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('territories').update(updates).eq('id', data.id)
      }

      onAdded({ ...data, ...updates })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-xl w-full sm:max-w-md max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle — mobile only */}
        <div className="sm:hidden flex justify-center pt-3 pb-0 shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Novo território</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f0f0f0] dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nome" name="name" value={form.name} onChange={handleField} placeholder="Ex: Rodeio" />
            <FormField label="Número *" name="number" value={form.number} onChange={handleField} placeholder="Ex: 36" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Imagem da frente</label>
            <ImageDropZone
              preview={frontPreview}
              onFile={file => { setFrontImageFile(file); setFrontPreview(URL.createObjectURL(file)) }}
              onClear={() => { setFrontImageFile(null); setFrontPreview(null) }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Imagem do verso</label>
            <ImageDropZone
              preview={backPreview}
              onFile={file => { setBackImageFile(file); setBackPreview(URL.createObjectURL(file)) }}
              onClear={() => { setBackImageFile(null); setBackPreview(null) }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Observações</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleField}
              rows={3}
              className="w-full bg-[#f0f0f0] dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm border-0 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-1 pb-safe sm:pb-0">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto text-sm px-4 py-3 sm:py-2.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-300 disabled:opacity-40 font-semibold transition-colors cursor-pointer"
            >
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto text-sm px-4 py-3 sm:py-2.5 rounded-xl bg-[#f0f0f0] dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, name, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#f0f0f0] dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-3 py-2.5 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
      />
    </div>
  )
}
