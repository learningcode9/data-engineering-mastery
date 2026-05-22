# Auth Flow

## Overview

Auth is powered by **Supabase Auth** and is completely opt-in via feature flag.
When `VITE_ENABLE_BACKEND=false` (the default), the entire auth system is a no-op
and the app runs exactly as before with localStorage.

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

## ProtectedRoute

Wraps any section that requires auth:

```jsx
<ProtectedRoute requireOnboarded>
  <PremiumSection />
</ProtectedRoute>
```

Shows loading screen while auth check runs, falls back to `fallback` prop if unauthenticated.

## Auto-profile creation

The Supabase trigger `on_auth_user_created` (in migration `001_users.sql`) automatically
creates a row in `public.profiles` when a new user signs up. No manual profile creation needed.

## Supported auth providers

- Email + password
- Google OAuth (requires Google Console setup — see `docs/deployment.md`)

## Role system (future)

The `profiles.role` column supports `learner`, `pro`, and `admin`. Role checks
can be added to `ProtectedRoute` when subscription/role features are implemented.

## Adding auth to a new section

1. Use `useAuth()` hook to access `user` and `isAuthenticated`
2. Wrap with `<ProtectedRoute>` if the section should require sign-in
3. Pass `userId` from `user.id` to service functions
4. Service functions (`src/services/supabase/`) handle `null` userId gracefully (fall back to localStorage)
