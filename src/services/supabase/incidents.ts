// Incident service — persists simulation sessions to Supabase when backend is enabled.
// Integrates with the existing simulationStore without modifying its core logic.

import { requireSupabase } from './client'
import { isBackendEnabled } from '../../config/env'
import type { IncidentSession, IncidentEvent } from '../../types/database.types'

export interface IncidentResolutionPayload {
  sessionId: string
  rcaText: string
  score: number
  slaMet: boolean
  xpAwarded: number
  durationSec: number
}

// ─── Session lifecycle ────────────────────────────────────────────────────────

export async function createIncidentSession(
  userId: string | null,
  incidentId: string,
  scenarioId: string,
  severity: 'P1' | 'P2' | 'P3' | 'P4'
): Promise<string | null> {
  if (!isBackendEnabled() || !userId) return null

  const sb = requireSupabase()
  const { data, error } = await sb
    .from('incident_sessions')
    .insert({ user_id: userId, incident_id: incidentId, scenario_id: scenarioId, severity })
    .select('id')
    .single()

  if (error) {
    console.warn('[incidents:create]', error.message)
    return null
  }
  return data.id
}

export async function resolveIncidentSession(payload: IncidentResolutionPayload): Promise<void> {
  if (!isBackendEnabled()) return

  const { error } = await requireSupabase()
    .from('incident_sessions')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      duration_sec: payload.durationSec,
      score: payload.score,
      rca_submitted: payload.rcaText,
      sla_met: payload.slaMet,
      xp_awarded: payload.xpAwarded,
    })
    .eq('id', payload.sessionId)

  if (error) console.warn('[incidents:resolve]', error.message)
}

export async function failIncidentSession(sessionId: string, reason: string): Promise<void> {
  if (!isBackendEnabled()) return

  const { error } = await requireSupabase()
    .from('incident_sessions')
    .update({ status: 'failed', rca_submitted: reason })
    .eq('id', sessionId)

  if (error) console.warn('[incidents:fail]', error.message)
}

export async function updateSessionSteps(sessionId: string, steps: unknown[]): Promise<void> {
  if (!isBackendEnabled()) return

  await requireSupabase()
    .from('incident_sessions')
    .update({ steps_taken: steps })
    .eq('id', sessionId)
}

// ─── Event timeline (append-only log) ────────────────────────────────────────

export async function appendEvent(
  sessionId: string,
  eventType: IncidentEvent['Row']['event_type'],
  description: string,
  actor: 'user' | 'system' | 'oncall' = 'user',
  metadata: Record<string, unknown> = {}
): Promise<void> {
  if (!isBackendEnabled()) return

  const { error } = await requireSupabase().from('incident_events').insert({
    session_id: sessionId,
    event_type: eventType,
    actor,
    description,
    metadata,
  })
  if (error) console.warn('[incidents:event]', error.message)
}

// ─── History ──────────────────────────────────────────────────────────────────

export async function getIncidentHistory(userId: string): Promise<IncidentSession[]> {
  if (!isBackendEnabled()) return []

  const { data, error } = await requireSupabase()
    .from('incident_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(50)

  if (error) return []
  return data
}

export async function getIncidentStats(userId: string) {
  if (!isBackendEnabled()) return null

  const { data, error } = await requireSupabase()
    .from('incident_sessions')
    .select('status,severity,score,sla_met,xp_awarded,duration_sec')
    .eq('user_id', userId)
    .eq('status', 'resolved')

  if (error || !data) return null

  const total = data.length
  const avgScore = total ? Math.round(data.reduce((s, r) => s + (r.score ?? 0), 0) / total) : 0
  const slaRate  = total ? Math.round((data.filter(r => r.sla_met).length / total) * 100) : 0
  const p1Count  = data.filter(r => r.severity === 'P1').length

  return { total, avgScore, slaRate, p1Count }
}
