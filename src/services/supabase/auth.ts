// Auth service — wraps Supabase Auth with clean, typed methods.
// Returns a mock guest user when the backend is not configured so the
// app never crashes without Supabase credentials.

import { requireSupabase } from './client'
import { isBackendEnabled } from '../../config/env'
import type { Profile } from '../../types/database'

export interface AuthUser {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
}

export interface SignInResult {
  user: AuthUser
  isNewUser: boolean
}

const MOCK_GUEST: AuthUser = {
  id: 'local-guest',
  email: 'guest@localhost',
  fullName: 'Guest User',
  avatarUrl: null,
}

// ─── Session ──────────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isBackendEnabled()) return MOCK_GUEST
  const sb = requireSupabase()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return MOCK_GUEST
  return {
    id: user.id,
    email: user.email!,
    fullName: user.user_metadata?.full_name ?? null,
    avatarUrl: user.user_metadata?.avatar_url ?? null,
  }
}

export async function getSession() {
  if (!isBackendEnabled()) return null
  const { data: { session } } = await requireSupabase().auth.getSession()
  return session
}

// ─── Sign in / Sign up ───────────────────────────────────────────────────────

export async function signInWithEmail(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await requireSupabase().auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  const u = data.user
  return { id: u.id, email: u.email!, fullName: u.user_metadata?.full_name ?? null, avatarUrl: null }
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
): Promise<SignInResult> {
  const { data, error } = await requireSupabase().auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw new Error(error.message)
  const u = data.user!
  return {
    user: { id: u.id, email: u.email!, fullName: fullName ?? null, avatarUrl: null },
    isNewUser: data.session === null,
  }
}

export async function signInWithGoogle(): Promise<void> {
  const { error } = await requireSupabase().auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}${window.location.pathname}${window.location.search}` },
  })
  if (error) throw new Error(error.message)
}

export async function signOut(): Promise<void> {
  if (!isBackendEnabled()) return
  const { error } = await requireSupabase().auth.signOut()
  if (error) throw new Error(error.message)
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<Profile | null> {
  if (!isBackendEnabled()) return null
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>
): Promise<Profile> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// ─── Auth state listener ──────────────────────────────────────────────────────

export function onAuthStateChange(callback: (userId: string | null) => void) {
  if (!isBackendEnabled()) return () => {}
  const { data: { subscription } } = requireSupabase().auth.onAuthStateChange((_event, session) => {
    callback(session?.user?.id ?? null)
  })
  return () => subscription.unsubscribe()
}
