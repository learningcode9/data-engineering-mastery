import { supabase } from '../supabase'
import type { AIThread, AIMessage, AIContext } from '../../types/database.types'

export async function createThread(
  userId: string,
  context: AIContext,
  title?: string,
  metadata?: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from('ai_threads')
    .insert({
      user_id: userId,
      context,
      title: title ?? null,
      metadata: metadata ?? {},
    })
    .select().single()
  if (error) throw error
  return data as AIThread
}

export async function getThreads(userId: string, context?: AIContext) {
  let query = supabase
    .from('ai_threads')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (context) query = query.eq('context', context)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getMessages(threadId: string) {
  const { data, error } = await supabase
    .from('ai_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as AIMessage[]
}

export async function appendMessage(
  threadId: string,
  role: AIMessage['role'],
  content: string,
  model?: string,
  tokensUsed?: number
) {
  const { data, error } = await supabase
    .from('ai_messages')
    .insert({ thread_id: threadId, role, content, model: model ?? null, tokens_used: tokensUsed ?? null })
    .select().single()
  if (error) throw error
  return data as AIMessage
}

export async function deleteThread(userId: string, threadId: string) {
  const { error } = await supabase
    .from('ai_threads')
    .delete()
    .eq('id', threadId)
    .eq('user_id', userId)
  if (error) throw error
}
