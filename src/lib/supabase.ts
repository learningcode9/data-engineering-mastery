import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env.local and fill in your project credentials.'
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'dem-auth-token',
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

// Typed shorthand helpers
export const db = supabase.from.bind(supabase)
export const auth = supabase.auth
export const storage = supabase.storage
export const realtime = supabase.channel.bind(supabase)
