// Progress service — routes to localStorage (current) OR Supabase based on feature flag.
// This is the bridge layer: existing hooks call these functions transparently.

import { requireSupabase } from './client'
import { isBackendEnabled } from '../../config/env'
import type { TopicProgress, Note } from '../../types/database.types'

// ─── localStorage fallbacks (existing behavior) ───────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback } catch { return fallback }
}

function lsSet(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

// ─── Topic Progress ───────────────────────────────────────────────────────────

export async function markSectionComplete(
  userId: string | null,
  topicId: string,
  sectionId: string,
  timeSpentSec = 0
): Promise<void> {
  const key = `dem-section-${topicId}-${sectionId}`

  if (!isBackendEnabled() || !userId) {
    lsSet(key, { completed: true, completedAt: new Date().toISOString(), timeSpentSec })
    return
  }

  const sb = requireSupabase()
  const { error } = await sb.from('topic_progress').upsert({
    user_id: userId,
    topic_id: topicId,
    section_id: sectionId,
    completed: true,
    completed_at: new Date().toISOString(),
    time_spent_sec: timeSpentSec,
  }, { onConflict: 'user_id,topic_id,section_id' })
  if (error) throw new Error(error.message)

  // Mirror to localStorage so UI stays snappy (optimistic cache)
  lsSet(key, { completed: true, completedAt: new Date().toISOString(), timeSpentSec })
}

export async function getAllProgress(userId: string | null): Promise<Record<string, boolean>> {
  if (!isBackendEnabled() || !userId) {
    // Reconstruct from scattered localStorage keys
    const result: Record<string, boolean> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k?.startsWith('dem-section-')) continue
      const val = lsGet<{ completed: boolean }>(k, { completed: false })
      if (val.completed) result[k.replace('dem-section-', '')] = true
    }
    return result
  }

  const sb = requireSupabase()
  const { data, error } = await sb
    .from('topic_progress')
    .select('topic_id,section_id,completed')
    .eq('user_id', userId)
    .eq('completed', true)
  if (error) throw new Error(error.message)

  return Object.fromEntries(data.map(r => [`${r.topic_id}-${r.section_id}`, true]))
}

export async function getTopicSummaries(userId: string | null) {
  if (!isBackendEnabled() || !userId) return null

  const { data, error } = await requireSupabase()
    .from('topic_completion_summary')
    .select('*')
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
  return data
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export async function saveNote(
  userId: string | null,
  topicId: string,
  sectionId: string,
  content: string
): Promise<void> {
  const key = `dem-note-${topicId}-${sectionId}`
  lsSet(key, content)  // always write to localStorage for instant persistence

  if (!isBackendEnabled() || !userId) return

  const { error } = await requireSupabase().from('notes').upsert({
    user_id: userId,
    topic_id: topicId,
    section_id: sectionId,
    content,
  }, { onConflict: 'user_id,topic_id,section_id' })
  if (error) console.warn('[progress:saveNote]', error.message)
}

export async function getNote(
  userId: string | null,
  topicId: string,
  sectionId: string
): Promise<string> {
  const key = `dem-note-${topicId}-${sectionId}`

  if (!isBackendEnabled() || !userId) {
    return lsGet<string>(key, '')
  }

  const { data, error } = await requireSupabase()
    .from('notes')
    .select('content')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .eq('section_id', sectionId)
    .maybeSingle()

  if (error) return lsGet<string>(key, '')  // fall back to localStorage on error
  return data?.content ?? lsGet<string>(key, '')
}

export async function getAllNotes(userId: string | null): Promise<Note[]> {
  if (!isBackendEnabled() || !userId) return []
  const { data, error } = await requireSupabase()
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) return []
  return data
}

// ─── Practice completions ─────────────────────────────────────────────────────

export async function markPracticeComplete(
  userId: string | null,
  topicId: string,
  taskId: string
): Promise<void> {
  if (!isBackendEnabled() || !userId) return

  const { error } = await requireSupabase().from('practice_completions').insert({
    user_id: userId,
    topic_id: topicId,
    task_id: taskId,
  }).onConflict('user_id,topic_id,task_id').ignore()
  if (error) console.warn('[progress:markPracticeComplete]', error.message)
}
