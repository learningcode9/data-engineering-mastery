// Result comparison engine — wraps validateAndCompare from the utils layer.
// Provides typed, composable validation for SQL practice tasks.

import { execQuery, validateAndCompare } from '../../utils/sqlEngine.js'
import type { ValidationOutcome } from './sqlEngine'

/**
 * Execute user SQL and compare against expected solution.
 *
 * Row order is ignored unless the solution contains ORDER BY.
 * Columns and values must match exactly (case-insensitive column names,
 * numeric values rounded to 3 decimal places).
 */
export async function validateUserQuery(
  db: any,
  userSql: string,
  solutionSql: string
): Promise<ValidationOutcome> {
  return validateAndCompare(db, userSql, solutionSql)
}

/**
 * Execute SQL and return a raw result without comparison.
 * Useful for ad-hoc queries in the free-play SQL Lab.
 */
export function runQuery(db: any, sql: string) {
  return execQuery(db, sql)
}

/**
 * Validate that a query produces at least N rows and specific column names.
 * Returns null if validation passes; returns an error string otherwise.
 */
export function checkResultShape(
  result: ReturnType<typeof execQuery>,
  opts: { minRows?: number; requiredColumns?: string[] }
): string | null {
  if ('error' in result && result.error) return result.error

  const r = result as { rows: Record<string, unknown>[]; columns: string[]; rowCount: number }

  if (opts.minRows != null && r.rowCount < opts.minRows) {
    return `Expected at least ${opts.minRows} row${opts.minRows !== 1 ? 's' : ''}, got ${r.rowCount}.`
  }

  if (opts.requiredColumns?.length) {
    const lowerCols = r.columns.map(c => c.toLowerCase())
    const missing = opts.requiredColumns.filter(c => !lowerCols.includes(c.toLowerCase()))
    if (missing.length > 0) {
      return `Result is missing required column${missing.length !== 1 ? 's' : ''}: ${missing.join(', ')}.`
    }
  }

  return null
}

// ── Test cases used during development ────────────────────────────────────────

export const VALIDATION_EXAMPLES = [
  {
    label: 'valid SELECT',
    sql: 'SELECT product_name, price FROM products ORDER BY price DESC;',
    description: 'Should succeed and return 12 rows.',
  },
  {
    label: 'invalid column',
    sql: 'SELECT name FROM products;',
    description: "Should fail: 'name' does not exist, suggest 'product_name'.",
  },
  {
    label: 'LIKE ends with Pro',
    sql: "SELECT product_name FROM products WHERE product_name LIKE '%Pro';",
    description: "Should return 1 row: 'Cloud Lab Pro'.",
  },
  {
    label: 'JOIN customers and orders',
    sql: 'SELECT c.customer_name, COUNT(o.order_id) AS order_count FROM customers c LEFT JOIN orders o ON c.customer_id = o.customer_id GROUP BY c.customer_id, c.customer_name ORDER BY order_count DESC;',
    description: 'Should return 15 rows — one per customer.',
  },
  {
    label: 'GROUP BY order status',
    sql: 'SELECT status, COUNT(*) AS cnt, SUM(amount) AS total FROM orders GROUP BY status ORDER BY cnt DESC;',
    description: 'Should return 6 rows — one per distinct status.',
  },
]
