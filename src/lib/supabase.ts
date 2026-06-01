import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function isValidSupabaseUrl(value?: string): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (!trimmed) return false
  if (/^your_supabase_url$/i.test(trimmed)) return false
  if (/^your_supabase_anon_key$/i.test(trimmed)) return false
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

// Supabase client is nullable — the app runs in localStorage-only mode when
// credentials are absent. Feature-flagged code checks isSupabaseReady() first.
export const supabase: SupabaseClient<Database> | null =
  isValidSupabaseUrl(url) && key && !/^your_supabase_anon_key$/i.test(key.trim())
    ? createClient<Database>(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'dem-auth-token',
        },
        realtime: { params: { eventsPerSecond: 10 } },
      })
    : null

export function isSupabaseReady(): supabase is SupabaseClient<Database> {
  return supabase !== null
}

// Throws a helpful error when backend code is called without credentials
export function requireSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      'Supabase client is not initialized. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
    )
  }
  return supabase
}
