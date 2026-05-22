# Database Schema

All tables live in the Supabase `public` schema with Row Level Security enabled.
Users can only access their own rows.

## Entity Relationship Overview

```
auth.users (Supabase Auth)
    └── profiles (1:1)
            ├── xp_ledger          (1:many)
            ├── streaks             (1:1)
            ├── achievements        (1:many)
            ├── topic_progress      (1:many per topic+section)
            ├── notes               (1:many per topic+section)
            ├── practice_completions(1:many)
            ├── sql_attempts        (1:many)
            ├── saved_queries       (1:many)
            ├── incident_sessions   (1:many)
            │       └── incident_events (1:many per session)
            ├── interview_sessions  (1:many)
            │       └── interview_answers (1:many per session)
            ├── question_mastery    (1:many per question)
            ├── ai_threads          (1:many)
            │       └── ai_messages (1:many per thread)
            ├── career_enrollments  (1:many)
            ├── daily_plans         (1:many per date)
            └── user_files          (1:many)
```

## Table Reference

### `profiles`
Extends `auth.users`. Created automatically on signup via trigger.

| Column | Type | Notes |
|---|---|---|
| id | uuid | PK, FK to auth.users |
| email | text | unique |
| full_name | text | nullable |
| role | text | learner / pro / admin |
| onboarded | boolean | gates onboarding flow |
| target_role | text | e.g. "Senior Data Engineer" |
| experience_level | text | junior / mid / senior / staff |

### `xp_ledger`
Append-only ledger. Never updated — only inserted.

| Column | Type | Notes |
|---|---|---|
| amount | integer | XP points awarded |
| source | text | topic_complete / sql_challenge / incident_resolve / interview / streak_bonus |
| source_id | text | optional reference to source entity |

**View:** `user_xp_totals` — aggregates total_xp, level, xp_in_current_level

### `streaks`
One row per user. Updated daily.

| Column | Type | Notes |
|---|---|---|
| current_streak | integer | resets to 0 if gap > 1 day |
| longest_streak | integer | all-time high |
| last_activity_date | date | used to compute consecutive days |

### `topic_progress`
One row per (user, topic, section). Upserted on section completion.

| Column | Type | Notes |
|---|---|---|
| topic_id | text | e.g. 'sql', 'pyspark' |
| section_id | text | section within topic |
| completed | boolean | |
| time_spent_sec | integer | cumulative seconds |

**View:** `topic_completion_summary` — pct_complete per topic

### `sql_attempts`
Append-only. Every query submission is recorded.

| Column | Type | Notes |
|---|---|---|
| challenge_id | text | which challenge |
| query | text | submitted SQL |
| is_correct | boolean | |
| score | integer | 0–100 |
| execution_ms | integer | query execution time |
| result_rows | jsonb | snapshot of output |
| execution_plan | jsonb | query plan |

**View:** `sql_best_attempts` — highest score per challenge per user

### `incident_sessions`
One session per incident run.

| Column | Type | Notes |
|---|---|---|
| status | text | active / resolved / failed / abandoned |
| severity | text | P1 / P2 / P3 / P4 |
| steps_taken | jsonb | array of action objects |
| rca_submitted | text | user's root cause analysis |
| sla_met | boolean | whether resolved within SLA |
| score | integer | 0–100 |

### `interview_sessions`
One session per interview run.

| Column | Type | Notes |
|---|---|---|
| mode | text | practice / timed / war_room |
| category | text | sql / system_design / behavioral / mixed |
| total_q / answered_q / correct_q | integer | progress |

### `question_mastery`
One row per (user, question). Upserted after each answer.

| Column | Type | Notes |
|---|---|---|
| status | text | unseen / learning / reviewing / mastered |
| correct_streak | integer | consecutive correct answers |

### `ai_threads` + `ai_messages`
Conversation history for AI copilot. Threaded by context type.

Context types: `sql_explain`, `interview_help`, `incident_rca`, `spark_explain`, `architecture_review`, `topic_summary`, `general`

## Migrations

Run in order:
```
001_users.sql           → profiles table + auth trigger
002_xp_streaks.sql      → xp_ledger, streaks, achievements
003_learning_progress.sql → topic_progress, notes, practice_completions
004_sql_challenges.sql  → sql_attempts, saved_queries
005_incidents.sql       → incident_sessions, incident_events
006_interviews.sql      → interview_sessions, interview_answers, question_mastery
007_ai_conversations.sql → ai_threads, ai_messages
008_career_tracks.sql   → career_enrollments, daily_plans, user_files
```

## Local Setup

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
supabase start

# Apply migrations + seed
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/types/database.types.ts
```
