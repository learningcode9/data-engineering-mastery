-- XP and level tracking
create table if not exists public.xp_ledger (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  amount       integer not null,
  source       text not null, -- 'topic_complete', 'sql_challenge', 'incident_resolve', 'interview', 'streak_bonus'
  source_id    text,          -- optional reference to the source entity
  label        text,          -- human-readable description
  created_at   timestamptz not null default now()
);

create index idx_xp_ledger_user on public.xp_ledger(user_id);

-- Computed XP total view
create or replace view public.user_xp_totals as
  select
    user_id,
    sum(amount) as total_xp,
    floor(sum(amount) / 100) as level,
    sum(amount) % 100 as xp_in_current_level
  from public.xp_ledger
  group by user_id;

-- Streak tracking
create table if not exists public.streaks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid unique not null references public.profiles(id) on delete cascade,
  current_streak      integer not null default 0,
  longest_streak      integer not null default 0,
  last_activity_date  date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger on_streaks_updated
  before update on public.streaks
  for each row execute procedure public.handle_updated_at();

-- Achievements
create table if not exists public.achievements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  badge_id     text not null,      -- e.g. 'sql_master', 'streak_7', 'incident_hero'
  badge_name   text not null,
  badge_icon   text,
  earned_at    timestamptz not null default now(),
  unique (user_id, badge_id)
);

create index idx_achievements_user on public.achievements(user_id);

-- RLS
alter table public.xp_ledger enable row level security;
alter table public.streaks enable row level security;
alter table public.achievements enable row level security;

create policy "Users can view own XP" on public.xp_ledger for select using (auth.uid() = user_id);
create policy "Users can insert own XP" on public.xp_ledger for insert with check (auth.uid() = user_id);

create policy "Users can view own streak" on public.streaks for select using (auth.uid() = user_id);
create policy "Users can manage own streak" on public.streaks for all using (auth.uid() = user_id);

create policy "Users can view own achievements" on public.achievements for select using (auth.uid() = user_id);
create policy "Users can earn achievements" on public.achievements for insert with check (auth.uid() = user_id);
