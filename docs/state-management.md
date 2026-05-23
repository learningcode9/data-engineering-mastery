# State Management

## Three-tier strategy

| Layer | Tool | Scope | Persistence |
|---|---|---|---|
| Local UI state | `useState` | Single component | Session only |
| Cross-component state | Zustand stores | Feature module | localStorage (persisted) |
| Server state | Supabase service layer | Global, auth-scoped | Supabase PostgreSQL |

All tiers work independently. Supabase is additive — disabling the backend never breaks the UI.

---

## Provider tree

```
<AppProvider>             ← logEnvStatus() on startup
  <AuthProvider>          ← Supabase Auth session (no-op when backend off)
    <UserProvider>        ← resolves currentUser, userId, isMockUser
      <App />
```

### `UserProvider` (`src/providers/UserProvider.tsx`)

- Calls `auth.getCurrentUser()` once on mount
- Returns a mock guest user when `VITE_ENABLE_BACKEND=false` — never null
- Provides: `currentUser`, `userId`, `isLoading`, `isMockUser`
- Consumed via `useUser()` hook

```tsx
const { userId, isMockUser } = useUser()
```

---

## Zustand stores

### `learningStore` (`src/store/learningStore.js`)

Persisted to `localStorage` via `zustand/persist`. Key namespace: `dem-learning-store-v1`.

| State | Purpose |
|---|---|
| `xp` | Total XP earned |
| `streakCount` / `streakLastDate` | Daily streak tracking |
| `completedTopics` | `{ [topicId]: true }` map |
| `completedProjects` | `{ [projectId]: timestamp }` |
| `dailyTasks` | Daily plan checklist state |
| `achievements` | `{ [achievementKey]: timestamp }` map |
| `achievementQueue` | Ordered queue for toast display |
| `lastXpEvent` | Latest XP event (watched by useSyncXP) |

Supabase sync actions added in Phase 4:
- `hydrateFromSupabase({ xp, streakCount, completedTopics, achievements })` — merges server state on first load
- `setSupabaseUserId(userId)` — stores auth user ID (not persisted to localStorage)

### `simulationStore` (`src/store/simulationStore.js`)

Manages incident simulation sessions. Not persisted — resets on page reload.

---

## Service hooks

These hooks wrap the `src/services/supabase/` service layer.
All functions fall back to localStorage when `VITE_ENABLE_BACKEND=false`.

### `useLearningProgress` (`src/hooks/useLearningProgress.ts`)

```ts
const { progress, completions, overallProgress, isLoading, markSectionComplete, updateProgress } = useLearningProgress()
```

| Return | Type | Description |
|---|---|---|
| `progress` | `LearningProgress[]` | All progress records for current user |
| `completions` | `TopicCompletion[]` | All section completions |
| `overallProgress` | `{ completedTopics, inProgressTopics, totalSections, allProgress }` | Aggregated stats |
| `isLoading` | `boolean` | True during initial load |
| `markSectionComplete(topicId, sectionId)` | `async () => void` | Inserts a completion record |
| `updateProgress(topicId, moduleId, percent, status, lastSection?)` | `async () => void` | Upserts progress row |

### `useNotes` (`src/hooks/useNotes.ts`)

```ts
const { notes, saveNote, deleteNote, isSaving, lastSavedAt } = useNotes()
```

| Return | Type | Description |
|---|---|---|
| `notes` | `SavedNote[]` | All notes for current user |
| `saveNote(topicId, sectionId, content)` | `() => void` | Debounced (800 ms) write to service |
| `deleteNote(topicId, sectionId)` | `async () => void` | Removes note |
| `isSaving` | `boolean` | True while debounced write is in flight |
| `lastSavedAt` | `Date \| null` | Timestamp of last successful save |

### `useSqlAttempts` (`src/hooks/useSqlAttempts.ts`)

```ts
const { attempts, saveAttempt, getChallengeHistory, stats } = useSqlAttempts()
```

| Return | Type | Description |
|---|---|---|
| `attempts` | `SqlAttempt[]` | Recent attempts |
| `saveAttempt({ challengeId, queryText, isCorrect, executionTimeMs? })` | `async () => void` | Records a submission |
| `getChallengeHistory(challengeId)` | `async () => SqlAttempt[]` | Per-challenge history |
| `stats` | `{ totalAttempts, solvedCount, accuracy }` | Aggregated stats |

---

## Background sync hooks

These run silently in `App.jsx`. No UI changes required.

### `useSyncXP` (`src/hooks/useSyncXP.js`)

Watches `learningStore.lastXpEvent`. Whenever a new XP event is recorded locally,
mirrors it to `xp_history` in Supabase. No-op when `VITE_ENABLE_BACKEND=false`.

### `useHydrateFromSupabase(userId, setCompletedTopics)` (`src/hooks/useSyncProgress.js`)

Runs once when `userId` is resolved. Fetches `topic_completion` rows from Supabase
and merges any topic-level completions into the local Zustand store.

### `syncPracticeTask(userId, taskId)` (`src/hooks/useSyncProgress.js`)

Fire-and-forget async function called inside `togglePractice`. Writes a completion
row to `topic_completion` (topic_id = `'practice'`, section_id = taskId).

---

## localStorage key registry

| Key | Written by | Read by |
|---|---|---|
| `dem-learning-store-v1` | Zustand persist | Zustand persist |
| `dem-topic-notes` | `useLocalStorage` in App.jsx | Topics/TopicDetails |
| `dem-practice-progress` | `useLocalStorage` in App.jsx | Topics/TopicDetails |
| `dem-interview-learned` | `useLocalStorage` in App.jsx | InterviewPrep |
| `dem-activity-log` | `useLocalStorage` in App.jsx | Analytics |
| `dem-learning-progress` | progress service | progress service |
| `dem-topic-completions` | progress service | progress service |
| `dem-saved-notes` | notes service | notes service |
| `dem-sql-attempts` | sqlLab service | sqlLab service |
| `dem-interview-sessions` | interview service | interview service |
| `dem-incident-attempts` | incidents service | incidents service |
| `dem-xp-history` | xp service | xp service |
| `dem-achievements` | xp service | xp service |

---

## Supabase / localStorage fallback

When `VITE_ENABLE_BACKEND=false` (default for local dev without credentials):

- `useUser()` returns `{ userId: 'local-guest', isMockUser: true }`
- All service functions write to `localStorage` using `dem-*` keys
- All service functions return from `localStorage` on read
- `useSyncXP` and `useHydrateFromSupabase` are no-ops
- The app is fully functional — no Supabase required

When `VITE_ENABLE_BACKEND=true` (credentials in `.env.local`):

- `useUser()` returns the authenticated Supabase user
- Service functions write to both `localStorage` (optimistic) and Supabase (durable)
- Supabase is the source of truth; localStorage is the fast cache
- On first load, `useHydrateFromSupabase` merges Supabase state into local store

---

## Migration plan

| Phase | What changes |
|---|---|
| Phase 4 (done) | UserProvider + service hooks wired; write paths bridged |
| Phase 5 | Auth UI: login/signup screens; protected routes |
| Phase 6 | SQL Lab wired to `useSqlAttempts` |
| Phase 7 | Incident engine wired to incidents service |
| Phase 8 | AI copilot wired to ai service |
| Phase 9 | Realtime subscriptions for live XP/progress updates |
