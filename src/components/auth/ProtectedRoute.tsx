// ProtectedRoute — reusable wrapper for future auth-gated sections.
// enforced=false (default) renders children immediately; the app is never blocked today.
// Set enforced=true on specific sections when mandatory auth is introduced in a later phase.

import type { ReactNode } from 'react'
import { useUser } from '../../providers/UserProvider'

interface ProtectedRouteProps {
  children: ReactNode
  fallback?: ReactNode
  enforced?: boolean
}

export function ProtectedRoute({
  children,
  fallback = null,
  enforced = false,
}: ProtectedRouteProps) {
  const { isMockUser, isLoading, openAuthPage } = useUser()

  // While resolving auth, show nothing (avoids flash)
  if (isLoading) return null

  // If enforced and user is not authenticated, show fallback or prompt
  if (enforced && isMockUser) {
    if (fallback) return <>{fallback}</>
    return (
      <div className="protected-route-gate">
        <p>Sign in to access this section.</p>
        <button type="button" className="auth-submit-btn" onClick={openAuthPage}>
          Sign In
        </button>
      </div>
    )
  }

  return <>{children}</>
}
