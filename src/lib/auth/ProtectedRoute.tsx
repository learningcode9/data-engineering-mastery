import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  requireOnboarded?: boolean
}

export function ProtectedRoute({ children, fallback = null, requireOnboarded = false }: Props) {
  const { user, profile, loading } = useAuth()

  if (loading) return <AuthLoadingScreen />

  if (!user) return <>{fallback}</>

  if (requireOnboarded && !profile?.onboarded) return <OnboardingGate />

  return <>{children}</>
}

function AuthLoadingScreen() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="loading-spinner" />
    </div>
  )
}

function OnboardingGate() {
  // Redirect to onboarding flow — replace with router navigation when added
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Complete your profile to continue</h2>
      <p>Tell us about your experience level and target role.</p>
    </div>
  )
}
