// Onboarding service — saves/loads learner preferences.
// Always writes to localStorage so it works with zero config.
// When Supabase is configured, also syncs to profiles.onboarding_profile (Phase 7 column).

import { isSupabaseConfigured, requireSupabase } from './client'
import type { OnboardingProfile } from '../../types/database'

const LS_KEY = 'dem-onboarding-profile'

export async function getOnboardingProfile(
  _userId: string
): Promise<OnboardingProfile | null> {
  const raw = localStorage.getItem(LS_KEY)
  if (raw) {
    try { return JSON.parse(raw) as OnboardingProfile } catch { /* fall through */ }
  }
  return null
}

export async function saveOnboardingProfile(
  userId: string,
  profile: OnboardingProfile
): Promise<void> {
  localStorage.setItem(LS_KEY, JSON.stringify(profile))

  if (!isSupabaseConfigured() || !userId || userId === 'local-guest') return

  // Best-effort Supabase sync — column added in Phase 7 migration
  try {
    await requireSupabase()
      .from('profiles')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ onboarding_profile: profile as any })
      .eq('id', userId)
  } catch {
    // localStorage copy is already saved; Supabase sync is non-blocking
  }
}
