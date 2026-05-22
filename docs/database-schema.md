# Database Schema

**Migration file:** `supabase/migrations/001_initial_schema.sql`

---

## Table Overview

| Table | Rows grow when… | User-owned? |
|---|---|---|
| `profiles` | User signs up | Yes — 1 row per user |
| `learning_progress` | User opens or completes a topic | Yes |
| `topic_completion` | User completes a section | Yes |
| `saved_notes` | User saves a note | Yes |
| `xp_history` | Any XP-earning action occurs | Yes — append-only |
| `achievements` | Badge is unlocked | Yes — append-only |
| `incidents` | Admin seeds scenarios | **No** — publicly readable |
| `incident_attempts` | User resolves a simulation | Yes |
| `sql_attempts` | User submits a SQL query | Yes — append-only |
| `interview_sessions` | User completes an interview | Yes |
| `ai_chat_history` | User sends an AI message | Yes |
| `projects_progress` | User tracks a portfolio project | Yes |

---

## Relationships

```
auth.users (Supabase Auth)
    └── profiles (1:1 — auto-created via trigger)
            ├── learning_progress   (1:many per topic+module)
            ├── topic_completion    (1:many per topic+section)
            ├── saved_notes         (1:many per topic+section)
            ├── xp_history          (1:many — append-only ledger)
            ├── achievements        (1:many — append-only)
            ├── incident_attempts   (1:many → incidents)
            ├── sql_attempts        (1:many — append-only)
            ├── interview_sessions  (1:many)
            ├── ai_chat_history     (1:many)
            └── projects_progress   (1:many per project)

incidents (reference data — no user FK)
    └── incident_attempts (many users can attempt same incident)
```

---

## Table Definitions

### `profiles`
One row per authenticated user. Created automatically by the `handle_new_user` trigger whenever a new `auth.users` row is inserted.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK — FK to `auth.users(id)` |
| `email` | text | |
| `full_name` | text | nullable |
| `avatar_url` | text | nullable |
| `role` | text | `learner` / `pro` / `admin` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | auto-updated by trigger |

---

### `learning_progress`
Tracks overall completion percentage and status for each topic module a user has visited.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `topic_id` | text | e.g. `"sql"`, `"pyspark"` |
| `module_id` | text | sub-module within topic |
| `progress_percent` | integer | 0–100 |
| `status` | text | `not_started` / `in_progress` / `completed` |
| `last_opened_section` | text | nullable — for "Continue Learning" |
| `updated_at` | timestamptz | auto-updated by trigger |

**Unique constraint:** `(user_id, topic_id, module_id)`

---

### `topic_completion`
Append-only log of individual section completions. One row per section finished.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `topic_id` | text | |
| `section_id` | text | e.g. `"joins"`, `"window-functions"` |
| `completed_at` | timestamptz | |

**Unique constraint:** `(user_id, topic_id, section_id)` — prevents duplicate completions.

---

### `saved_notes`
One note per user per section. Upserted on every autosave.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `topic_id` | text | |
| `section_id` | text | |
| `content` | text | |
| `updated_at` | timestamptz | auto-updated by trigger |

**Unique constraint:** `(user_id, topic_id, section_id)`

---

### `xp_history`
Append-only XP ledger. Total XP is always `SUM(xp_amount)` — never stored as a running total. Exposed via `user_xp_summary` view.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `action` | text | human-readable label, e.g. `"Completed SQL Joins"` |
| `xp_amount` | integer | must be > 0 |
| `source_type` | text | enum — see `XPSourceType` in `src/types/database.ts` |
| `source_id` | text | nullable — reference to the triggering entity |
| `created_at` | timestamptz | |

**View:** `user_xp_summary` — returns `total_xp`, `level` (total/500 + 1), and `xp_in_level`.

---

### `achievements`
One row per badge earned. Duplicate `achievement_key` per user silently ignored via unique constraint.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `achievement_key` | text | e.g. `"sql_master"`, `"streak_7"` |
| `title` | text | display name |
| `unlocked_at` | timestamptz | |

---

### `incidents`
Reference data for simulation scenarios. **Publicly readable** (no auth required). Written by seed data; not modified by users.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `title` | text | incident name |
| `severity` | text | `P1` / `P2` / `P3` / `P4` |
| `status` | text | `active` / `resolved` / `closed` |
| `affected_system` | text | e.g. `"Azure Databricks"` |
| `business_impact` | text | description of consequences |
| `created_at` | timestamptz | |

**Seeded incidents:**
1. Spark OOM — wide join on patient cohort (P1)
2. Kafka consumer lag — fraud scoring pipeline (P2)
3. Schema drift — ADF orders pipeline failure (P2)
4. ADF copy activity failure — raw to Bronze (P3)
5. Delta small file problem — orders_silver table (P2)

---

### `incident_attempts`
Records each time a user selects a resolution for an incident simulation.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `incident_id` | uuid | FK → incidents |
| `selected_resolution` | text | which fix option was chosen |
| `success` | boolean | whether the resolution was correct |
| `xp_earned` | integer | 0 if incorrect |
| `completed_at` | timestamptz | |

