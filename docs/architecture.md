# Architecture Overview

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Browser (Vite + React)                       │
│                                                                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   UI Layer   │  │  State Layer │  │      Service Layer        │  │
│  │  (sections/  │  │  (Zustand +  │  │  src/lib/                 │  │
│  │   ui/ comps) │  │  localStorage│  │  ├── db/        ← Supabase│  │
│  └──────┬───────┘  │  + hooks)    │  │  ├── ai/        ← OpenAI  │  │
│         │          └──────┬───────┘  │  ├── auth/      ← Sup Auth│  │
│         └─────────────────┘          │  ├── realtime/  ← Sup RT  │  │
│                                      │  └── simulation/ ← EventBus│  │
│                                      └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌──────────────┐   ┌──────────────────┐   ┌──────────────┐
│  Supabase    │   │  Supabase Auth   │   │  OpenAI API  │
│  PostgreSQL  │   │  (JWT sessions)  │   │  (AI copilot)│
│  (all tables)│   │                  │   │              │
└──────────────┘   └──────────────────┘   └──────────────┘
         │
         ▼
┌──────────────┐   ┌──────────────────┐
│  Supabase    │   │  Supabase        │
│  Realtime    │   │  Storage         │
│  (live events│   │  (files, exports)│
│  via WS)     │   │                  │
└──────────────┘   └──────────────────┘
```

## Layers

### 1. UI Layer (`src/components/`)
React components organized as:
- `sections/` — full-page feature views (Dashboard, SQLLab, IncidentSimulator, etc.)
- `ui/` — reusable primitives (cards, modals, toasts, HUDs)
- `layout/` — shell (Sidebar, TopHeader)

**Rule:** No business logic here. Components read from hooks/stores and call service functions.

### 2. State Layer
- **Zustand stores** (`src/store/`) — global mutable state (simulation session, learning state)
- **React hooks** (`src/hooks/`) — localStorage-backed persistence (XP, streaks, achievements)
- **DB-backed hooks** — once auth is active, hooks upsert to Supabase instead of localStorage

### 3. Service Layer (`src/lib/`)

| Module | Purpose |
|---|---|
| `lib/supabase.ts` | Supabase client singleton |
| `lib/auth/` | Auth context, ProtectedRoute, session management |
| `lib/db/` | Typed query helpers per entity (progress, xp, sql, incidents, interviews, ai) |
| `lib/ai/` | AI provider abstraction (mock → OpenAI → edge function) |
| `lib/realtime/` | Supabase realtime subscription manager |
| `lib/simulation/` | Simulation event bus and state machine |
| `lib/storage/` | File upload/download abstraction |

### 4. Database Layer (`supabase/`)
- PostgreSQL via Supabase
- Row Level Security (RLS) on every table
- Migrations in `supabase/migrations/` (ordered SQL files)
- Seed data in `supabase/seed.sql`

## Data Flow — Example: User Completes a SQL Challenge

```
User submits query
       │
       ▼
SQLLab.jsx (UI)
       │ calls
       ▼
useSqlEngine hook (validation + scoring)
       │ on success, calls
       ▼
lib/db/sql.ts → recordSQLAttempt() → supabase.from('sql_attempts').insert()
       │ also calls
       ▼
lib/db/xp.ts  → awardXP()           → supabase.from('xp_ledger').insert()
       │ and
       ▼
lib/db/xp.ts  → updateStreak()      → supabase.from('streaks').upsert()
       │
       ▼
Supabase Realtime fires change event
       │
       ▼
realtimeClient subscription → triggers UI update (XP toast, progress bar)
```

## Feature Flag Strategy

All backend features are gated behind env flags so the app works without a Supabase project:

```
VITE_ENABLE_BACKEND=false  → use localStorage (current behavior, no change)
VITE_ENABLE_BACKEND=true   → use Supabase DB (requires project credentials)
VITE_ENABLE_REALTIME=false → no live updates
VITE_ENABLE_REALTIME=true  → subscribe to Supabase Realtime
VITE_ENABLE_AI=false       → hide AI copilot
VITE_ENABLE_AI=true        → show AI copilot (mock or real provider)
```

This means the existing UX is fully preserved — backend integration is additive, not breaking.
