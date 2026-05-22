-- ============================================================
-- Data Engineering Mastery — Initial Schema
-- Migration: 001_initial_schema.sql
-- Apply with: supabase db push  (or supabase db reset for local)
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─── Shared updated_at trigger ───────────────────────────────────────────────
-- One function reused by every table that needs auto-updated_at.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── 1. profiles ─────────────────────────────────────────────────────────────
-- One row per authenticated user; created automatically on sign-up via trigger.

create table if not exists public.profiles (
  id          uuid        primary key references auth.users(id) on delete cascade,
  email       text        not null,
  full_name   text,
  avatar_url  text,
  role        text        not null default 'learner'
                          check (role in ('learner', 'pro', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user is registered
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', null),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── 2. learning_progress ────────────────────────────────────────────────────
-- Tracks overall progress per user per topic module.

create table if not exists public.learning_progress (
  id                   uuid        primary key default uuid_generate_v4(),
  user_id              uuid        not null references public.profiles(id) on delete cascade,
  topic_id             text        not null,
  module_id            text        not null,
  progress_percent     integer     not null default 0
                                   check (progress_percent between 0 and 100),
  status               text        not null default 'not_started'
                                   check (status in ('not_started', 'in_progress', 'completed')),
  last_opened_section  text,
  updated_at           timestamptz not null default now(),
  unique (user_id, topic_id, module_id)
);

create index idx_learning_progress_user    on public.learning_progress(user_id);
create index idx_learning_progress_topic   on public.learning_progress(user_id, topic_id);
create index idx_learning_progress_status  on public.learning_progress(status);

create trigger trg_learning_progress_updated_at
  before update on public.learning_progress
  for each row execute function public.set_updated_at();

-- ─── 3. topic_completion ─────────────────────────────────────────────────────
-- Append-only log of individual section completions (one row per section done).

create table if not exists public.topic_completion (
  id           uuid        primary key default uuid_generate_v4(),
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  topic_id     text        not null,
  section_id   text        not null,
  completed_at timestamptz not null default now(),
  unique (user_id, topic_id, section_id)
);

create index idx_topic_completion_user   on public.topic_completion(user_id);
create index idx_topic_completion_topic  on public.topic_completion(user_id, topic_id);

-- ─── 4. saved_notes ──────────────────────────────────────────────────────────
-- One note per user per topic section; upserted on every save.

create table if not exists public.saved_notes (
  id          uuid        primary key default uuid_generate_v4(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  topic_id    text        not null,
  section_id  text        not null,
  content     text        not null default '',
  updated_at  timestamptz not null default now(),
  unique (user_id, topic_id, section_id)
);

create index idx_saved_notes_user  on public.saved_notes(user_id);
create index idx_saved_notes_topic on public.saved_notes(user_id, topic_id);

create trigger trg_saved_notes_updated_at
  before update on public.saved_notes
  for each row execute function public.set_updated_at();

-- ─── 5. xp_history ───────────────────────────────────────────────────────────
-- Append-only ledger; never updated, only inserted.
-- Total XP is always computed as SUM(xp_amount) for a given user.

create table if not exists public.xp_history (
  id           uuid        primary key default uuid_generate_v4(),
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  action       text        not null,
  xp_amount    integer     not null check (xp_amount > 0),
  source_type  text        not null
               check (source_type in (
                 'topic_complete', 'section_complete', 'practice_task',
                 'sql_challenge', 'incident_resolve', 'interview', 'streak_bonus', 'achievement'
               )),
  source_id    text,
  created_at   timestamptz not null default now()
);

create index idx_xp_history_user    on public.xp_history(user_id);
create index idx_xp_history_created on public.xp_history(user_id, created_at desc);

-- Convenience view: total XP and level per user
create or replace view public.user_xp_summary as
  select
    user_id,
    coalesce(sum(xp_amount), 0)                            as total_xp,
    floor(coalesce(sum(xp_amount), 0) / 500) + 1          as level,
    coalesce(sum(xp_amount), 0) % 500                      as xp_in_level
  from public.xp_history
  group by user_id;

-- ─── 6. achievements ─────────────────────────────────────────────────────────
-- One row per badge earned; duplicate badge_key silently ignored via unique.

create table if not exists public.achievements (
  id              uuid        primary key default uuid_generate_v4(),
  user_id         uuid        not null references public.profiles(id) on delete cascade,
  achievement_key text        not null,
  title           text        not null,
  unlocked_at     timestamptz not null default now(),
  unique (user_id, achievement_key)
);

create index idx_achievements_user on public.achievements(user_id);

-- ─── 7. incidents ────────────────────────────────────────────────────────────
-- Incident scenario definitions. Publicly readable; written by admin seed data.

create table if not exists public.incidents (
  id               uuid        primary key default uuid_generate_v4(),
  title            text        not null,
  severity         text        not null check (severity in ('P1', 'P2', 'P3', 'P4')),
  status           text        not null default 'active'
                               check (status in ('active', 'resolved', 'closed')),
  affected_system  text        not null,
  business_impact  text        not null,
  created_at       timestamptz not null default now()
);

create index idx_incidents_status   on public.incidents(status);
create index idx_incidents_severity on public.incidents(severity);
create index idx_incidents_created  on public.incidents(created_at desc);

-- ─── 8. incident_attempts ────────────────────────────────────────────────────
-- Records each time a user attempts to resolve a simulation incident.

create table if not exists public.incident_attempts (
  id                  uuid        primary key default uuid_generate_v4(),
  user_id             uuid        not null references public.profiles(id) on delete cascade,
  incident_id         uuid        not null references public.incidents(id) on delete cascade,
  selected_resolution text        not null,
  success             boolean     not null default false,
  xp_earned          integer     not null default 0,
  completed_at        timestamptz not null default now()
);

create index idx_incident_attempts_user     on public.incident_attempts(user_id);
create index idx_incident_attempts_incident on public.incident_attempts(incident_id);
create index idx_incident_attempts_created  on public.incident_attempts(completed_at desc);

-- ─── 9. sql_attempts ─────────────────────────────────────────────────────────
-- Records each SQL challenge submission (append-only).

create table if not exists public.sql_attempts (
  id               uuid        primary key default uuid_generate_v4(),
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  challenge_id     text        not null,
  query_text       text        not null,
  is_correct       boolean     not null default false,
  execution_time_ms integer,
  attempts_count   integer     not null default 1,
  created_at       timestamptz not null default now()
);

create index idx_sql_attempts_user      on public.sql_attempts(user_id);
create index idx_sql_attempts_challenge on public.sql_attempts(challenge_id);
create index idx_sql_attempts_created   on public.sql_attempts(user_id, created_at desc);

-- ─── 10. interview_sessions ──────────────────────────────────────────────────
-- One session per interview run (practice, timed, or war_room).

create table if not exists public.interview_sessions (
  id           uuid        primary key default uuid_generate_v4(),
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  category     text,
  difficulty   text        check (difficulty in ('junior', 'mid', 'senior', 'staff')),
  score        integer     check (score between 0 and 100),
  completed_at timestamptz not null default now()
);

create index idx_interview_sessions_user    on public.interview_sessions(user_id);
create index idx_interview_sessions_created on public.interview_sessions(completed_at desc);

-- ─── 11. ai_chat_history ─────────────────────────────────────────────────────
-- Stores AI copilot conversations per user.

create table if not exists public.ai_chat_history (
  id           uuid        primary key default uuid_generate_v4(),
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  message      text        not null,
  response     text        not null,
  context_type text        not null default 'general'
               check (context_type in (
                 'sql_explain', 'interview_help', 'incident_rca',
                 'spark_explain', 'architecture_review', 'topic_summary', 'general'
               )),
  created_at   timestamptz not null default now()
);

create index idx_ai_chat_user    on public.ai_chat_history(user_id);
create index idx_ai_chat_context on public.ai_chat_history(user_id, context_type);
create index idx_ai_chat_created on public.ai_chat_history(created_at desc);

-- ─── 12. projects_progress ───────────────────────────────────────────────────
-- Tracks each user's progress through portfolio projects.

create table if not exists public.projects_progress (
  id               uuid        primary key default uuid_generate_v4(),
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  project_id       text        not null,
  progress_percent integer     not null default 0
                               check (progress_percent between 0 and 100),
  status           text        not null default 'not_started'
                               check (status in ('not_started', 'in_progress', 'completed')),
  updated_at       timestamptz not null default now(),
  unique (user_id, project_id)
);

create index idx_projects_progress_user   on public.projects_progress(user_id);
create index idx_projects_progress_status on public.projects_progress(status);

create trigger trg_projects_progress_updated_at
  before update on public.projects_progress
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on every table
alter table public.profiles          enable row level security;
alter table public.learning_progress enable row level security;
alter table public.topic_completion  enable row level security;
alter table public.saved_notes       enable row level security;
alter table public.xp_history        enable row level security;
alter table public.achievements      enable row level security;
alter table public.incidents         enable row level security;
alter table public.incident_attempts enable row level security;
alter table public.sql_attempts      enable row level security;
alter table public.interview_sessions enable row level security;
alter table public.ai_chat_history   enable row level security;
alter table public.projects_progress enable row level security;

-- ── profiles: own row only ────────────────────────────────────────────────────
create policy "profiles: select own"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update using (auth.uid() = id);

-- ── learning_progress: own rows only ─────────────────────────────────────────
create policy "learning_progress: all own"
  on public.learning_progress for all using (auth.uid() = user_id);

-- ── topic_completion: own rows only ──────────────────────────────────────────
create policy "topic_completion: all own"
  on public.topic_completion for all using (auth.uid() = user_id);

-- ── saved_notes: own rows only ────────────────────────────────────────────────
create policy "saved_notes: all own"
  on public.saved_notes for all using (auth.uid() = user_id);

-- ── xp_history: own rows only ────────────────────────────────────────────────
create policy "xp_history: select own"
  on public.xp_history for select using (auth.uid() = user_id);

create policy "xp_history: insert own"
  on public.xp_history for insert with check (auth.uid() = user_id);

-- ── achievements: own rows only ──────────────────────────────────────────────
create policy "achievements: select own"
  on public.achievements for select using (auth.uid() = user_id);

create policy "achievements: insert own"
  on public.achievements for insert with check (auth.uid() = user_id);

-- ── incidents: publicly readable, no user writes ─────────────────────────────
create policy "incidents: public read"
  on public.incidents for select using (true);

-- ── incident_attempts: own rows only ─────────────────────────────────────────
create policy "incident_attempts: all own"
  on public.incident_attempts for all using (auth.uid() = user_id);

-- ── sql_attempts: own rows only ──────────────────────────────────────────────
create policy "sql_attempts: select own"
  on public.sql_attempts for select using (auth.uid() = user_id);

create policy "sql_attempts: insert own"
  on public.sql_attempts for insert with check (auth.uid() = user_id);

-- ── interview_sessions: own rows only ────────────────────────────────────────
create policy "interview_sessions: all own"
  on public.interview_sessions for all using (auth.uid() = user_id);

-- ── ai_chat_history: own rows only ───────────────────────────────────────────
create policy "ai_chat_history: all own"
  on public.ai_chat_history for all using (auth.uid() = user_id);

-- ── projects_progress: own rows only ─────────────────────────────────────────
create policy "projects_progress: all own"
  on public.projects_progress for all using (auth.uid() = user_id);
