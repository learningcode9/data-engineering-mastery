# Deployment Guide

## Option A — Frontend only (simplest)

The app works with zero backend configuration. All progress saves to localStorage. This is the recommended starting point for a portfolio demo.

```bash
# 1. Clone
git clone https://github.com/your-username/data-engineering-mastery.git
cd data-engineering-mastery

# 2. Install
npm install

# 3. Build
npm run build

# 4. Preview locally
npm run preview
```

The `dist/` folder is ready to deploy to any static host.

---

## Option B — Vercel (recommended)

The repo includes a `vercel.json` pre-configured with:
- Correct output directory (`dist/`)
- SPA rewrite rule (all routes → `index.html`)
- Immutable cache headers for JS/CSS assets
- Correct `Content-Type: application/wasm` for the sql.js WASM binary

### Deploy via Vercel dashboard

1. Push the repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import the repo
3. Framework preset: **Vite** (auto-detected)
4. No build configuration needed — `vercel.json` handles everything
5. Click **Deploy**

### Deploy via CLI

```bash
npm install -g vercel
vercel --prod
```

### Environment variables (optional)

Set these in **Vercel dashboard → Settings → Environment Variables** if using Supabase:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | `https://your-project-ref.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | your anon key from Supabase dashboard |
| `VITE_ENABLE_BACKEND` | `true` |
| `VITE_ENABLE_AI` | `true` (optional) |
| `VITE_AI_PROVIDER` | `mock` or `openai` |

Without these, the app deploys fine using localStorage only.

### Note on sql.js WASM

The `sql-wasm.wasm` and `sql-wasm-browser.js` files are automatically copied from `node_modules/sql.js/dist/` into `public/` during the Vite build step (`vite build`). Vercel runs this build automatically — no manual step required.

---

## Option C — GitHub Pages

```bash
npm run build
# Push the dist/ folder to the gh-pages branch
# Or use the gh-pages npm package:
npx gh-pages -d dist
```

Add `base: '/your-repo-name/'` to `vite.config.js` if deploying to a project page (non-root URL).

---

## Option D — Supabase backend (optional)

Only needed if you want cloud-synced progress, auth, and AI features.

### 1. Create a Supabase project

- Go to [supabase.com/dashboard](https://supabase.com/dashboard)
- New project → choose the region closest to your Vercel deployment

### 2. Apply database migrations

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Link to your project
supabase link --project-ref your-project-ref

# Push all migrations
supabase db push
```

### 3. Configure Auth

In the Supabase dashboard → **Authentication → Providers**:
- Enable **Email** (magic link or password)
- Enable **Google OAuth** — add client ID and secret from [Google Console](https://console.cloud.google.com/)
- Set **Site URL** to your Vercel deployment URL (e.g. `https://your-app.vercel.app`)
- Add `https://your-app.vercel.app/auth/callback` to **Redirect URLs**

### 4. Enable Supabase in the app

In Vercel environment variables, set:
```
VITE_ENABLE_BACKEND=true
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Redeploy — the app will now sync progress to Supabase instead of localStorage.

### 5. Regenerate TypeScript types (after schema changes)

```bash
supabase gen types typescript --local > src/types/database.types.ts
```

---

## Local development with Supabase

```bash
# 1. Start local Supabase stack
supabase start

# 2. Apply migrations and seed data
supabase db reset

# 3. Copy environment file
cp .env.example .env.local
# Edit .env.local — use the local Supabase URL and keys printed by `supabase start`

# 4. Run the app
npm run dev
```

---

## Production Checklist

- [ ] `npm run build` passes locally
- [ ] `vercel.json` present in repo root
- [ ] Repo pushed to GitHub
- [ ] Vercel project imported and auto-deployed
- [ ] (If using Supabase) Supabase project created in correct region
- [ ] (If using Supabase) Migrations applied via `supabase db push`
- [ ] (If using Supabase) Auth providers configured
- [ ] (If using Supabase) Environment variables set in Vercel dashboard
- [ ] (If using Supabase) Site URL updated in Supabase auth settings
- [ ] Custom domain configured in Vercel (optional)
- [ ] Screenshots added to `docs/screenshots/` and linked in README
