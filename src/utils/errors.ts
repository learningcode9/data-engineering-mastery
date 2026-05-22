// Typed error classes for consistent error handling across the app

export type ErrorCode =
  | 'AUTH_REQUIRED'
  | 'AUTH_EXPIRED'
  | 'NETWORK_ERROR'
  | 'SUPABASE_ERROR'
  | 'AI_UNAVAILABLE'
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNKNOWN'

export class AppError extends Error {
  readonly code: ErrorCode
  readonly context?: Record<string, unknown>

  constructor(message: string, code: ErrorCode = 'UNKNOWN', context?: Record<string, unknown>) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.context = context
  }
}

export class AuthError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 'AUTH_REQUIRED')
    this.name = 'AuthError'
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network request failed', context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', context)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends AppError {
  readonly field?: string
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', field ? { field } : undefined)
    this.name = 'ValidationError'
    this.field = field
  }
}

// ─── Error utilities ──────────────────────────────────────────────────────────

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError
}

export function toUserMessage(err: unknown): string {
  if (err instanceof AppError) {
    switch (err.code) {
      case 'AUTH_REQUIRED': return 'Please sign in to continue.'
      case 'AUTH_EXPIRED':  return 'Your session has expired. Please sign in again.'
      case 'NETWORK_ERROR': return 'Connection error. Check your internet and try again.'
      case 'AI_UNAVAILABLE': return 'AI assistant is temporarily unavailable.'
      case 'NOT_FOUND':     return 'The requested resource was not found.'
      default:              return err.message || 'Something went wrong. Please try again.'
    }
  }
  if (err instanceof Error) return err.message
  return 'An unexpected error occurred.'
}

// Safely extract error message from any thrown value
export function getErrorMessage(err: unknown): string {
  if (typeof err === 'string') return err
  if (err instanceof Error) return err.message
  return String(err)
}