---

### `sql_attempts`
Records every SQL challenge submission (append-only — history is preserved).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `challenge_id` | text | e.g. `"sql-window-rank"` |
| `query_text` | text | the submitted SQL |
| `is_correct` | boolean | |
| `execution_time_ms` | integer | nullable |
| `attempts_count` | integer | running attempt number for this challenge |
| `created_at` | timestamptz | |

---

### `interview_sessions`
One row per completed interview run.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `category` | text | nullable — e.g. `"sql"`, `"system_design"` |
| `difficulty` | text | `junior` / `mid` / `senior` / `staff` |
| `score` | integer | 0–100, nullable |
| `completed_at` | timestamptz | |

---

### `ai_chat_history`
Stores AI copilot Q&A pairs.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `message` | text | user's prompt |
| `response` | text | AI's response |
| `context_type` | text | enum — see `AIContextType` in `src/types/database.ts` |
| `created_at` | timestamptz | |

---

### `projects_progress`
Tracks portfolio project completion per user.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → profiles |
| `project_id` | text | e.g. `"end-to-end-pipeline"` |
| `progress_percent` | integer | 0–100 |
| `status` | text | `not_started` / `in_progress` / `completed` |
| `updated_at` | timestamptz | auto-updated by trigger |

**Unique constraint:** `(user_id, project_id)`

---

## Indexes

| Index | Table | Columns | Purpose |
|---|---|---|---|
| `idx_learning_progress_user` | learning_progress | user_id | All progress for a user |
| `idx_learning_progress_topic` | learning_progress | user_id, topic_id | Topic-specific progress |
| `idx_learning_progress_status` | learning_progress | status | Filter by completion state |
| `idx_topic_completion_user` | topic_completion | user_id | |
| `idx_topic_completion_topic` | topic_completion | user_id, topic_id | |
| `idx_saved_notes_user` | saved_notes | user_id | |
| `idx_saved_notes_topic` | saved_notes | user_id, topic_id | |
| `idx_xp_history_user` | xp_history | user_id | |
| `idx_xp_history_created` | xp_history | user_id, created_at desc | XP timeline |
| `idx_achievements_user` | achievements | user_id | |
| `idx_incidents_status` | incidents | status | Active incident filter |
| `idx_incidents_severity` | incidents | severity | |
| `idx_incidents_created` | incidents | created_at desc | |
| `idx_incident_attempts_user` | incident_attempts | user_id | |
| `idx_incident_attempts_incident` | incident_attempts | incident_id | |
| `idx_sql_attempts_user` | sql_attempts | user_id | |
| `idx_sql_attempts_challenge` | sql_attempts | challenge_id | Per-challenge history |
| `idx_sql_attempts_created` | sql_attempts | user_id, created_at desc | |
| `idx_interview_sessions_user` | interview_sessions | user_id | |
| `idx_ai_chat_user` | ai_chat_history | user_id | |
| `idx_ai_chat_context` | ai_chat_history | user_id, context_type | |
| `idx_projects_progress_user` | projects_progress | user_id | |

---

## Row Level Security (RLS)

RLS is enabled on every table. All policies use `auth.uid()` to match `user_id`.

| Table | Read | Write |
|---|---|---|
| profiles | Own row only | Own row only |
| learning_progress | Own rows only | Own rows only |
| topic_completion | Own rows only | Own rows only |
| saved_notes | Own rows only | Own rows only |
| xp_history | Own rows only | Insert own only |
| achievements | Own rows only | Insert own only |
| **incidents** | **Anyone** (public) | Admin only (via seed) |
| incident_attempts | Own rows only | Own rows only |
| sql_attempts | Own rows only | Insert own only |
| interview_sessions | Own rows only | Own rows only |
| ai_chat_history | Own rows only | Own rows only |
| projects_progress | Own rows only | Own rows only |

---

## Running the migration

### On Supabase Cloud

```bash
# Link CLI to your project (one-time)
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Local development

```bash
# Start local Supabase stack
supabase start

# Apply migrations + seed data
supabase db reset
```

### Verify

```bash
# Open local Supabase Studio
open http://localhost:54323

# Or check via CLI
supabase db diff
```

### Regenerate TypeScript types after schema changes

```bash
supabase gen types typescript --local > src/types/database.types.ts
```

---

## Design decisions

**Append-only tables** — `xp_history`, `topic_completion`, `sql_attempts`, and `achievements` never update existing rows. This gives a full audit trail and makes XP calculation accurate (`SUM`, not a running total that could drift).

**`updated_at` triggers** — A single `set_updated_at()` function is reused across all tables that need it, rather than duplicating trigger logic.

**`incidents` as reference data** — Incident scenarios are seeded once and publicly readable. Users never write to this table; they write to `incident_attempts` instead. This separates scenario definition from user activity.

**`unique` constraints over application-level deduplication** — `topic_completion`, `saved_notes`, `learning_progress`, and `projects_progress` all use database-level unique constraints so upserts are safe even under concurrent requests.
