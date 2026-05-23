// SignupForm — email/password account creation.
// Shows a demo-mode notice and "Continue as Demo Learner" when Supabase is not configured.

import { useState, type FormEvent } from 'react'
import { signUpWithEmail } from '../../services/supabase/auth'
import { isSupabaseConfigured } from '../../services/supabase/client'

interface SignupFormProps {
  onSuccess: (awaitingConfirmation: boolean) => void
  onSwitchToLogin: () => void
  onDemoMode: () => void
}

export function SignupForm({ onSuccess, onSwitchToLogin, onDemoMode }: SignupFormProps) {
  const [fullName, setFullName] = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const configured = isSupabaseConfigured()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!configured) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable sign-up.')
      return
    }

    if (!email.trim() || !password) {
      setError('Please fill in all required fields.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      const { isNewUser } = await signUpWithEmail(email.trim(), password, fullName.trim() || undefined)
      onSuccess(isNewUser)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign up failed'
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
        setError('An account with this email already exists. Try signing in instead.')
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        setError('Network error — check your connection and try again.')
      } else if (msg.toLowerCase().includes('password')) {
        setError('Password is too weak. Use at least 8 characters with a mix of letters and numbers.')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {!configured && (
        <div className="auth-demo-banner" role="status">
          <span aria-hidden="true">⚠</span>
          <span>Running in demo mode — Supabase is not configured.</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="auth-error" role="alert">{error}</div>
        )}

        <div className="auth-field">
          <label htmlFor="signup-name">Full name <span style={{ opacity: 0.45 }}>(optional)</span></label>
          <input
            id="signup-name"
            type="text"
            className="auth-input"
            placeholder="Alex Chen"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            autoComplete="name"
            disabled={loading}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            className="auth-input"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            disabled={loading}
            required
          />
        </div>

        <div className="auth-field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            type="password"
            className="auth-input"
            placeholder="At least 8 characters"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading || !configured}
        >
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <button
        type="button"
        className="auth-demo-continue"
        onClick={onDemoMode}
      >
        Continue as Demo Learner →
      </button>

      <p className="auth-toggle">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin}>
          Sign in
        </button>
      </p>
    </div>
  )
}
