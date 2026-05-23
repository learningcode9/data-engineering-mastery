// Service-layer entry point for all Supabase access.
// Re-exports the typed client with operational helpers used across services.

import { supabase as _supabase } from '../../lib/supabase'
export { supabase, isSupabaseReady, requireSupabase } from '../../lib/supabase'
export type { Database } from '../../types/database.types'

export function isSupabaseConfigured(): boolean {
  return _supabase !== null
}

// Generic typed query wrapper — logs errors in dev, re-throws for callers
export async function query<T>(
  operation: () => Promise<{ data: T | null; error: unknown }>,
  label = 'query'
): Promise<T> {
  const { data, error } = await operation()
  if (error) {
    if (import.meta.env.DEV) console.error(`[Supabase:${label}]`, error)
    throw error
  }
  if (data === null) throw new Error(`[Supabase:${label}] returned null`)
  return data
}

// Same as query() but allows null result
export async function maybeQuery<T>(
  operation: () => Promise<{ data: T | null; error: unknown }>,
  label = 'query'
): Promise<T | null> {
  const { data, error } = await operation()
  if (error) {
    if (import.meta.env.DEV) console.error(`[Supabase:${label}]`, error)
    throw error
  }
  return data
}

// Upsert helper — throws on error, returns typed row
export async function upsert<T>(
  operation: () => Promise<{ data: T | null; error: unknown }>,
  label = 'upsert'
): Promise<T> {
  return query(operation, label)
}
