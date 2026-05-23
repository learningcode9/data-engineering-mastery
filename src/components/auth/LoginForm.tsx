// LoginForm — email/password sign-in form.
// Shows a demo-mode notice and "Continue as Demo Learner" when Supabase is not configured.

import { useState, type FormEvent } from 'react'
import { signInWithEmail } from '../../services/supabase/auth'
import { isSupabaseConfigured } from '../../services/supabase/client'

interface LoginFormProps {
  onSuccess: () => void
  onSwitchToSignup: () => void
  onDemoMode: () => void
}

export function LoginForm({ onSuccess, onSwitchToSignup, onDemoMode }: LoginFormProps) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const configured = isSupabaseConfigured()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!configured) {
      setError('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable sign-in.')
      return
    }

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    setLoading(true)
    try {
      await signInWithEmail(email.trim(), password)
      onSuccess()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sign in failed'
      if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
        setError('Incorrect email or password. Please try again.')
      } else if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        setError('Network error — check your connection and try again.')
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
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
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
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className="auth-input"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            disabled={loading}
            required
          />
        </div>

        <button
          type="submit"
          className="auth-submit-btn"
          disabled={loading || !configured}
        >
          {loading ? 'Signing in…' : 'Sign In'}
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
        No account?{' '}
        <button type="button" onClick={onSwitchToSignup}>
          Create one
        </button>
      </p>
    </div>
  )
}
