import { supabase } from '../supabase'
import type { SQLAttempt, SavedQuery } from '../../types/database.types'

export async function recordSQLAttempt(attempt: SQLAttempt['Insert']) {
  const { data, error } = await supabase
    .from('sql_attempts')
    .insert(attempt)
    .select().single()
  if (error) throw error
  return data as SQLAttempt
}

export async function getSQLHistory(userId: string, challengeId?: string, limit = 50) {
  let query = supabase
    .from('sql_attempts')
    .select('*')
    .eq('user_id', userId)
    .order('attempted_at', { ascending: false })
    .limit(limit)

  if (challengeId) query = query.eq('challenge_id', challengeId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getBestAttempts(userId: string) {
  const { data, error } = await supabase
    .from('sql_best_attempts')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function saveQuery(userId: string, name: string, query: string, description?: string, tags?: string[]) {
  const { data, error } = await supabase
    .from('saved_queries')
    .insert({ user_id: userId, name, query, description: description ?? null, tags: tags ?? [] })
    .select().single()
  if (error) throw error
  return data as SavedQuery
}

export async function getSavedQueries(userId: string) {
  const { data, error } = await supabase
    .from('saved_queries')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  if (error) throw error
  return data
}

export async function deleteSavedQuery(userId: string, queryId: string) {
  const { error } = await supabase
    .from('saved_queries')
    .delete()
    .eq('id', queryId)
    .eq('user_id', userId)
  if (error) throw error
}
