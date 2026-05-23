# Supabase Setup Guide

## Phase 1 status: Foundation complete

The Supabase foundation is scaffolded and the app runs without any Supabase credentials.
All service functions fall back to `localStorage` when no project is configured.

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Choose an organisation (or create one)
4. Fill in:
   - **Project name**: `data-engineering-mastery`
   - **Database password**: choose a strong password and save it
   - **Region**: pick the one closest to your users
5. Click **Create new project** and wait ~2 minutes for provisioning

---

## Step 2 — Get your project credentials

1. In your project dashboard, go to **Settings → API**
2. Copy two values:

| Value | Where to find it |
|---|---|
| **Project URL** | Under "Project URL" — looks like `https://abcdefgh.supabase.co` |
| **Anon key** | Under "Project API keys" → `anon` `public` key |

---

## Step 3 — Create your local env file

In the project root, copy the example file:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your credentials:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

> **Never commit `.env.local` to git.** It's already in `.gitignore`.

---

## Step 4 — Verify the connection

Start the dev server:

```bash
npm run dev
```

Open the browser console. You should see:

```
[DEM] Environment
  Backend: 📦 localStorage   ← still uses localStorage until VITE_ENABLE_BACKEND=true
  Realtime: 🔇 disabled
  AI: 🔇 disabled
```

The Supabase client is now initialised but the app still uses localStorage.
Backend features will be activated progressively in later phases.

---

## Step 5 — Apply database migrations (later phases)

When you're ready to switch to real persistence, install the Supabase CLI:

```bash
brew install supabase/tap/supabase
```

Link to your project:

```bash
supabase link --project-ref your-project-ref
```

Apply all migrations:

```bash
supabase db push
```

Seed with demo data (optional):

```bash
supabase db seed
```

---

## File structure reference

```
src/
├── config/
│   └── env.ts                   ← typed env config + feature flags
├── lib/
│   └── supabase.ts              ← null-safe Supabase client singleton
├── services/
│   └── supabase/
│       ├── client.ts            ← query/upsert wrappers, error logging
│       ├── auth.ts              ← auth service (signIn, signUp, profile)
│       ├── progress.ts          ← topic progress + section completion
│       ├── notes.ts             ← saved topic notes
│       ├── incidents.ts         ← incident simulation sessions
│       ├── sqlLab.ts            ← SQL challenge attempts + saved queries
│       ├── interview.ts         ← interview sessions + question mastery
│       ├── xp.ts                ← XP ledger + streaks + achievements
│       └── ai.ts                ← AI copilot (mock → OpenAI)
└── types/
    ├── database.ts              ← clean app-level types (Profile, SqlAttempt, etc.)
    └── database.types.ts        ← full auto-generated Supabase types

supabase/
├── config.toml                  ← local dev configuration
├── migrations/                  ← ordered SQL migration files
│   ├── 001_users.sql
│   ├── 002_xp_streaks.sql
│   ├── 003_learning_progress.sql
│   ├── 004_sql_challenges.sql
│   ├── 005_incidents.sql
│   ├── 006_interviews.sql
│   ├── 007_ai_conversations.sql
│   └── 008_career_tracks.sql
└── seed.sql                     ← demo data for local dev

docs/
├── supabase-setup.md            ← this file
├── architecture.md              ← system architecture overview
├── database-schema.md           ← full schema reference
├── auth-flow.md                 ← auth state machine
├── DEPLOYMENT.md                ← Vercel + Supabase deployment
├── realtime-plan.md             ← realtime subscription plan
├── AI-copilot-plan.md           ← AI integration plan
└── simulation-engine.md         ← incident simulation engine design
```

---

## Feature flags

All backend features are gated. Flip them one at a time as each phase is implemented:

```bash
# .env.local
VITE_ENABLE_BACKEND=false    # Phase 1: off (localStorage only)
VITE_ENABLE_REALTIME=false   # Phase 8: off
VITE_ENABLE_AI=false         # Phase 7: off
```

Setting `VITE_ENABLE_BACKEND=true` requires valid Supabase credentials and migrations applied.

---

---

## localStorage fallback behaviour (Phase 3)

Every service function works without any Supabase configuration.
When `VITE_ENABLE_BACKEND=false` (or credentials are missing), the service layer:

- Reads and writes to `localStorage` using namespaced keys (`dem-*`)
- Returns typed responses with the same shape as Supabase rows
- Returns a mock guest user from `auth.ts` so the app never shows an auth wall

### Switching to real Supabase

1. Set credentials in `.env.local`
2. Apply migrations: `supabase db push`
3. Set `VITE_ENABLE_BACKEND=true` in `.env.local`
4. Restart dev server

The service layer will automatically route to Supabase.  
Existing localStorage data is not migrated — only new events go to Supabase.

### Service file reference

| File | Purpose | Tables |
|---|---|---|
| `auth.ts` | Sign in / sign up / profile | `profiles` |
| `progress.ts` | Topic progress + section completion | `learning_progress`, `topic_completion` |
| `notes.ts` | Topic notes | `saved_notes` |
| `sqlLab.ts` | SQL challenge attempts | `sql_attempts` |
| `interview.ts` | Interview sessions + question mastery | `interview_sessions` |
| `incidents.ts` | Scenario definitions + attempt records | `incidents`, `incident_attempts` |
| `xp.ts` | XP ledger + achievements | `xp_history`, `achievements` |
| `ai.ts` | AI copilot persistence | `ai_chat_history` |

---

## Phase completion checklist

- [x] Phase 1 — Supabase foundation (client, env, service structure, types)
- [x] Phase 2 — Database schema + single canonical migration
- [x] Phase 3 — Service layer with localStorage fallback (all services updated to Phase 2 schema)
- [ ] Phase 4 — Auth UI + protected routes
- [ ] Phase 5 — Global user state sync (XP, streaks, progress → Supabase)
- [ ] Phase 6 — SQL Lab real persistence
- [ ] Phase 7 — Incident engine persistence
- [ ] Phase 8 — AI copilot live integration
- [ ] Phase 9 — Realtime subscriptions
