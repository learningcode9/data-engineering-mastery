-- Topic module completion tracking
create table if not exists public.topic_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  topic_id        text not null,      -- e.g. 'sql', 'pyspark', 'azure-data-factory'
  section_id      text not null,      -- section within topic
  completed       boolean not null default false,
  completed_at    timestamptz,
  time_spent_sec  integer default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, topic_id, section_id)
);

create index idx_topic_progress_user on public.topic_progress(user_id);
create index idx_topic_progress_topic on public.topic_progress(user_id, topic_id);

create trigger on_topic_progress_updated
  before update on public.topic_progress
  for each row execute procedure public.handle_updated_at();

-- Topic-level summary (computed)
create or replace view public.topic_completion_summary as
  select
    user_id,
    topic_id,
    count(*) as total_sections,
    count(*) filter (where completed) as completed_sections,
    round(count(*) filter (where completed)::numeric / count(*) * 100, 1) as pct_complete,
    max(completed_at) as last_completed_at,
    sum(time_spent_sec) as total_time_sec
  from public.topic_progress
  group by user_id, topic_id;

-- Practice task completion
create table if not exists public.practice_completions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  topic_id      text not null,
  task_id       text not null,
  completed_at  timestamptz not null default now(),
  unique (user_id, topic_id, task_id)
);

create index idx_practice_user on public.practice_completions(user_id);

-- User notes (autosaved per section)
create table if not exists public.notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  topic_id    text not null,
  section_id  text not null,
  content     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, topic_id, section_id)
);

create index idx_notes_user on public.notes(user_id);

create trigger on_notes_updated
  before update on public.notes
  for each row execute procedure public.handle_updated_at();

-- RLS
alter table public.topic_progress enable row level security;
alter table public.practice_completions enable row level security;
alter table public.notes enable row level security;

create policy "Users manage own progress" on public.topic_progress for all using (auth.uid() = user_id);
create policy "Users manage own practice" on public.practice_completions for all using (auth.uid() = user_id);
create policy "Users manage own notes" on public.notes for all using (auth.uid() = user_id);
