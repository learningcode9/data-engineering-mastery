// AuthPage — fullscreen overlay that houses the login/signup flows.
// Rendered on top of the app when authPageOpen=true in UserContext.
// Closing without authenticating returns the user to demo mode.

import { useState, useEffect } from 'react'
import { AuthCard } from '../components/auth/AuthCard'
import { LoginForm } from '../components/auth/LoginForm'
import { SignupForm } from '../components/auth/SignupForm'
import { useUser } from '../providers/UserProvider'

type AuthMode = 'login' | 'signup'

export function AuthPage() {
  const { closeAuthPage, refreshUser } = useUser()
  const [mode,    setMode]    = useState<AuthMode>('login')
  const [success, setSuccess] = useState<string | null>(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeAuthPage()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeAuthPage])

  // Prevent background scroll
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  async function handleLoginSuccess() {
    await refreshUser()
    closeAuthPage()
  }

  async function handleSignupSuccess(awaitingConfirmation: boolean) {
    if (awaitingConfirmation) {
      setSuccess('Account created! Check your email to confirm your address, then sign in.')
      setMode('login')
    } else {
      await refreshUser()
      closeAuthPage()
    }
  }

  const cardTitle    = mode === 'login' ? 'Welcome back'       : 'Create your account'
  const cardSubtitle = mode === 'login' ? 'Sign in to sync your progress' : 'Join Data Engineering Mastery'

  return (
    <div
      className="auth-overlay"
      role="presentation"
      onClick={e => { if (e.target === e.currentTarget) closeAuthPage() }}
    >
      <AuthCard
        title={cardTitle}
        subtitle={cardSubtitle}
        onClose={closeAuthPage}
      >
        {success && (
          <div className="auth-success" role="status" style={{ marginBottom: '1rem' }}>
            {success}
          </div>
        )}

        {mode === 'login' ? (
          <LoginForm
            onSuccess={handleLoginSuccess}
            onSwitchToSignup={() => { setMode('signup'); setSuccess(null) }}
            onDemoMode={closeAuthPage}
          />
        ) : (
          <SignupForm
            onSuccess={handleSignupSuccess}
            onSwitchToLogin={() => { setMode('login'); setSuccess(null) }}
            onDemoMode={closeAuthPage}
          />
        )}
      </AuthCard>
    </div>
  )
}
