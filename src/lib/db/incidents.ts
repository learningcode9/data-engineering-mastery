import { supabase } from '../supabase'
import type { IncidentSession, IncidentEvent, IncidentStatus } from '../../types/database.types'

export async function createIncidentSession(
  userId: string,
  incidentId: string,
  scenarioId: string,
  severity: IncidentSession['Row']['severity']
) {
  const { data, error } = await supabase
    .from('incident_sessions')
    .insert({ user_id: userId, incident_id: incidentId, scenario_id: scenarioId, severity })
    .select().single()
  if (error) throw error
  return data as IncidentSession
}

export async function updateIncidentSession(
  sessionId: string,
  updates: IncidentSession['Update']
) {
  const { data, error } = await supabase
    .from('incident_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select().single()
  if (error) throw error
  return data as IncidentSession
}

export async function resolveIncident(
  sessionId: string,
  rcaText: string,
  score: number,
  slaMet: boolean,
  xpAwarded: number
) {
  const now = new Date().toISOString()
  const { data: session } = await supabase
    .from('incident_sessions')
    .select('started_at')
    .eq('id', sessionId)
    .single()

  const durationSec = session
    ? Math.round((Date.now() - new Date(session.started_at).getTime()) / 1000)
    : null

  return updateIncidentSession(sessionId, {
    status: 'resolved',
    resolved_at: now,
    duration_sec: durationSec,
    score,
    rca_submitted: rcaText,
    sla_met: slaMet,
    xp_awarded: xpAwarded,
  })
}

export async function appendIncidentEvent(event: IncidentEvent['Insert']) {
  const { data, error } = await supabase
    .from('incident_events')
    .insert(event)
    .select().single()
  if (error) throw error
  return data as IncidentEvent
}

export async function getIncidentHistory(userId: string) {
  const { data, error } = await supabase
    .from('incident_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getIncidentEvents(sessionId: string) {
  const { data, error } = await supabase
    .from('incident_events')
    .select('*')
    .eq('session_id', sessionId)
    .order('occurred_at', { ascending: true })
  if (error) throw error
  return data
}
