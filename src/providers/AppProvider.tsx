import type { ReactNode } from 'react'
import { AuthProvider } from '../lib/auth/AuthProvider'
import { UserProvider } from './UserProvider'
import { logEnvStatus } from '../config/env'

// Called once on app startup
logEnvStatus()

// Root provider tree. Order matters: AuthProvider → UserProvider → children.
// Additional providers (Realtime, AI, Notifications) slot in here as features ship.

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UserProvider>
        {children}
      </UserProvider>
    </AuthProvider>
  )
}
