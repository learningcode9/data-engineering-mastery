// Async retry helper with exponential backoff — used by service layer for transient failures

interface RetryOptions {
  attempts?: number        // max retries (default: 3)
  baseDelayMs?: number     // initial delay (default: 300ms)
  maxDelayMs?: number      // cap (default: 5000ms)
  shouldRetry?: (err: unknown, attempt: number) => boolean
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    attempts    = 3,
    baseDelayMs = 300,
    maxDelayMs  = 5000,
    shouldRetry = (err) => isTransient(err),
  } = options

  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt === attempts || !shouldRetry(err, attempt)) break

      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs)
      const jitter = Math.random() * 100
      await sleep(delay + jitter)
    }
  }

  throw lastError
}

function isTransient(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  // Retry on network errors and 5xx responses, not on 4xx
  return msg.includes('network') ||
    msg.includes('fetch') ||
    msg.includes('timeout') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('502')
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

// Debounce — used for autosave operations (e.g. note saving)
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}
