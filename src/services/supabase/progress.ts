// Progress service — routes learning progress and section completions to
// localStorage (fallback) or Supabase (when backend is enabled).

import { requireSupabase } from './client'
import { isBackendEnabled } from '../../config/env'
import type {
  LearningProgress,
  TopicCompletion,
  ProgressStatus,
  InsertLearningProgress,
  InsertTopicCompletion,
} from '../../types/database'

const LS_PROGRESS_KEY    = 'dem-learning-progress'
const LS_COMPLETIONS_KEY = 'dem-topic-completions'

function lsGet<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

// ─── Learning progress ────────────────────────────────────────────────────────

export async function getLearningProgress(
  userId: string | null,
  topicId: string,
  moduleId: string
): Promise<LearningProgress | null> {
  const lsKey = `${topicId}::${moduleId}`

  if (!isBackendEnabled() || !userId) {
    const all = lsGet<Record<string, LearningProgress>>(LS_PROGRESS_KEY, {})
    return all[lsKey] ?? null
  }

  const { data, error } = await requireSupabase()
    .from('learning_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .eq('module_id', moduleId)
    .maybeSingle()

  if (error) return null
  return data
}

export async function upsertLearningProgress(
  userId: string | null,
  topicId: string,
  moduleId: string,
  progressPercent: number,
  status: ProgressStatus,
  lastOpenedSection?: string
): Promise<void> {
  const lsKey = `${topicId}::${moduleId}`
  const now = new Date().toISOString()
  const localRecord: LearningProgress = {
    id: lsKey,
    user_id: userId ?? 'local',
    topic_id: topicId,
    module_id: moduleId,
    progress_percent: progressPercent,
    status,
    last_opened_section: lastOpenedSection ?? null,
    updated_at: now,
  }

  // Always write to localStorage first
  const all = lsGet<Record<string, LearningProgress>>(LS_PROGRESS_KEY, {})
  all[lsKey] = localRecord
  lsSet(LS_PROGRESS_KEY, all)

  if (!isBackendEnabled() || !userId) return

  const payload: InsertLearningProgress = {
    user_id: userId,
    topic_id: topicId,
    module_id: moduleId,
    progress_percent: progressPercent,
    status,
    last_opened_section: lastOpenedSection ?? null,
  }
  const { error } = await requireSupabase()
    .from('learning_progress')
    .upsert(payload, { onConflict: 'user_id,topic_id,module_id' })

  if (error) console.warn('[progress:upsert]', error.message)
}

export async function getAllLearningProgress(userId: string | null): Promise<LearningProgress[]> {
  if (!isBackendEnabled() || !userId) {
    const all = lsGet<Record<string, LearningProgress>>(LS_PROGRESS_KEY, {})
    return Object.values(all)
  }
  const { data, error } = await requireSupabase()
    .from('learning_progress')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) return []
  return data
}

// ─── Topic section completions ────────────────────────────────────────────────

export async function markTopicSectionComplete(
  userId: string | null,
  topicId: string,
  sectionId: string
): Promise<void> {
  const lsKey = `${topicId}::${sectionId}`
  const completions = lsGet<Record<string, string>>(LS_COMPLETIONS_KEY, {})
  if (!completions[lsKey]) {
    completions[lsKey] = new Date().toISOString()
    lsSet(LS_COMPLETIONS_KEY, completions)
  }

  if (!isBackendEnabled() || !userId) return

  const payload: InsertTopicCompletion = { user_id: userId, topic_id: topicId, section_id: sectionId }
  const { error } = await requireSupabase()
    .from('topic_completion')
    .insert(payload)

  // Unique constraint means duplicate inserts are silently ignored at DB level;
  // treat unique-violation as success.
  if (error && !error.message.includes('unique') && !error.message.includes('duplicate')) {
    console.warn('[progress:markComplete]', error.message)
  }
}

export async function getTopicCompletions(
  userId: string | null,
  topicId?: string
): Promise<TopicCompletion[]> {
  if (!isBackendEnabled() || !userId) {
    const completions = lsGet<Record<string, string>>(LS_COMPLETIONS_KEY, {})
    return Object.entries(completions)
      .filter(([key]) => !topicId || key.startsWith(`${topicId}::`))
      .map(([key, completed_at]) => {
        const [tid, sid] = key.split('::')
        return { id: key, user_id: userId ?? 'local', topic_id: tid, section_id: sid, completed_at }
      })
  }

  let q = requireSupabase()
    .from('topic_completion')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })

  if (topicId) q = q.eq('topic_id', topicId)

  const { data, error } = await q
  if (error) return []
  return data
}

export async function getOverallProgress(userId: string | null) {
  const all = await getAllLearningProgress(userId)
  const completions = await getTopicCompletions(userId)

  const completedTopics  = all.filter(p => p.status === 'completed').length
  const inProgressTopics = all.filter(p => p.status === 'in_progress').length
  const totalSections    = completions.length

  return { completedTopics, inProgressTopics, totalSections, allProgress: all }
}
