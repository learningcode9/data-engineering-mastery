# State Management

## Three-tier state strategy

| Layer | Tool | Scope | Persistence |
|---|---|---|---|
| Local UI state | `useState` | Single component | Session only |
| Cross-component state | Zustand stores | Feature module | Session + optional DB sync |
| Server state | Supabase client | Global, auth-scoped | Supabase PostgreSQL |

## Current state (localStorage-backed)

All hooks in `src/hooks/` write to `localStorage` via `useLocalStorage`. This works without any backend.

```
useXP()              → localStorage['xp']
useStreak()          → localStorage['streak']
useAchievements()    → localStorage['achievements']
useLearningMemory()  → localStorage['progress']
useSqlProgress()     → localStorage['sql_progress']
```

## Future state (Supabase-backed)

When `VITE_ENABLE_BACKEND=true`, the same hooks can be updated to call `lib/db/` functions instead of localStorage:

```typescript
// Before (localStorage)
function markComplete(topicId, sectionId) {
  setProgress(prev => ({ ...prev, [`${topicId}:${sectionId}`]: true }))
}

// After (Supabase)
async function markComplete(topicId, sectionId) {
  await markSectionComplete(user.id, topicId, sectionId)
  // Optimistic update still applies to local state
  setProgress(prev => ({ ...prev, [`${topicId}:${sectionId}`]: true }))
}
```

The migration is additive — localStorage writes can be kept as optimistic cache while Supabase becomes the source of truth.

## Zustand Stores

### `simulationStore` (`src/store/simulationStore.js`)
Manages active simulation session:
- `session` — current IncidentSession or null
- `timer` — elapsed/remaining seconds
- `score` — live score
- `status` — idle / active / resolved / failed
- `stepsTaken` — array of action objects
- `logs` — simulated log stream

### `learningStore` (`src/store/learningStore.js`)
Manages cross-page learning state:
- `activeTopicId` — currently open topic
- `activeSectionId` — currently open section
- `continueLearningData` — smart continue card state
- `searchQuery` — global search state

## Realtime State Updates

When `VITE_ENABLE_REALTIME=true`, Supabase Realtime pushes DB changes to the browser:

```typescript
// src/lib/realtime/realtimeClient.ts
subscribeToXP(userId, (payload) => {
  // payload.new = the new xp_ledger row
  // Trigger XP toast + level-up check
})

subscribeToIncident(sessionId, (payload) => {
  // payload.new = new incident_event row
  // Append to simulation log stream
})
```

This enables future multi-device sync — progress made on mobile updates the desktop in real-time.
