import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    let email = identifier.trim()

    // If not an email, look up by display name
    if (!email.includes('@')) {
      const { data, error: rpcError } = await supabase.rpc('get_email_by_display_name', { p_name: email })
      if (rpcError || !data) {
        setError('Utilizador não encontrado.')
        setLoading(false)
        return
      }
      email = data
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) setError('Email/nome ou password incorretos.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#e8eef5] dark:bg-gray-950 p-4">
      <div className="w-full max-w-sm">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent-600 flex items-center justify-center mb-4 shadow-lg shadow-accent-200 dark:shadow-none">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Territórios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Entre com a sua conta para continuar.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-md p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Email ou nome</label>
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full bg-[#f0f0f0] dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-accent-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Senha</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#f0f0f0] dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-3 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-accent-500 transition"
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium px-3 py-2.5 rounded-xl">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors cursor-pointer mt-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </>
              ) : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
