-- Interview session tracking
create table if not exists public.interview_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  mode          text not null check (mode in ('practice', 'timed', 'war_room')),
  category      text,               -- 'sql', 'system_design', 'behavioral', 'mixed'
  total_q       integer not null default 0,
  answered_q    integer not null default 0,
  correct_q     integer not null default 0,
  score         integer,            -- 0-100
  duration_sec  integer,
  completed     boolean not null default false,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  xp_awarded    integer default 0
);

create index idx_interview_sessions_user on public.interview_sessions(user_id);

-- Per-question answer records within a session
create table if not exists public.interview_answers (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.interview_sessions(id) on delete cascade,
  question_id     text not null,
  question_text   text not null,
  category        text,
  user_answer     text,
  is_correct      boolean,
  confidence      integer check (confidence between 1 and 5),
  time_taken_sec  integer,
  marked_review   boolean not null default false,
  answered_at     timestamptz not null default now()
);

create index idx_interview_answers_session on public.interview_answers(session_id);

-- Question mastery tracking (aggregated per question)
create table if not exists public.question_mastery (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  question_id     text not null,
  status          text not null default 'unseen' check (status in ('unseen', 'learning', 'reviewing', 'mastered')),
  attempts        integer not null default 0,
  correct_streak  integer not null default 0,
  last_seen_at    timestamptz,
  updated_at      timestamptz not null default now(),
  unique (user_id, question_id)
);

create index idx_question_mastery_user on public.question_mastery(user_id);

create trigger on_question_mastery_updated
  before update on public.question_mastery
  for each row execute procedure public.handle_updated_at();

-- RLS
alter table public.interview_sessions enable row level security;
alter table public.interview_answers enable row level security;
alter table public.question_mastery enable row level security;

create policy "Users manage own interview sessions" on public.interview_sessions for all using (auth.uid() = user_id);
create policy "Users manage own answers" on public.interview_answers for all
  using (
    exists (
      select 1 from public.interview_sessions s
      where s.id = interview_answers.session_id and s.user_id = auth.uid()
    )
  );
create policy "Users manage own mastery" on public.question_mastery for all using (auth.uid() = user_id);
