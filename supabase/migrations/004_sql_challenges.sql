-- SQL challenge attempt history
create table if not exists public.sql_attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  challenge_id    text not null,
  query           text not null,
  is_correct      boolean not null default false,
  score           integer default 0,        -- 0-100
  execution_ms    integer,                  -- query execution time
  error_message   text,
  result_rows     jsonb,                    -- snapshot of output rows
  execution_plan  jsonb,                    -- query plan if available
  attempted_at    timestamptz not null default now()
);

create index idx_sql_attempts_user on public.sql_attempts(user_id);
create index idx_sql_attempts_challenge on public.sql_attempts(challenge_id);

-- Best attempt per user per challenge
create or replace view public.sql_best_attempts as
  select distinct on (user_id, challenge_id)
    user_id,
    challenge_id,
    query,
    score,
    is_correct,
    execution_ms,
    attempted_at
  from public.sql_attempts
  order by user_id, challenge_id, score desc, attempted_at desc;

-- Saved queries (user bookmarks)
create table if not exists public.saved_queries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  query       text not null,
  description text,
  tags        text[] default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_saved_queries_user on public.saved_queries(user_id);

create trigger on_saved_queries_updated
  before update on public.saved_queries
  for each row execute procedure public.handle_updated_at();

-- RLS
alter table public.sql_attempts enable row level security;
alter table public.saved_queries enable row level security;

create policy "Users manage own SQL attempts" on public.sql_attempts for all using (auth.uid() = user_id);
create policy "Users manage own saved queries" on public.saved_queries for all using (auth.uid() = user_id);
