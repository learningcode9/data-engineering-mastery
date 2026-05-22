// XP + streak service — wraps all XP/streak/achievement Supabase operations

import { requireSupabase } from './client'
import { isBackendEnabled } from '../../config/env'
import type { XPSource } from '../../types/database.types'

export async function awardXP(
  userId: string,
  amount: number,
  source: XPSource,
  label?: string
): Promise<void> {
  if (!isBackendEnabled()) return
  const { error } = await requireSupabase().from('xp_ledger').insert({
    user_id: userId,
    amount,
    source,
    label: label ?? null,
  })
  if (error) console.warn('[xp:award]', error.message)
}

export async function getUserXP(userId: string) {
  if (!isBackendEnabled()) return null
  const { data, error } = await requireSupabase()
    .from('user_xp_totals')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return null
  return data
}

export async function getStreak(userId: string) {
  if (!isBackendEnabled()) return null
  const { data, error } = await requireSupabase()
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return null
  return data
}

export async function upsertStreak(userId: string, currentStreak: number, longestStreak: number) {
  if (!isBackendEnabled()) return
  const { error } = await requireSupabase().from('streaks').upsert({
    user_id: userId,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_activity_date: new Date().toISOString().slice(0, 10),
  }, { onConflict: 'user_id' })
  if (error) console.warn('[xp:upsertStreak]', error.message)
}

export async function grantAchievement(
  userId: string,
  badgeId: string,
  badgeName: string,
  badgeIcon?: string
): Promise<boolean> {
  if (!isBackendEnabled()) return false
  const { error } = await requireSupabase().from('achievements').insert({
    user_id: userId,
    badge_id: badgeId,
    badge_name: badgeName,
    badge_icon: badgeIcon ?? null,
  })
  if (error) {
    if (!error.message.includes('duplicate') && !error.message.includes('unique')) {
      console.warn('[xp:grantAchievement]', error.message)
    }
    return false
  }
  return true
}

export async function getAchievements(userId: string) {
  if (!isBackendEnabled()) return []
  const { data, error } = await requireSupabase()
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
  if (error) return []
  return data
}
