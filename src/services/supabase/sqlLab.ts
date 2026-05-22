// SQL Lab service — records every query attempt, tracks best scores, stores saved queries.
// Falls back to in-memory/localStorage when backend is disabled.

import { requireSupabase } from './client'
import { isBackendEnabled } from '../../config/env'
import type { SQLAttempt, SavedQuery } from '../../types/database.types'

export interface SQLAttemptPayload {
  userId: string | null
  challengeId: string
  query: string
  isCorrect: boolean
  score: number
  executionMs?: number
  errorMessage?: string
  resultRows?: unknown
  executionPlan?: unknown
}

const LS_ATTEMPTS_KEY = 'dem-sql-attempts'
const LS_SAVED_KEY    = 'dem-saved-queries'

function lsGet<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ─── Attempt recording ────────────────────────────────────────────────────────

export async function recordAttempt(payload: SQLAttemptPayload): Promise<void> {
  const entry = {
    challenge_id: payload.challengeId,
    query: payload.query,
    is_correct: payload.isCorrect,
    score: payload.score,
    execution_ms: payload.executionMs ?? null,
    error_message: payload.errorMessage ?? null,
    attempted_at: new Date().toISOString(),
  }

  // Always persist locally for instant feedback
  const local = lsGet<typeof entry[]>(LS_ATTEMPTS_KEY, [])
  lsSet(LS_ATTEMPTS_KEY, [entry, ...local].slice(0, 200))

  if (!isBackendEnabled() || !payload.userId) return

  const { error } = await requireSupabase().from('sql_attempts').insert({
    ...entry,
    user_id: payload.userId,
    result_rows: (payload.resultRows ?? null) as never,
    execution_plan: (payload.executionPlan ?? null) as never,
  })
  if (error) console.warn('[sqlLab:recordAttempt]', error.message)
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function getAttemptHistory(
  userId: string | null,
  challengeId?: string,
  limit = 50
): Promise<SQLAttempt[]> {
  if (!isBackendEnabled() || !userId) {
    const local = lsGet<SQLAttempt[]>(LS_ATTEMPTS_KEY, [])
    return challengeId ? local.filter(a => a.challenge_id === challengeId).slice(0, limit) : local.slice(0, limit)
  }

  let q = requireSupabase()
    .from('sql_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false })
    .limit(limit)

  if (challengeId) q = q.eq('challenge_id', challengeId)

  const { data, error } = await q
  if (error) return []
  return data
}

export async function getBestAttempts(userId: string | null) {
  if (!isBackendEnabled() || !userId) return null
  const { data, error } = await requireSupabase()
    .from('sql_best_attempts')
    .select('*')
    .eq('user_id', userId)
  if (error) return null
  return data
}

// ─── Saved queries ────────────────────────────────────────────────────────────

export async function saveQuery(
  userId: string | null,
  name: string,
  query: string,
  description?: string,
  tags?: string[]
): Promise<void> {
  const entry = { id: crypto.randomUUID(), name, query, description, tags, created_at: new Date().toISOString() }
  const local = lsGet<typeof entry[]>(LS_SAVED_KEY, [])
  lsSet(LS_SAVED_KEY, [entry, ...local])

  if (!isBackendEnabled() || !userId) return

  const { error } = await requireSupabase().from('saved_queries').insert({
    user_id: userId,
    name,
    query,
    description: description ?? null,
    tags: tags ?? [],
  })
  if (error) console.warn('[sqlLab:saveQuery]', error.message)
}

export async function getSavedQueries(userId: string | null): Promise<SavedQuery[]> {
  if (!isBackendEnabled() || !userId) {
    return lsGet<SavedQuery[]>(LS_SAVED_KEY, [])
  }
  const { data, error } = await requireSupabase()
    .from('saved_queries')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) return []
  return data
}

export async function deleteSavedQuery(userId: string | null, queryId: string): Promise<void> {
  const local = lsGet<{ id: string }[]>(LS_SAVED_KEY, [])
  lsSet(LS_SAVED_KEY, local.filter(q => q.id !== queryId))

  if (!isBackendEnabled() || !userId) return
  await requireSupabase().from('saved_queries').delete().eq('id', queryId).eq('user_id', userId)
}

// ─── Aggregated stats ─────────────────────────────────────────────────────────

export async function getSQLStats(userId: string | null) {
  if (!isBackendEnabled() || !userId) {
    const local = lsGet<{ is_correct: boolean; challenge_id: string }[]>(LS_ATTEMPTS_KEY, [])
    const solved = new Set(local.filter(a => a.is_correct).map(a => a.challenge_id))
    return { totalAttempts: local.length, solvedCount: solved.size, accuracy: 0 }
  }

  const { data, error } = await requireSupabase()
    .from('sql_attempts')
    .select('is_correct,challenge_id')
    .eq('user_id', userId)
  if (error || !data) return null

  const solved  = new Set(data.filter(a => a.is_correct).map(a => a.challenge_id))
  const correct = data.filter(a => a.is_correct).length
  const accuracy = data.length ? Math.round((correct / data.length) * 100) : 0

  return { totalAttempts: data.length, solvedCount: solved.size, accuracy }
}
