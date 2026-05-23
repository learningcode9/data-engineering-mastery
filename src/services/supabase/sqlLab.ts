// SQL Lab service — records every query submission, append-only.
// Falls back to localStorage when backend is not configured.

import { requireSupabase } from './client'
import { isBackendEnabled } from '../../config/env'
import type { SqlAttempt, InsertSqlAttempt } from '../../types/database'

const LS_ATTEMPTS_KEY = 'dem-sql-attempts'

function lsGet<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ─── Record a submission ──────────────────────────────────────────────────────

export async function saveSqlAttempt(
  userId: string | null,
  challengeId: string,
  queryText: string,
  isCorrect: boolean,
  executionTimeMs?: number,
  attemptsCount = 1
): Promise<void> {
  const localEntry = {
    id: crypto.randomUUID(),
    user_id: userId ?? 'local',
    challenge_id: challengeId,
    query_text: queryText,
    is_correct: isCorrect,
    execution_time_ms: executionTimeMs ?? null,
    attempts_count: attemptsCount,
    created_at: new Date().toISOString(),
  }

  // Always persist locally for instant feedback history
  const local = lsGet<SqlAttempt[]>(LS_ATTEMPTS_KEY, [])
  lsSet(LS_ATTEMPTS_KEY, [localEntry, ...local].slice(0, 200))

  if (!isBackendEnabled() || !userId) return

  const payload: InsertSqlAttempt = {
    user_id: userId,
    challenge_id: challengeId,
    query_text: queryText,
    is_correct: isCorrect,
    execution_time_ms: executionTimeMs ?? null,
    attempts_count: attemptsCount,
  }
  await requireSupabase().from('sql_attempts').insert(payload)
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function getSqlAttempts(
  userId: string | null,
  limit = 50
): Promise<SqlAttempt[]> {
  if (!isBackendEnabled() || !userId) {
    return lsGet<SqlAttempt[]>(LS_ATTEMPTS_KEY, []).slice(0, limit)
  }
  const { data, error } = await requireSupabase()
    .from('sql_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data
}

export async function getChallengeHistory(
  userId: string | null,
  challengeId: string,
  limit = 20
): Promise<SqlAttempt[]> {
  if (!isBackendEnabled() || !userId) {
    return lsGet<SqlAttempt[]>(LS_ATTEMPTS_KEY, [])
      .filter(a => a.challenge_id === challengeId)
      .slice(0, limit)
  }
  const { data, error } = await requireSupabase()
    .from('sql_attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export async function getSQLStats(userId: string | null) {
  const attempts = await getSqlAttempts(userId, 1000)
  const solved   = new Set(attempts.filter(a => a.is_correct).map(a => a.challenge_id))
  const correct  = attempts.filter(a => a.is_correct).length
  const accuracy = attempts.length ? Math.round((correct / attempts.length) * 100) : 0
  return { totalAttempts: attempts.length, solvedCount: solved.size, accuracy }
}
