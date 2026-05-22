// Notes service — Phase 1 placeholder
// All functions currently read/write localStorage.
// Supabase queries will replace localStorage calls in a later phase.

import type { SavedNote } from '../../types/database'

const LS_KEY = 'dem-topic-notes'

function lsGet(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function lsSet(data: Record<string, string>): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data))
  } catch {}
}

// Get a single note by topic ID
export async function getNote(
  _userId: string | null,
  topicId: string
): Promise<string> {
  const notes = lsGet()
  return notes[topicId] ?? ''
}

// Save a note for a topic (debounced callers are responsible for rate-limiting)
export async function saveNote(
  _userId: string | null,
  topicId: string,
  content: string
): Promise<SavedNote> {
  const notes = lsGet()
  notes[topicId] = content
  lsSet(notes)

  return {
    topicId,
    content,
    updatedAt: new Date().toISOString(),
  }
}

// Get all notes for a user
export async function getAllNotes(
  _userId: string | null
): Promise<SavedNote[]> {
  const notes = lsGet()
  return Object.entries(notes).map(([topicId, content]) => ({
    topicId,
    content,
    updatedAt: new Date().toISOString(),
  }))
}

// Delete a note
export async function deleteNote(
  _userId: string | null,
  topicId: string
): Promise<void> {
  const notes = lsGet()
  delete notes[topicId]
  lsSet(notes)
}
