import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AddTerritoryForm({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name: '',
    number: '',
    notes: '',
  })
  const [frontImageFile, setFrontImageFile] = useState(null)
  const [backImageFile, setBackImageFile] = useState(null)
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
        const ext = frontImageFile.name.split('.').pop()
        const path = `${data.id}-front.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('territory-cards')
          .upload(path, frontImageFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('territory-cards').getPublicUrl(path)
        updates.card_front_image_url = urlData.publicUrl
      }

      if (backImageFile) {
        const ext = backImageFile.name.split('.').pop()
        const path = `${data.id}-back.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('territory-cards')
          .upload(path, backImageFile, { upsert: true })
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Novo território</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Nome" name="name" value={form.name} onChange={handleField} placeholder="Ex: Rodeio" />
            <FormField label="Número *" name="number" value={form.number} onChange={handleField} placeholder="Ex: 36" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Imagem da frente</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setFrontImageFile(e.target.files[0] ?? null)}
              className="text-sm text-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Imagem do verso</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => setBackImageFile(e.target.files[0] ?? null)}
              className="text-sm text-gray-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleField}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Salvando...' : 'Adicionar'}
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
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}
