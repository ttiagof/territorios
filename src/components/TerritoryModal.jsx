import { useState } from 'react'
import { supabase } from '../lib/supabase'
import StatusBadge from './StatusBadge'

const STATUS_OPTIONS = [
  { value: 'available', label: 'Disponível' },
  { value: 'assigned', label: 'Designado' },
  { value: 'completed', label: 'Concluído' },
]

export default function TerritoryModal({ territory, onClose, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ ...territory })
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(territory.card_image_url)
  const [error, setError] = useState(null)

  function handleField(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      let card_image_url = form.card_image_url

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `${territory.id}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('territory-cards')
          .upload(path, imageFile, { upsert: true })
        if (uploadError) throw uploadError
        const { data } = supabase.storage.from('territory-cards').getPublicUrl(path)
        card_image_url = data.publicUrl
      }

      const { error: updateError } = await supabase
        .from('territories')
        .update({ ...form, card_image_url })
        .eq('id', territory.id)

      if (updateError) throw updateError
      onSaved({ ...form, card_image_url })
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleDownload() {
    if (!imagePreview) return
    const a = document.createElement('a')
    a.href = imagePreview
    a.download = `territorio-${form.number}.jpg`
    a.target = '_blank'
    a.click()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold text-gray-900">Território #{form.number}</span>
            <StatusBadge status={form.status} />
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Card image */}
          <div className="rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
            {imagePreview
              ? <img src={imagePreview} alt={`Território ${form.number}`} className="w-full object-contain max-h-64" />
              : <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Sem imagem</div>
            }
          </div>

          {editing && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Imagem do cartão</label>
              <input type="file" accept="image/*" onChange={handleImageChange} className="text-sm text-gray-600" />
            </div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número" name="number" value={form.number} editing={editing} onChange={handleField} />
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              {editing
                ? <select name="status" value={form.status} onChange={handleField} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm">
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                : <StatusBadge status={form.status} />
              }
            </div>
            <Field label="Designado a" name="assigned_to" value={form.assigned_to ?? ''} editing={editing} onChange={handleField} />
            <Field label="Data de designação" name="assigned_date" type="date" value={form.assigned_date ?? ''} editing={editing} onChange={handleField} />
            <Field label="Data de devolução" name="return_date" type="date" value={form.return_date ?? ''} editing={editing} onChange={handleField} />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Observações</label>
            {editing
              ? <textarea name="notes" value={form.notes ?? ''} onChange={handleField} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
              : <p className="text-sm text-gray-700 whitespace-pre-wrap">{form.notes || <span className="text-gray-400 italic">Sem observações</span>}</p>
            }
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex justify-between gap-2">
          <button
            onClick={handleDownload}
            disabled={!imagePreview}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-40 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
          >
            ⬇ Baixar cartão
          </button>
          <div className="flex gap-2">
            {editing
              ? <>
                  <button onClick={() => { setEditing(false); setForm({ ...territory }); setImagePreview(territory.card_image_url); setImageFile(null) }} className="text-sm px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50">Cancelar</button>
                  <button onClick={handleSave} disabled={saving} className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">{saving ? 'Salvando...' : 'Salvar'}</button>
                </>
              : <button onClick={() => setEditing(true)} className="text-sm px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700 transition-colors">Editar</button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({ label, name, value, editing, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {editing
        ? <input type={type} name={name} value={value} onChange={onChange} className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        : <p className="text-sm text-gray-800">{value || <span className="text-gray-400 italic">—</span>}</p>
      }
    </div>
  )
}
