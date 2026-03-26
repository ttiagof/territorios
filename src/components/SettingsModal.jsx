import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function SettingsModal({ user, onClose, onSignOut }) {
  const currentName = user?.user_metadata?.display_name ?? ''
  const email = user?.email ?? ''

  const [name, setName] = useState(currentName)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [savingName, setSavingName] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [nameMsg, setNameMsg] = useState(null)
  const [passwordMsg, setPasswordMsg] = useState(null)

  async function handleSaveName(e) {
    e.preventDefault()
    setSavingName(true)
    setNameMsg(null)
    const { error } = await supabase.auth.updateUser({ data: { display_name: name.trim() } })
    setNameMsg(error ? { type: 'error', text: error.message } : { type: 'ok', text: 'Nome atualizado.' })
    setSavingName(false)
  }

  async function handleSavePassword(e) {
    e.preventDefault()
    setPasswordMsg(null)
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'As passwords não coincidem.' })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'A password deve ter pelo menos 6 caracteres.' })
      return
    }
    setSavingPassword(true)
    // Re-authenticate then update
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (signInError) {
      setPasswordMsg({ type: 'error', text: 'Password atual incorreta.' })
      setSavingPassword(false)
      return
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message })
    } else {
      setPasswordMsg({ type: 'ok', text: 'Password atualizada com sucesso.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
    setSavingPassword(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-accent-600/10 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-gray-900">Definições</span>
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

        <div className="overflow-y-auto px-6 py-5 space-y-6">
          {/* Account info */}
          <div className="flex items-center gap-3 bg-[#f0f0f0] rounded-2xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-accent-600 flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-white">
                {(currentName || email).charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              {currentName && <p className="text-sm font-semibold text-gray-900 truncate">{currentName}</p>}
              <p className="text-xs text-gray-400 truncate">{email}</p>
            </div>
          </div>

          {/* Change name */}
          <form onSubmit={handleSaveName} className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome de utilizador</p>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="O teu nome"
              className="w-full bg-[#f0f0f0] rounded-xl px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-accent-400"
            />
            {nameMsg && (
              <p className={`text-xs ${nameMsg.type === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>{nameMsg.text}</p>
            )}
            <button
              type="submit"
              disabled={savingName || name.trim() === currentName}
              className="w-full py-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              {savingName ? 'A guardar…' : 'Guardar nome'}
            </button>
          </form>

          <div className="border-t border-gray-100" />

          {/* Change password */}
          <form onSubmit={handleSavePassword} className="space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alterar password</p>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Password atual"
              required
              className="w-full bg-[#f0f0f0] rounded-xl px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-accent-400"
            />
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Nova password"
              required
              className="w-full bg-[#f0f0f0] rounded-xl px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-accent-400"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirmar nova password"
              required
              className="w-full bg-[#f0f0f0] rounded-xl px-3 py-2 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-accent-400"
            />
            {passwordMsg && (
              <p className={`text-xs ${passwordMsg.type === 'ok' ? 'text-emerald-500' : 'text-red-500'}`}>{passwordMsg.text}</p>
            )}
            <button
              type="submit"
              disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="w-full py-2 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-semibold transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default"
            >
              {savingPassword ? 'A atualizar…' : 'Atualizar password'}
            </button>
          </form>

          <div className="border-t border-gray-100" />

          {/* Sign out */}
          <button
            onClick={onSignOut}
            className="w-full py-2 rounded-xl bg-[#f0f0f0] hover:bg-red-50 text-red-500 hover:text-red-600 text-sm font-semibold transition-colors cursor-pointer"
          >
            Terminar sessão
          </button>
        </div>
      </div>
    </div>
  )
}
