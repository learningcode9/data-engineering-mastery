import type { ReactNode } from 'react'
import { AuthProvider } from '../lib/auth/AuthProvider'

// Root provider tree — add more providers here as the app grows
// Order matters: AuthProvider must wrap anything that needs auth context

interface Props {
  children: ReactNode
}

export function AppProvider({ children }: Props) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  )
}
