import { requireSupabase } from './client'
import { isBackendEnabled } from '../../config/env'

export function normalizeProgressSnapshot(snapshot = {}) {
  const toBoolMap = value => {
    const out = {}
    for (const [key, val] of Object.entries(value && typeof value === 'object' ? value : {})) {
      if (val) out[key] = true
    }
    return out
  }

  const toStringMap = value => {
    const out = {}
    for (const [key, val] of Object.entries(value && typeof value === 'object' ? value : {})) {
      if (typeof val === 'string' && val) out[key] = val
    }
    return out
  }

  const toNumberMap = value => {
    const out = {}
    for (const [key, val] of Object.entries(value && typeof value === 'object' ? value : {})) {
      const num = Number(val)
      if (!Number.isNaN(num)) out[key] = num
    }
    return out
  }

  return {
    completedTopics: toBoolMap(snapshot.completedTopics),
    completedProjects: toStringMap(snapshot.completedProjects),
    achievements: toStringMap(snapshot.achievements),
    practiceProgress: toBoolMap(snapshot.practiceProgress),
    interviewLearned: toBoolMap(snapshot.interviewLearned),
    xp: Math.max(0, Number(snapshot.xp ?? 0) || 0),
    streakCount: Math.max(0, Number(snapshot.streakCount ?? 0) || 0),
    streakLastDate: typeof snapshot.streakLastDate === 'string' ? snapshot.streakLastDate : '',
    incidentsResolved: Math.max(0, Number(snapshot.incidentsResolved ?? 0) || 0),
    interviewReadiness: Math.max(0, Math.min(100, Number(snapshot.interviewReadiness ?? 0) || 0)),
    roleReadiness: toNumberMap(snapshot.roleReadiness),
    unlockedTracks: Array.isArray(snapshot.unlockedTracks)
      ? [...new Set(snapshot.unlockedTracks.filter(Boolean))]
      : [],
    updatedAt: typeof snapshot.updatedAt === 'string' ? snapshot.updatedAt : new Date().toISOString(),
  }
}

export function mergeProgressSnapshots(localSnapshot, remoteSnapshot) {
  const local = normalizeProgressSnapshot(localSnapshot)
  const remote = normalizeProgressSnapshot(remoteSnapshot)

  const mergedNumberMap = { ...remote.roleReadiness }
  for (const [key, value] of Object.entries(local.roleReadiness)) {
    mergedNumberMap[key] = Math.max(mergedNumberMap[key] ?? 0, value)
  }

  const merged = {
    completedTopics: { ...remote.completedTopics, ...local.completedTopics },
    completedProjects: { ...remote.completedProjects, ...local.completedProjects },
    achievements: { ...remote.achievements, ...local.achievements },
    practiceProgress: { ...remote.practiceProgress, ...local.practiceProgress },
    interviewLearned: { ...remote.interviewLearned, ...local.interviewLearned },
    xp: Math.max(local.xp, remote.xp),
    streakCount: Math.max(local.streakCount, remote.streakCount),
    streakLastDate: local.streakLastDate || remote.streakLastDate,
    incidentsResolved: Math.max(local.incidentsResolved, remote.incidentsResolved),
    interviewReadiness: Math.max(local.interviewReadiness, remote.interviewReadiness),
    roleReadiness: mergedNumberMap,
    unlockedTracks: [...new Set([...(remote.unlockedTracks ?? []), ...(local.unlockedTracks ?? [])])],
    updatedAt: new Date().toISOString(),
  }

  return normalizeProgressSnapshot(merged)
}

export async function loadUserProgress(userId) {
  if (!isBackendEnabled() || !userId) return null
  const { data, error } = await requireSupabase()
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) return null
  return normalizeProgressSnapshot(data.progress_json ?? {})
}

export async function saveUserProgress(userId, snapshot) {
  if (!isBackendEnabled() || !userId) return
  const payload = {
    user_id: userId,
    progress_json: normalizeProgressSnapshot(snapshot),
  }

  const { error } = await requireSupabase()
    .from('user_progress')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) throw new Error(error.message)
}
