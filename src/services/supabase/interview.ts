// Interview service — persists sessions to Supabase interview_sessions table.
// Rich local session state (mode, totalQuestions, correctAnswers) lives in
// localStorage; only the summary row goes to Supabase.

import { requireSupabase } from './client'
import { isBackendEnabled } from '../../config/env'
import type { InterviewSession, InterviewDifficulty, InsertInterviewSession } from '../../types/database'

const LS_SESSIONS_KEY = 'dem-interview-sessions'
const LS_LEARNED_KEY  = 'dem-interview-learned'

function lsGet<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ─── Session persistence ──────────────────────────────────────────────────────

export async function saveInterviewSession(
  userId: string | null,
  category: string | null,
  difficulty: InterviewDifficulty | null,
  score: number | null
): Promise<void> {
  const localRecord = {
    id: crypto.randomUUID(),
    user_id: userId ?? 'local',
    category,
    difficulty,
    score,
    completed_at: new Date().toISOString(),
  }

  const sessions = lsGet<InterviewSession[]>(LS_SESSIONS_KEY, [])
  lsSet(LS_SESSIONS_KEY, [localRecord, ...sessions].slice(0, 50))

  if (!isBackendEnabled() || !userId) return

  const payload: InsertInterviewSession = { user_id: userId, category, difficulty, score }
  const { error } = await requireSupabase().from('interview_sessions').insert(payload)
  if (error) console.warn('[interview:save]', error.message)
}

export async function getInterviewSessions(
  userId: string | null,
  limit = 20
): Promise<InterviewSession[]> {
  if (!isBackendEnabled() || !userId) {
    return lsGet<InterviewSession[]>(LS_SESSIONS_KEY, []).slice(0, limit)
  }
  const { data, error } = await requireSupabase()
    .from('interview_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data
}

// ─── Question mastery (localStorage-only, richer local state) ────────────────

export async function getLearnedQuestions(
  _userId: string | null
): Promise<Record<string, boolean>> {
  return lsGet<Record<string, boolean>>(LS_LEARNED_KEY, {})
}

export async function setQuestionStatus(
  _userId: string | null,
  questionId: string,
  learned: boolean
): Promise<void> {
  const current = lsGet<Record<string, boolean>>(LS_LEARNED_KEY, {})
  current[questionId] = learned
  lsSet(LS_LEARNED_KEY, current)
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getInterviewStats(userId: string | null) {
  const sessions = await getInterviewSessions(userId, 100)
  const learned  = await getLearnedQuestions(userId)

  const completed    = sessions.filter(s => s.score !== null)
  const learnedCount = Object.values(learned).filter(Boolean).length
  const avgScore     = completed.length
    ? Math.round(completed.reduce((sum, s) => sum + (s.score ?? 0), 0) / completed.length)
    : 0

  return { totalSessions: sessions.length, completedSessions: completed.length, learnedCount, avgScore }
}
