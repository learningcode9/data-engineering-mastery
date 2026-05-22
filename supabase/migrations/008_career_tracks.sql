-- Career track enrollment
create table if not exists public.career_enrollments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  track_id    text not null,   -- e.g. 'azure-data-engineer', 'aws-data-engineer', 'ml-engineer'
  track_name  text not null,
  status      text not null default 'active' check (status in ('active', 'paused', 'completed')),
  enrolled_at timestamptz not null default now(),
  target_date date,
  completed_at timestamptz,
  unique (user_id, track_id)
);

create index idx_career_enrollments_user on public.career_enrollments(user_id);

-- Daily learning plan / standup
create table if not exists public.daily_plans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  plan_date   date not null default current_date,
  goal        text,
  tasks       jsonb default '[]',   -- [{ id, label, completed, topic_id }]
  notes       text,
  completed   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, plan_date)
);

create index idx_daily_plans_user on public.daily_plans(user_id);
create index idx_daily_plans_date on public.daily_plans(user_id, plan_date desc);

create trigger on_daily_plans_updated
  before update on public.daily_plans
  for each row execute procedure public.handle_updated_at();

-- Uploaded files / attachments (metadata only; actual file in Supabase Storage)
create table if not exists public.user_files (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  file_type     text not null check (file_type in ('diagram', 'notebook', 'resume', 'report', 'note_export')),
  storage_path  text not null,     -- Supabase Storage bucket path
  size_bytes    integer,
  metadata      jsonb default '{}',
  created_at    timestamptz not null default now()
);

create index idx_user_files_user on public.user_files(user_id);

-- RLS
alter table public.career_enrollments enable row level security;
alter table public.daily_plans enable row level security;
alter table public.user_files enable row level security;

create policy "Users manage own enrollments" on public.career_enrollments for all using (auth.uid() = user_id);
create policy "Users manage own daily plans" on public.daily_plans for all using (auth.uid() = user_id);
create policy "Users manage own files" on public.user_files for all using (auth.uid() = user_id);
