// Service-layer error normalization. Wraps raw Supabase/fetch errors into
// a predictable shape so callers don't need to inspect error internals.

export interface ServiceError {
  code: string
  message: string
  cause?: unknown
}

export function normalizeServiceError(err: unknown): ServiceError {
  if (err instanceof Error) {
    return { code: 'SERVICE_ERROR', message: err.message, cause: err }
  }
  if (typeof err === 'object' && err !== null && 'message' in err) {
    return { code: 'SERVICE_ERROR', message: String((err as { message: unknown }).message), cause: err }
  }
  return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred', cause: err }
}

// Wraps an async service call, returns [result, null] on success or
// [null, ServiceError] on failure — no uncaught rejections reach the caller.
export async function safeServiceCall<T>(
  fn: () => Promise<T>
): Promise<[T, null] | [null, ServiceError]> {
  try {
    const result = await fn()
    return [result, null]
  } catch (err) {
    return [null, normalizeServiceError(err)]
  }
}
