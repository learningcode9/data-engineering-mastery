// Incidents service — fetches scenario definitions and persists attempt records.
// `incidents` table is publicly readable (no auth required).
// `incident_attempts` is user-owned (requires userId).

import { requireSupabase } from './client'
import { isBackendEnabled } from '../../config/env'
import type { Incident, IncidentAttempt, InsertIncidentAttempt } from '../../types/database'

const LS_ATTEMPTS_KEY = 'dem-incident-attempts'

function lsGet<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ─── Incidents (public reference data) ───────────────────────────────────────

export async function getIncidents(): Promise<Incident[]> {
  // incidents are publicly readable — no auth needed
  // falls back to empty array if not configured (sim store has its own hardcoded scenarios)
  if (!isBackendEnabled()) return []

  const { data, error } = await requireSupabase()
    .from('incidents')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: true })

  if (error) {
    console.warn('[incidents:getIncidents]', error.message)
    return []
  }
  return data
}

export async function getIncidentById(incidentId: string): Promise<Incident | null> {
  if (!isBackendEnabled()) return null

  const { data, error } = await requireSupabase()
    .from('incidents')
    .select('*')
    .eq('id', incidentId)
    .maybeSingle()

  if (error) return null
  return data
}

// ─── Incident attempts (user activity) ────────────────────────────────────────

export async function saveIncidentAttempt(
  userId: string | null,
  incidentId: string,
  selectedResolution: string,
  success: boolean,
  xpEarned: number
): Promise<void> {
  const entry = {
    incident_id: incidentId,
    selected_resolution: selectedResolution,
    success,
    xp_earned: xpEarned,
    completed_at: new Date().toISOString(),
  }

  // Always persist locally
  const local = lsGet<typeof entry[]>(LS_ATTEMPTS_KEY, [])
  lsSet(LS_ATTEMPTS_KEY, [entry, ...local].slice(0, 100))

  if (!isBackendEnabled() || !userId) return

  const payload: InsertIncidentAttempt = { user_id: userId, ...entry }
  const { error } = await requireSupabase().from('incident_attempts').insert(payload)
  if (error) console.warn('[incidents:saveAttempt]', error.message)
}

export async function getIncidentAttempts(userId: string | null): Promise<IncidentAttempt[]> {
  if (!isBackendEnabled() || !userId) {
    return lsGet<IncidentAttempt[]>(LS_ATTEMPTS_KEY, [])
  }
  const { data, error } = await requireSupabase()
    .from('incident_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(100)

  if (error) return []
  return data
}

export async function getIncidentStats(userId: string | null) {
  const attempts = await getIncidentAttempts(userId)
  const total     = attempts.length
  const correct   = attempts.filter(a => a.success).length
  const totalXP   = attempts.reduce((sum, a) => sum + a.xp_earned, 0)
  const accuracy  = total ? Math.round((correct / total) * 100) : 0

  return { total, correct, accuracy, totalXP }
}
