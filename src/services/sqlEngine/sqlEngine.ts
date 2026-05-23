// SQL execution service — thin TypeScript wrapper over src/utils/sqlEngine.js.
// All heavy lifting (WASM init, query execution, error translation) lives in the utils layer.
// Import from here for typed access in TypeScript components and hooks.

export {
  getEngine,
  execQuery,
  validateAndCompare,
  TABLE_SCHEMAS,
} from '../../utils/sqlEngine.js'

export type QueryResult =
  | { rows: Record<string, unknown>[]; columns: string[]; rowCount: number; rowsModified?: number; execTime: number; error?: never }
  | { error: string; execTime: number; rows?: never; columns?: never; rowCount?: never }

export type ValidationOutcome = {
  valid: boolean
  message: string
  queryResult: QueryResult
  mismatch?: boolean
  expectedRowCount?: number | null
}

/**
 * Initialize the shared SQL engine eagerly.
 * Safe to call multiple times — singleton is reused.
 */
export async function initEngine(): Promise<void> {
  const { getEngine: _get } = await import('../../utils/sqlEngine.js')
  await _get()
}
