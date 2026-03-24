import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import LoginPage from './components/LoginPage'
import TerritoryGrid from './components/TerritoryGrid'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = loading
  const [territories, setTerritories] = useState([])
  const [loadingData, setLoadingData] = useState(false)

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
    supabase
      .from('territories')
      .select('*')
      .order('number', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setTerritories(data ?? [])
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

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 text-sm">Carregando territórios...</div>
      </div>
    )
  }

  return (
    <TerritoryGrid
      territories={territories}
      setTerritories={setTerritories}
      onSignOut={() => supabase.auth.signOut()}
    />
  )
}
