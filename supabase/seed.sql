-- Seed data for development and demo purposes
-- Run after migrations in a local Supabase instance
-- supabase db reset (applies migrations + seed)

-- Demo user (UUID matches a known test account in local Supabase Auth)
do $$
declare
  demo_user_id uuid := '00000000-0000-0000-0000-000000000001';
begin

-- Profile
insert into public.profiles (id, email, full_name, role, onboarded, target_role, experience_level)
values (
  demo_user_id,
  'demo@dataengmastery.dev',
  'Demo Engineer',
  'learner',
  true,
  'Senior Data Engineer',
  'mid'
) on conflict (id) do nothing;

-- XP ledger
insert into public.xp_ledger (user_id, amount, source, label) values
  (demo_user_id, 150, 'topic_complete', 'Completed SQL Fundamentals'),
  (demo_user_id, 100, 'topic_complete', 'Completed Python Basics'),
  (demo_user_id, 200, 'sql_challenge',  'Solved 5 SQL challenges'),
  (demo_user_id, 50,  'streak_bonus',   '7-day streak bonus'),
  (demo_user_id, 175, 'incident_resolve', 'Resolved P2 pipeline failure');

-- Streak
insert into public.streaks (user_id, current_streak, longest_streak, last_activity_date)
values (demo_user_id, 7, 14, current_date)
on conflict (user_id) do nothing;

-- Achievements
insert into public.achievements (user_id, badge_id, badge_name, badge_icon) values
  (demo_user_id, 'first_query',    'First Query',      '🔍'),
  (demo_user_id, 'streak_7',       '7-Day Streak',     '🔥'),
  (demo_user_id, 'sql_beginner',   'SQL Beginner',     '📊'),
  (demo_user_id, 'incident_first', 'First Responder',  '🚨')
on conflict (user_id, badge_id) do nothing;

-- Topic progress (SQL module)
insert into public.topic_progress (user_id, topic_id, section_id, completed, completed_at, time_spent_sec) values
  (demo_user_id, 'sql', 'basics',       true,  now() - interval '5 days', 1800),
  (demo_user_id, 'sql', 'joins',        true,  now() - interval '4 days', 2400),
  (demo_user_id, 'sql', 'aggregations', true,  now() - interval '3 days', 1500),
  (demo_user_id, 'sql', 'window-fns',   false, null,                       0),
  (demo_user_id, 'sql', 'performance',  false, null,                       0),
  (demo_user_id, 'python', 'basics',    true,  now() - interval '6 days', 2100),
  (demo_user_id, 'python', 'pandas',    true,  now() - interval '5 days', 3000),
  (demo_user_id, 'python', 'pyspark',   false, null,                       0)
on conflict (user_id, topic_id, section_id) do nothing;

-- SQL attempts
insert into public.sql_attempts (user_id, challenge_id, query, is_correct, score, execution_ms) values
  (demo_user_id, 'sql-001', 'SELECT * FROM orders WHERE status = ''completed'';', true,  95, 12),
  (demo_user_id, 'sql-002', 'SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id;', true, 88, 18),
  (demo_user_id, 'sql-003', 'SELECT * FROM orders;', false, 20, 8);

-- Career enrollment
insert into public.career_enrollments (user_id, track_id, track_name, status, target_date)
values (demo_user_id, 'azure-data-engineer', 'Azure Data Engineer', 'active', current_date + interval '90 days')
on conflict (user_id, track_id) do nothing;

end $$;
