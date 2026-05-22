-- AI conversation threads
create table if not exists public.ai_threads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  context     text not null check (context in (
    'sql_explain', 'interview_help', 'incident_rca', 'spark_explain',
    'architecture_review', 'topic_summary', 'general'
  )),
  title       text,
  metadata    jsonb default '{}', -- e.g. { topic_id, challenge_id, incident_id }
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index idx_ai_threads_user on public.ai_threads(user_id);
create index idx_ai_threads_context on public.ai_threads(user_id, context);

create trigger on_ai_threads_updated
  before update on public.ai_threads
  for each row execute procedure public.handle_updated_at();

-- Messages within a thread
create table if not exists public.ai_messages (
  id            uuid primary key default gen_random_uuid(),
  thread_id     uuid not null references public.ai_threads(id) on delete cascade,
  role          text not null check (role in ('user', 'assistant', 'system')),
  content       text not null,
  tokens_used   integer,
  model         text,               -- e.g. 'gpt-4o', 'claude-3-5-sonnet'
  created_at    timestamptz not null default now()
);

create index idx_ai_messages_thread on public.ai_messages(thread_id);
create index idx_ai_messages_order on public.ai_messages(thread_id, created_at);

-- RLS
alter table public.ai_threads enable row level security;
alter table public.ai_messages enable row level security;

create policy "Users manage own AI threads" on public.ai_threads for all using (auth.uid() = user_id);
create policy "Users view own AI messages" on public.ai_messages for select
  using (
    exists (
      select 1 from public.ai_threads t
      where t.id = ai_messages.thread_id and t.user_id = auth.uid()
    )
  );
create policy "Users insert AI messages" on public.ai_messages for insert
  with check (
    exists (
      select 1 from public.ai_threads t
      where t.id = ai_messages.thread_id and t.user_id = auth.uid()
    )
  );
