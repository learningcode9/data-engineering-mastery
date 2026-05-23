import { useState, useEffect, useCallback } from 'react'
import { getOnboardingProfile, saveOnboardingProfile } from '../services/supabase/onboarding'
import { useUser } from '../providers/UserProvider'
import type { OnboardingProfile } from '../types/database'

export function useOnboarding() {
  const { userId } = useUser()
  const [onboardingProfile, setOnboardingProfile] = useState<OnboardingProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getOnboardingProfile(userId ?? 'local-guest')
      .then(setOnboardingProfile)
      .catch(() => setOnboardingProfile(null))
      .finally(() => setIsLoading(false))
  }, [userId])

  const saveProfile = useCallback(async (profile: OnboardingProfile) => {
    await saveOnboardingProfile(userId ?? 'local-guest', profile)
    setOnboardingProfile(profile)
  }, [userId])

  return {
    onboardingProfile,
    saveProfile,
    isCompleted: onboardingProfile !== null,
    isLoading,
  }
}
