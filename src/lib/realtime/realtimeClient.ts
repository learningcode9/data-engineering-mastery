import { supabase } from '../supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

type TableName = 'topic_progress' | 'xp_ledger' | 'streaks' | 'achievements' |
  'incident_sessions' | 'incident_events' | 'interview_sessions' | 'daily_plans'

type ChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*'

interface SubscriptionOptions {
  table: TableName
  event?: ChangeEvent
  filter?: string         // e.g. "user_id=eq.abc123"
  onChange: (payload: unknown) => void
}

// Active channels keyed by subscription ID
const channels = new Map<string, RealtimeChannel>()

export function subscribe(id: string, options: SubscriptionOptions): () => void {
  const { table, event = '*', filter, onChange } = options

  const channel = supabase
    .channel(id)
    .on(
      // @ts-expect-error - Supabase types are loose on schema here
      'postgres_changes',
      { event, schema: 'public', table, filter },
      (payload: unknown) => onChange(payload)
    )
    .subscribe()

  channels.set(id, channel)

  return () => {
    channel.unsubscribe()
    channels.delete(id)
  }
}

export function subscribeToUserProgress(userId: string, onChange: (payload: unknown) => void) {
  return subscribe(`progress-${userId}`, {
    table: 'topic_progress',
    filter: `user_id=eq.${userId}`,
    onChange,
  })
}

export function subscribeToXP(userId: string, onChange: (payload: unknown) => void) {
  return subscribe(`xp-${userId}`, {
    table: 'xp_ledger',
    filter: `user_id=eq.${userId}`,
    onChange,
  })
}

export function subscribeToIncident(sessionId: string, onChange: (payload: unknown) => void) {
  return subscribe(`incident-${sessionId}`, {
    table: 'incident_events',
    filter: `session_id=eq.${sessionId}`,
    onChange,
  })
}

export function unsubscribeAll() {
  channels.forEach(ch => ch.unsubscribe())
  channels.clear()
}
