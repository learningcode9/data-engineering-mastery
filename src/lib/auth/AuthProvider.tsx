import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isBackendEnabled } from '../../config/env'
import { supabase } from '../supabase'
import type { Profile } from '../../types/database.types'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName?: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
}

const AuthContext = createContext<AuthState>({
  session: null,
  user: null,
  profile: null,
  loading: false,
  isAuthenticated: false,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateProfile: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,  setSession]  = useState<Session | null>(null)
  const [user,     setUser]     = useState<User | null>(null)
  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [loading,  setLoading]  = useState(isBackendEnabled())

  useEffect(() => {
    // No-op when backend is disabled — app runs in localStorage-only mode
    if (!isBackendEnabled() || !supabase) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else { setProfile(null) }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId: string) {
    if (!supabase) return
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    setProfile(data)
  }

  async function signIn(email: string, password: string) {
    if (!supabase) throw new Error('Backend not configured')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  async function signUp(email: string, password: string, fullName?: string) {
    if (!supabase) throw new Error('Backend not configured')
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName } },
    })
    if (error) throw new Error(error.message)
  }

  async function signInWithGoogle() {
    if (!supabase) throw new Error('Backend not configured')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}` },
    })
    if (error) throw new Error(error.message)
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfile(null)
  }

  async function updateProfile(updates: Partial<Profile>) {
    if (!supabase || !user) throw new Error('Not authenticated')
    const { data, error } = await supabase
      .from('profiles').update(updates).eq('id', user.id).select().single()
    if (error) throw new Error(error.message)
    setProfile(data)
  }

  return (
    <AuthContext.Provider value={{
      session, user, profile, loading,
      isAuthenticated: !!user,
      signIn, signUp, signInWithGoogle, signOut, updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
