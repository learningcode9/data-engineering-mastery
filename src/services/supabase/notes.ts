// Notes service — persists topic notes to localStorage or Supabase.
// One note per user per (topic_id, section_id) — upserted on every save.

import { requireSupabase } from './client'
import { isBackendEnabled } from '../../config/env'
import type { SavedNote, InsertSavedNote } from '../../types/database'

const LS_KEY = 'dem-saved-notes'

function lsGet(): Record<string, { content: string; updated_at: string }> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') } catch { return {} }
}
function lsSet(data: Record<string, { content: string; updated_at: string }>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
}
function noteKey(topicId: string, sectionId: string) { return `${topicId}::${sectionId}` }

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getNotes(
  userId: string | null,
  topicId?: string
): Promise<SavedNote[]> {
  if (!isBackendEnabled() || !userId) {
    const all = lsGet()
    return Object.entries(all)
      .filter(([key]) => !topicId || key.startsWith(`${topicId}::`))
      .map(([key, { content, updated_at }]) => {
        const [tid, sid] = key.split('::')
        return { id: key, user_id: userId ?? 'local', topic_id: tid, section_id: sid, content, updated_at }
      })
  }

  let q = requireSupabase()
    .from('saved_notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (topicId) q = q.eq('topic_id', topicId)

  const { data, error } = await q
  if (error) return []
  return data
}

export async function getNote(
  userId: string | null,
  topicId: string,
  sectionId: string
): Promise<string> {
  const key = noteKey(topicId, sectionId)

  if (!isBackendEnabled() || !userId) {
    return lsGet()[key]?.content ?? ''
  }

  const { data, error } = await requireSupabase()
    .from('saved_notes')
    .select('content')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .eq('section_id', sectionId)
    .maybeSingle()

  if (error) return lsGet()[key]?.content ?? ''
  return data?.content ?? ''
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function saveNote(
  userId: string | null,
  topicId: string,
  sectionId: string,
  content: string
): Promise<void> {
  const key = noteKey(topicId, sectionId)
  const now = new Date().toISOString()

  // Always write to localStorage first for instant persistence
  const all = lsGet()
  all[key] = { content, updated_at: now }
  lsSet(all)

  if (!isBackendEnabled() || !userId) return

  const payload: InsertSavedNote = { user_id: userId, topic_id: topicId, section_id: sectionId, content }
  const { error } = await requireSupabase()
    .from('saved_notes')
    .upsert(payload, { onConflict: 'user_id,topic_id,section_id' })

  if (error) console.warn('[notes:save]', error.message)
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteNote(
  userId: string | null,
  topicId: string,
  sectionId: string
): Promise<void> {
  const key = noteKey(topicId, sectionId)
  const all = lsGet()
  delete all[key]
  lsSet(all)

  if (!isBackendEnabled() || !userId) return

  const { error } = await requireSupabase()
    .from('saved_notes')
    .delete()
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .eq('section_id', sectionId)

  if (error) console.warn('[notes:delete]', error.message)
}
