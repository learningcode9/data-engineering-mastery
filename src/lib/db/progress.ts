import { supabase } from '../supabase'
import type { TopicProgress, Note } from '../../types/database.types'

// ─── Topic Progress ───────────────────────────────────────────────────────────

export async function getTopicProgress(userId: string, topicId: string) {
  const { data, error } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
  if (error) throw error
  return data
}

export async function getAllProgress(userId: string) {
  const { data, error } = await supabase
    .from('topic_progress')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function getTopicSummaries(userId: string) {
  const { data, error } = await supabase
    .from('topic_completion_summary')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function markSectionComplete(
  userId: string,
  topicId: string,
  sectionId: string,
  timeSpentSec = 0
) {
  const { data, error } = await supabase
    .from('topic_progress')
    .upsert({
      user_id: userId,
      topic_id: topicId,
      section_id: sectionId,
      completed: true,
      completed_at: new Date().toISOString(),
      time_spent_sec: timeSpentSec,
    }, { onConflict: 'user_id,topic_id,section_id' })
    .select()
    .single()
  if (error) throw error
  return data as TopicProgress
}

export async function updateTimeSpent(
  userId: string,
  topicId: string,
  sectionId: string,
  additionalSec: number
) {
  // Increment time_spent_sec without a full upsert
  const { error } = await supabase.rpc('increment_time_spent', {
    p_user_id: userId,
    p_topic_id: topicId,
    p_section_id: sectionId,
    p_seconds: additionalSec,
  })
  if (error) throw error
}

// ─── Notes ───────────────────────────────────────────────────────────────────

export async function getNote(userId: string, topicId: string, sectionId: string) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .eq('section_id', sectionId)
    .maybeSingle()
  if (error) throw error
  return data as Note | null
}

export async function saveNote(
  userId: string,
  topicId: string,
  sectionId: string,
  content: string
) {
  const { data, error } = await supabase
    .from('notes')
    .upsert({
      user_id: userId,
      topic_id: topicId,
      section_id: sectionId,
      content,
    }, { onConflict: 'user_id,topic_id,section_id' })
    .select()
    .single()
  if (error) throw error
  return data as Note
}

export async function getAllNotes(userId: string) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}
