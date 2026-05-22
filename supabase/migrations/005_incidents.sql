-- Incident simulation sessions
create table if not exists public.incident_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  incident_id     text not null,
  scenario_id     text not null,
  status          text not null default 'active' check (status in ('active', 'resolved', 'failed', 'abandoned')),
  severity        text check (severity in ('P1', 'P2', 'P3', 'P4')),
  started_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  duration_sec    integer,
  score           integer,            -- 0-100 based on resolution speed and accuracy
  steps_taken     jsonb default '[]', -- array of action objects
  rca_submitted   text,               -- root cause analysis text
  sla_met         boolean,
  xp_awarded      integer default 0
);

create index idx_incident_sessions_user on public.incident_sessions(user_id);
create index idx_incident_sessions_status on public.incident_sessions(status);

-- Incident timeline events (append-only log)
create table if not exists public.incident_events (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references public.incident_sessions(id) on delete cascade,
  event_type    text not null, -- 'alert', 'investigation', 'action', 'escalation', 'resolution'
  actor         text not null default 'user', -- 'user', 'system', 'oncall'
  description   text not null,
  metadata      jsonb default '{}',
  occurred_at   timestamptz not null default now()
);

create index idx_incident_events_session on public.incident_events(session_id);

-- RLS
alter table public.incident_sessions enable row level security;
alter table public.incident_events enable row level security;

create policy "Users manage own incident sessions" on public.incident_sessions for all using (auth.uid() = user_id);
create policy "Users view own incident events" on public.incident_events for select
  using (
    exists (
      select 1 from public.incident_sessions s
      where s.id = incident_events.session_id and s.user_id = auth.uid()
    )
  );
create policy "Users insert incident events" on public.incident_events for insert
  with check (
    exists (
      select 1 from public.incident_sessions s
      where s.id = incident_events.session_id and s.user_id = auth.uid()
    )
  );
