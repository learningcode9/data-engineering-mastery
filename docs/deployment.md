# Deployment Guide

## Vercel (Frontend)

The app is pre-configured for Vercel via `vercel.json`.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy preview
vercel

# Deploy to production
vercel --prod
```

**Required environment variables in Vercel dashboard:**

```
VITE_SUPABASE_URL         = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY    = your-anon-key
VITE_ENABLE_BACKEND       = true
VITE_ENABLE_REALTIME      = true
VITE_ENABLE_AI            = true
VITE_AI_PROVIDER          = mock     # or "openai" with key set
```

## Supabase (Database + Auth + Realtime)

### 1. Create project
- Go to https://supabase.com/dashboard
- New project → choose region closest to Vercel deployment

### 2. Apply migrations
```bash
# Install CLI
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push

# (Optional) Seed with demo data
supabase db seed
```

### 3. Configure Auth
In Supabase dashboard → Authentication:
- Enable Email provider
- Enable Google OAuth (add client ID/secret from Google Console)
- Set Site URL to your Vercel deployment URL
- Add `https://your-app.vercel.app/auth/callback` to Redirect URLs

### 4. Storage buckets
```sql
-- Run in Supabase SQL editor
insert into storage.buckets (id, name, public)
values ('user-files', 'user-files', false);
```

Add storage policy:
```sql
create policy "Users upload own files"
on storage.objects for insert
with check (bucket_id = 'user-files' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users view own files"
on storage.objects for select
using (bucket_id = 'user-files' and auth.uid()::text = (storage.foldername(name))[1]);
```

## Local Development

```bash
# 1. Clone and install
git clone https://github.com/learningcode9/data-engineering-mastery.git
cd data-engineering-mastery
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. (Optional) Run local Supabase
supabase start
supabase db reset   # applies migrations + seed

# 4. Run frontend
npm run dev
```

## Frontend-only mode (no Supabase)

The app works without any backend — just leave `VITE_ENABLE_BACKEND=false` (or don't create `.env.local`).
All progress is stored in localStorage. This is the default behavior and requires no setup.

## Generating fresh TypeScript types

After any schema changes:
```bash
supabase gen types typescript --local > src/types/database.types.ts
```

## Production Checklist

- [ ] Supabase project created in correct region
- [ ] All migrations applied via `supabase db push`
- [ ] Auth providers configured (Email + Google)
- [ ] Storage bucket created with RLS policies
- [ ] Environment variables set in Vercel
- [ ] Custom domain configured in Vercel
- [ ] Supabase Site URL updated to production domain
- [ ] TypeScript types regenerated from production schema
- [ ] `npm run build` passes locally before deploying
