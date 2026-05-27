// XP + achievements service — wraps xp_history and achievements Supabase tables.
// Falls back to localStorage when backend is not configured.

import { requireSupabase } from './client'
import { isBackendEnabled } from '../../config/env'
import type { XPHistory, XPSourceType, Achievement, UserXPSummary, InsertXPHistory, InsertAchievement } from '../../types/database'

const LS_XP_KEY           = 'dem-xp-history'
const LS_ACHIEVEMENTS_KEY = 'dem-achievements'

function lsGet<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

function normalizeAchievementLocal(value: unknown): (InsertAchievement & { unlocked_at: string })[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is InsertAchievement & { unlocked_at: string } => !!item && typeof item === 'object' && 'achievement_key' in item)
      .map(item => ({
        ...item,
        unlocked_at: item.unlocked_at ?? new Date().toISOString(),
      }));
  }
  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>).map(([achievement_key, unlocked_at]) => ({
      user_id: 'local',
      achievement_key,
      title: achievement_key,
      unlocked_at: typeof unlocked_at === 'string' ? unlocked_at : new Date().toISOString(),
    }));
  }
  return [];
}

// ─── XP ──────────────────────────────────────────────────────────────────────

export async function awardXP(
  userId: string,
  xpAmount: number,
  sourceType: XPSourceType,
  action: string,
  sourceId?: string
): Promise<void> {
  const entry = { user_id: userId, action, xp_amount: xpAmount, source_type: sourceType, source_id: sourceId ?? null }

  // Mirror to localStorage for instant UI updates
  const local = lsGet<InsertXPHistory[]>(LS_XP_KEY, [])
  lsSet(LS_XP_KEY, [{ ...entry, created_at: new Date().toISOString() }, ...local].slice(0, 500))

  if (!isBackendEnabled()) return

  await requireSupabase().from('xp_history').insert(entry)
}

export async function getUserXPSummary(userId: string): Promise<UserXPSummary | null> {
  if (!isBackendEnabled()) {
    const local = lsGet<(InsertXPHistory & { created_at: string })[]>(LS_XP_KEY, [])
    const mine = local.filter(r => r.user_id === userId)
    const total = mine.reduce((sum, r) => sum + r.xp_amount, 0)
    return { user_id: userId, total_xp: total, level: Math.floor(total / 500) + 1, xp_in_level: total % 500 }
  }
  const { data, error } = await requireSupabase()
    .from('user_xp_summary')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) return null
  return data
}

export async function getXPHistory(userId: string, limit = 50): Promise<XPHistory[]> {
  if (!isBackendEnabled()) {
    const local = lsGet<XPHistory[]>(LS_XP_KEY, [])
    return local.filter(r => r.user_id === userId).slice(0, limit)
  }
  const { data, error } = await requireSupabase()
    .from('xp_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data
}

// ─── Achievements ─────────────────────────────────────────────────────────────

export async function grantAchievement(
  userId: string,
  achievementKey: string,
  title: string
): Promise<boolean> {
  const entry: InsertAchievement = { user_id: userId, achievement_key: achievementKey, title }

  const local = normalizeAchievementLocal(lsGet(LS_ACHIEVEMENTS_KEY, []))
  const alreadyLocal = local.some(a => a.user_id === userId && a.achievement_key === achievementKey)
  if (!alreadyLocal) {
    lsSet(LS_ACHIEVEMENTS_KEY, [{ ...entry, unlocked_at: new Date().toISOString() }, ...local])
  }

  if (!isBackendEnabled()) return !alreadyLocal

  const { error } = await requireSupabase().from('achievements').insert(entry)
  if (error) {
    // code 23505 = unique_violation — duplicate badge silently ignored per schema design
    if (error.code === '23505') return false
    return false
  }
  return true
}

export async function getAchievements(userId: string): Promise<Achievement[]> {
  if (!isBackendEnabled()) {
    const local = normalizeAchievementLocal(lsGet(LS_ACHIEVEMENTS_KEY, []))
    return local.filter(a => a.user_id === userId || a.user_id === 'local')
  }
  const { data, error } = await requireSupabase()
    .from('achievements')
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })
  if (error) return []
  return data
}
