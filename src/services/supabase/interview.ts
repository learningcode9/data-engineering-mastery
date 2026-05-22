// Interview service — Phase 1 placeholder
// All functions currently read/write localStorage.
// Supabase queries will replace localStorage calls in a later phase.

import type { InterviewSession } from '../../types/database'

const LS_LEARNED_KEY  = 'dem-interview-learned'
const LS_SESSIONS_KEY = 'dem-interview-sessions'

function lsGet<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

// ─── Question mastery ─────────────────────────────────────────────────────────

// Get learned/revision status for all questions
export async function getLearnedQuestions(
  _userId: string | null
): Promise<Record<string, boolean>> {
  return lsGet<Record<string, boolean>>(LS_LEARNED_KEY, {})
}

// Mark a question as learned or flagged for revision
export async function setQuestionStatus(
  _userId: string | null,
  questionId: string,
  learned: boolean
): Promise<void> {
  const current = lsGet<Record<string, boolean>>(LS_LEARNED_KEY, {})
  current[questionId] = learned
  lsSet(LS_LEARNED_KEY, current)
}

// ─── Session tracking ─────────────────────────────────────────────────────────

// Start a new interview session and return its ID
export async function createSession(
  _userId: string | null,
  mode: 'practice' | 'timed' | 'war_room',
  category: string | null
): Promise<InterviewSession> {
  const session: InterviewSession = {
    id: crypto.randomUUID(),
    mode,
    category,
    totalQuestions: 0,
    correctAnswers: 0,
    score: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
  }

  const sessions = lsGet<InterviewSession[]>(LS_SESSIONS_KEY, [])
  lsSet(LS_SESSIONS_KEY, [session, ...sessions].slice(0, 50))

  return session
}

// Complete a session with final stats
export async function completeSession(
  _userId: string | null,
  sessionId: string,
  totalQuestions: number,
  correctAnswers: number
): Promise<InterviewSession> {
  const sessions = lsGet<InterviewSession[]>(LS_SESSIONS_KEY, [])
  const score = totalQuestions > 0
    ? Math.round((correctAnswers / totalQuestions) * 100)
    : 0

  const updated = sessions.map(s =>
    s.id === sessionId
      ? { ...s, totalQuestions, correctAnswers, score, completedAt: new Date().toISOString() }
      : s
  )
  lsSet(LS_SESSIONS_KEY, updated)

  return updated.find(s => s.id === sessionId) ?? {
    id: sessionId,
    mode: 'practice',
    category: null,
    totalQuestions,
    correctAnswers,
    score,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  }
}

// Get past session history
export async function getSessionHistory(
  _userId: string | null,
  limit = 20
): Promise<InterviewSession[]> {
  return lsGet<InterviewSession[]>(LS_SESSIONS_KEY, []).slice(0, limit)
}

// ─── Aggregated stats ─────────────────────────────────────────────────────────

export async function getInterviewStats(_userId: string | null) {
  const sessions   = lsGet<InterviewSession[]>(LS_SESSIONS_KEY, [])
  const completed  = sessions.filter(s => s.completedAt !== null)
  const learned    = lsGet<Record<string, boolean>>(LS_LEARNED_KEY, {})
  const learnedCount = Object.values(learned).filter(Boolean).length

  const avgScore = completed.length
    ? Math.round(completed.reduce((sum, s) => sum + (s.score ?? 0), 0) / completed.length)
    : 0

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    learnedCount,
    avgScore,
  }
}
