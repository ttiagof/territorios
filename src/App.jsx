import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './components/LoginPage'
import TerritoryGrid from './components/TerritoryGrid'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [territories, setTerritories] = useState([])
  const [loadingData, setLoadingData] = useState(false)
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return
    setLoadingData(true)
    setFetchError(null)
    supabase
      .from('territories')
      .select('*')
      .order('number', { ascending: true })
      .then(({ data, error }) => {
        if (error) setFetchError(error.message)
        else setTerritories(data ?? [])
        setLoadingData(false)
      })
  }, [session])

  if (session === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Carregando...</div>
      </div>
    )
  }

  if (!session) return <LoginPage />

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-2">
          <p className="text-gray-700 font-medium">Erro ao carregar territórios</p>
          <p className="text-sm text-gray-400">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-sm px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-gray-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <TerritoryGrid
      territories={territories}
      setTerritories={setTerritories}
      loading={loadingData}
      onSignOut={() => supabase.auth.signOut()}
      user={session?.user}
    />
  )
}
