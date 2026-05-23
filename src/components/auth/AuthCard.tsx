// AuthCard — container card used by AuthPage. Provides branding, title, and
// a close button. All auth forms slot in as children.

import type { ReactNode } from 'react'

interface AuthCardProps {
  title: string
  subtitle: string
  onClose?: () => void
  children: ReactNode
}

export function AuthCard({ title, subtitle, onClose, children }: AuthCardProps) {
  return (
    <div className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      {onClose && (
        <button
          type="button"
          className="auth-close-btn"
          onClick={onClose}
          aria-label="Close and continue in demo mode"
        >
          ×
        </button>
      )}

      <div className="auth-card-header">
        <div className="auth-card-logo" aria-hidden="true">DE</div>
        <h2 className="auth-card-title" id="auth-title">{title}</h2>
        <p className="auth-card-subtitle">{subtitle}</p>
      </div>

      {children}
    </div>
  )
}
