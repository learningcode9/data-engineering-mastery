// Centralized environment configuration with typed access.
// Import this everywhere instead of reading import.meta.env directly.

interface EnvConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  appName: string
  appUrl: string
  aiProvider: 'mock' | 'openai'
  openaiApiKey: string

  // Feature flags — gate backend features so app runs without any config
  enableBackend: boolean
  enableRealtime: boolean
  enableAI: boolean
}

function readBool(key: string, fallback = false): boolean {
  const val = import.meta.env[key]
  if (val === undefined || val === null) return fallback
  return String(val).toLowerCase() === 'true'
}

function readStr(key: string, fallback = ''): string {
  return (import.meta.env[key] as string | undefined) ?? fallback
}

export const env: EnvConfig = {
  supabaseUrl:    readStr('VITE_SUPABASE_URL'),
  supabaseAnonKey:readStr('VITE_SUPABASE_ANON_KEY'),
  appName:        readStr('VITE_APP_NAME', 'Data Engineering Mastery'),
  appUrl:         readStr('VITE_APP_URL', 'http://localhost:5173'),
  aiProvider:     (readStr('VITE_AI_PROVIDER', 'mock') as 'mock' | 'openai'),
  openaiApiKey:   readStr('VITE_OPENAI_API_KEY'),

  enableBackend:  readBool('VITE_ENABLE_BACKEND'),
  enableRealtime: readBool('VITE_ENABLE_REALTIME'),
  enableAI:       readBool('VITE_ENABLE_AI'),
}

// Derived helpers
export const isBackendEnabled = () => env.enableBackend && !!env.supabaseUrl
export const isRealtimeEnabled = () => env.enableRealtime && isBackendEnabled()
export const isAIEnabled = () => env.enableAI

export function logEnvStatus(): void {
  // Intentionally silent for portfolio/deployment builds.
}
