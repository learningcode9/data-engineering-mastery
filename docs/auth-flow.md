# Auth Flow

## Overview

Auth is powered by **Supabase Auth** and is completely opt-in via feature flag.
When `VITE_ENABLE_BACKEND=false` (the default), the entire auth system is a no-op
and the app runs exactly as before with localStorage.

**Phase 5 status:** Auth UI is fully in place. The app does not require login.
Users can sign in to sync progress to Supabase, or continue as Demo Learner.

---

## Demo Mode

When Supabase env vars are absent or `VITE_ENABLE_BACKEND=false`:

- `getCurrentUser()` returns the `MOCK_GUEST` sentinel (`id: 'local-guest'`)
- `UserProvider.isMockUser` is `true`
- `UserMenu` in `TopHeader` shows **"Demo Learner"** and a "Sign In / Create Account" button
- `LoginForm` and `SignupForm` show a yellow demo-mode banner
- Clicking "Continue as Demo Learner" on either form closes the overlay without sign-in
- All localStorage-backed progress (XP, streak, topics, practice) continues to work normally
- No network calls are made; `AuthProvider` sets `loading=false` immediately

To activate real auth, set these in `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENABLE_BACKEND=true
```

---

## Supabase Auth Plan

**Current (Phase 5):** Auth UI and provider wiring are complete. Sign-in/sign-up
works end-to-end when credentials are present, but the app never forces login.

**Phase 6 targets:**
- Sync onboarding preferences (`target_role`, `experience_level`, `preferred_cloud`, `daily_study_time`) to `profiles` table after sign-up
- Migrate XP and progress from localStorage to Supabase on first sign-in
- Show a "sync your progress" prompt to demo users who have accumulated data

---

## Flow Diagram

```
App starts
    │
    ▼
AppProvider mounts AuthProvider
    │
    ├─ VITE_ENABLE_BACKEND=false → AuthProvider is a no-op, loading=false immediately
    │
    └─ VITE_ENABLE_BACKEND=true  →
           │
           ▼
        supabase.auth.getSession()
           │
           ├─ No session → loading=false, user=null (unauthenticated UX)
           │
           └─ Has session →
                 │
                 ▼
              Load profile from `profiles` table
                 │
                 ▼
              Set user, session, profile in AuthContext
                 │
                 ▼
              useSyncXP and useSyncProgress hooks activate
              (XP events and progress changes now sync to Supabase)
```

## Auth State

All auth state lives in `AuthContext` (provided by `AuthProvider`):

| Field | Type | Description |
|---|---|---|
| `user` | `User \| null` | Supabase Auth user |
| `session` | `Session \| null` | JWT session |
| `profile` | `Profile \| null` | Row from `public.profiles` |
| `loading` | `boolean` | True while session is being checked |
| `isAuthenticated` | `boolean` | Shorthand for `!!user` |

## useAuth() hook

```jsx
import { useAuth } from '../lib/auth/AuthProvider'

function MyComponent() {
  const { user, profile, isAuthenticated, signIn, signOut } = useAuth()

  if (!isAuthenticated) return <SignInPrompt />
  return <UserGreeting name={profile?.full_name} />
}
```

## Protected Route Strategy

There are two `ProtectedRoute` components — they serve different layers:

### `src/components/auth/ProtectedRoute.tsx` (Phase 5 — user-facing)

Reads from `UserProvider`. `enforced=false` by default so nothing is blocked today.

```jsx
import { ProtectedRoute } from '../components/auth/ProtectedRoute'

// Wraps a section without blocking — safe to use now, ready to lock later
<ProtectedRoute>
  <MySection />
</ProtectedRoute>

// Blocks unauthenticated users (future use only)
<ProtectedRoute enforced>
  <PremiumSection />
</ProtectedRoute>
```

**How it works:**
- `enforced=false` → renders children immediately; no auth required
- `enforced=true` + `isMockUser=true` → renders `fallback` or a built-in "Sign In" prompt
- While auth is resolving → renders nothing (prevents flash of wrong content)

### `src/lib/auth/ProtectedRoute.tsx` (fuller implementation)

Reads from `AuthProvider` (the Supabase session layer). Supports `requireOnboarded` to gate behind the onboarding flow. Use this when introducing role-gated or onboarding-gated sections.

```jsx
<ProtectedRoute requireOnboarded>
  <PremiumSection />
</ProtectedRoute>
```

Shows a full-screen loading spinner while the session check runs, falls back to `fallback` prop if unauthenticated.

## Auto-profile creation

The Supabase trigger `on_auth_user_created` (in migration `001_users.sql`) automatically
creates a row in `public.profiles` when a new user signs up. No manual profile creation needed.

## Supported auth providers

- Email + password
- Google OAuth (requires Google Console setup — see `docs/deployment.md`)

## Onboarding Plan

**Phase 5 (current):** `src/pages/OnboardingPage.tsx` is a clean scaffold collecting:
- Target role (Data Engineer, Analytics Engineer, ML Engineer, etc.)
- Current experience level (beginner / intermediate / advanced)
- Preferred cloud platform (Azure / AWS / GCP / multi)
- Daily study time goal (15 min / 30 min / 1 hr / 2+ hr)

The form renders and captures state, but saves nothing yet (`console.info` placeholder).
It uses the same `auth-card` / `auth-form` / `auth-input` CSS as the sign-in flow.

**Phase 6 plan:**
1. After successful sign-up, show `OnboardingPage` before closing the auth overlay
2. On submit, call `updateProfile(userId, { target_role, experience_level, preferred_cloud, daily_study_time })`
3. Set `profiles.onboarded = true` so the gate is not shown again
4. Use `profile.target_role` and `profile.preferred_cloud` to pre-filter the roadmap and topic recommendations

To trigger onboarding in the current scaffold (for testing):
```jsx
import { OnboardingPage } from '../pages/OnboardingPage'

<OnboardingPage
  onComplete={() => console.log('done')}
  onSkip={() => console.log('skipped')}
/>
```

---

## Role system (future)

The `profiles.role` column supports `learner`, `pro`, and `admin`. Role checks
can be added to `ProtectedRoute` when subscription/role features are implemented.

## Adding auth to a new section

1. Use `useAuth()` hook to access `user` and `isAuthenticated`
2. Wrap with `<ProtectedRoute>` if the section should require sign-in
3. Pass `userId` from `user.id` to service functions
4. Service functions (`src/services/supabase/`) handle `null` userId gracefully (fall back to localStorage)
