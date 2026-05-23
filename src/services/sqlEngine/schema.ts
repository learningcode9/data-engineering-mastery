// Schema introspection helpers for the SQL playground database.
// Data comes from TABLE_SCHEMAS in sqlDataset.js — single source of truth.

import { TABLE_SCHEMAS } from '../../utils/sqlEngine.js'

export type ColumnMeta = {
  name: string
  type: string
  isPk: boolean
  fkTarget?: string
}

export type TableMeta = {
  name: string
  columns: ColumnMeta[]
  rowCount: number
  note: string
}

/** Return the names of all available tables. */
export function getTables(): string[] {
  return Object.keys(TABLE_SCHEMAS)
}

/** Return column metadata for a table, or null if the table doesn't exist. */
export function getColumns(tableName: string): ColumnMeta[] | null {
  const schema = TABLE_SCHEMAS[tableName]
  if (!schema) return null
  return schema.columns.map((col: string, i: number) => ({
    name:     col,
    type:     schema.types[i],
    isPk:     col === schema.pk,
    fkTarget: schema.fks?.[col] ?? undefined,
  }))
}

/** Return full metadata for every table. */
export function getAllTables(): TableMeta[] {
  return Object.entries(TABLE_SCHEMAS).map(([name, schema]: [string, any]) => ({
    name,
    columns:  getColumns(name) ?? [],
    rowCount: schema.rowCount,
    note:     schema.note,
  }))
}

/** Throws a beginner-friendly error if the table doesn't exist. */
export function validateTableExists(tableName: string): void {
  if (!TABLE_SCHEMAS[tableName]) {
    const available = getTables().join(', ')
    throw new Error(
      `Table '${tableName}' does not exist.\n\nAvailable tables: ${available}`
    )
  }
}

/** Throws a beginner-friendly error if the column doesn't exist on the table. */
export function validateColumnExists(tableName: string, columnName: string): void {
  validateTableExists(tableName)
  const schema = TABLE_SCHEMAS[tableName]
  if (!schema.columns.includes(columnName)) {
    const cols = schema.columns.map((c: string) => `  • ${c}`).join('\n')
    throw new Error(
      `Column '${columnName}' does not exist in table '${tableName}'.\n\n` +
      `Available columns:\n${cols}`
    )
  }
}
