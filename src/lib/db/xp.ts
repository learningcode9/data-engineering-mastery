import { supabase } from '../supabase'
import type { XPSource } from '../../types/database.types'

export async function getUserXP(userId: string) {
  const { data, error } = await supabase
    .from('user_xp_totals')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data ?? { user_id: userId, total_xp: 0, level: 0, xp_in_current_level: 0 }
}

export async function awardXP(
  userId: string,
  amount: number,
  source: XPSource,
  label?: string,
  sourceId?: string
) {
  const { data, error } = await supabase
    .from('xp_ledger')
    .insert({ user_id: userId, amount, source, label: label ?? null, source_id: sourceId ?? null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getXPHistory(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('xp_ledger')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getStreak(userId: string) {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function updateStreak(userId: string) {
  const today = new Date().toISOString().slice(0, 10)

  const existing = await getStreak(userId)

  if (!existing) {
    const { data, error } = await supabase
      .from('streaks')
      .insert({ user_id: userId, current_streak: 1, longest_streak: 1, last_activity_date: today })
      .select().single()
    if (error) throw error
    return data
  }

  const lastDate = existing.last_activity_date
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  let newStreak = 1
  if (lastDate === today) return existing          // already updated today
  if (lastDate === yesterday) newStreak = existing.current_streak + 1

  const { data, error } = await supabase
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, existing.longest_streak),
      last_activity_date: today,
    })
    .eq('user_id', userId)
    .select().single()
  if (error) throw error
  return data
}

export async function getAchievements(userId: string) {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false })
  if (error) throw error
  return data
}

export async function grantAchievement(
  userId: string,
  badgeId: string,
  badgeName: string,
  badgeIcon?: string
) {
  const { data, error } = await supabase
    .from('achievements')
    .insert({ user_id: userId, badge_id: badgeId, badge_name: badgeName, badge_icon: badgeIcon ?? null })
    .select().single()
  // Ignore duplicate (already earned)
  if (error && !error.message.includes('duplicate')) throw error
  return data
}
