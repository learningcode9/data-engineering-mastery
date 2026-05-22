import type { ReactNode } from 'react'
import { AuthProvider } from '../lib/auth/AuthProvider'
import { logEnvStatus } from '../config/env'

// Called once on app startup
logEnvStatus()

// Root provider tree. Order: AuthProvider must wrap all children.
// Additional providers (Realtime, AI, Notifications) slot in here as features ship.

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
