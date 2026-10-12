import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getMyProfile } from '../services/profiles'
import type { Profile } from '../types'

interface Ctx { session: Session | null; profile: Profile | null; loading: boolean; error: string | null }
const AuthContext = createContext<Ctx>({ session: null, profile: null, loading: true, error: null })
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); if (!data.session) setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if (!s) { setProfile(null); setLoading(false) } })
    return () => sub.subscription.unsubscribe()
  }, [])

  const uid = session?.user.id
  useEffect(() => {
    if (!uid) return
    setLoading(true)
    getMyProfile(uid).then(setProfile).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }, [uid])

  return <AuthContext.Provider value={{ session, profile, loading, error }}>{children}</AuthContext.Provider>
}
