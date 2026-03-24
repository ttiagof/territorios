import { useState } from 'react'
import { supabase } from '../lib/supabase'

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponível' },
  { value: 'assigned', label: 'Designado' },
  { value: 'completed', label: 'Concluído' },
]

export default function AddTerritoryForm({ onClose, onAdded }) {
  const [form, setForm] = useState({
    number: '',
    assigned_to: '',
    assigned_date: '',
    return_date: '',
    status: 'available',
    notes: '',
  })
  const [imageFile, setImageFile] = useState(null)
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
      // Insert territory first to get the ID
      const { data, error: insertError } = await supabase
        .from('territories')
        .insert([{ ...form }])
        .select()
        .single()
      if (insertError) throw insertError

      let card_image_url = null
      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${data.id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('territory-cards')
          .upload(path, imageFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data: urlData } = supabase.storage.from('territory-cards').getPublicUrl(path)
        card_image_url = urlData.publicUrl

        await supabase.from('territories').update({ card_image_url }).eq('id', data.id)
      }

      onAdded({ ...data, card_image_url })
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
            <FormField label="Número *" name="number" value={form.number} onChange={handleField} />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleField} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <FormField label="Designado a" name="assigned_to" value={form.assigned_to} onChange={handleField} />
            <FormField label="Data de designação" name="assigned_date" type="date" value={form.assigned_date} onChange={handleField} />
            <FormField label="Data de devolução" name="return_date" type="date" value={form.return_date} onChange={handleField} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Imagem do cartão</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="text-sm text-gray-600" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
            <textarea name="notes" value={form.notes} onChange={handleField} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {saving ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, name, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  )
}
