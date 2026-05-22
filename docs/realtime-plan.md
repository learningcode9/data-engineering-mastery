# Realtime Architecture Plan

## Overview

Supabase Realtime enables live updates across devices and sessions.
Gated behind `VITE_ENABLE_REALTIME=true`.

## What benefits from realtime

| Feature | Event | Trigger |
|---|---|---|
| XP / level bar | New `xp_ledger` row | After any XP award |
| Streak indicator | `streaks` UPDATE | Daily activity recorded |
| Incident live log | New `incident_events` row | During active simulation |
| Progress sync | `topic_progress` UPDATE | Section marked complete |
| Achievements | New `achievements` row | Badge earned |
| Daily plan | `daily_plans` UPDATE | Task checked |

## Subscription Manager (`src/lib/realtime/realtimeClient.ts`)

```typescript
// Subscribe to XP changes for current user
const unsubscribe = subscribeToXP(userId, (payload) => {
  const newXP = payload.new as XPEntry
  // Trigger XP toast and level check
  toast(`+${newXP.amount} XP`)
})

// Clean up on unmount
return () => unsubscribe()
```

## React hook pattern (future)

```typescript
function useRealtimeXP(userId: string) {
  const [totalXP, setTotalXP] = useState(0)

  useEffect(() => {
    if (!isRealtimeEnabled()) return
    return subscribeToXP(userId, (payload) => {
      setTotalXP(prev => prev + payload.new.amount)
    })
  }, [userId])

  return totalXP
}
```

## Incident live log (during simulation)

When an active incident session exists, subscribe to its events table:

```typescript
subscribeToIncident(sessionId, (payload) => {
  const event = payload.new as IncidentEvent
  simulationBus.emit(SIM_EVENTS.LOG_ENTRY, {
    level: event.event_type === 'escalation' ? 'warn' : 'info',
    message: event.description,
    source: event.actor,
  })
})
```

## Multi-device sync flow

```
Device A marks section complete
    │
    ▼
src/services/supabase/progress.ts → upserts to topic_progress
    │
    ▼
Supabase fires NOTIFY on topic_progress change
    │
    ▼
Device B's realtimeClient receives payload
    │
    ▼
React state updates → UI reflects change instantly
```

## Enabling realtime

```bash
# .env.local
VITE_ENABLE_BACKEND=true
VITE_ENABLE_REALTIME=true
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Supabase automatically enables realtime for tables included in the publication.
Verify in Supabase dashboard → Database → Replication → `supabase_realtime` publication.
