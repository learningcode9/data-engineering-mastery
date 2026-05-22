import { supabase } from '../supabase'
import type { InterviewSession, InterviewMode, MasteryStatus } from '../../types/database.types'

export async function createInterviewSession(
  userId: string,
  mode: InterviewMode,
  category: string | null,
  totalQuestions: number
) {
  const { data, error } = await supabase
    .from('interview_sessions')
    .insert({ user_id: userId, mode, category, total_q: totalQuestions })
    .select().single()
  if (error) throw error
  return data as InterviewSession
}

export async function updateInterviewSession(
  sessionId: string,
  updates: InterviewSession['Update']
) {
  const { data, error } = await supabase
    .from('interview_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select().single()
  if (error) throw error
  return data as InterviewSession
}

export async function recordAnswer(
  sessionId: string,
  questionId: string,
  questionText: string,
  category: string | null,
  userAnswer: string,
  isCorrect: boolean,
  confidence: number,
  timeTakenSec: number
) {
  const { error } = await supabase.from('interview_answers').insert({
    session_id: sessionId,
    question_id: questionId,
    question_text: questionText,
    category,
    user_answer: userAnswer,
    is_correct: isCorrect,
    confidence,
    time_taken_sec: timeTakenSec,
  })
  if (error) throw error
}

export async function upsertQuestionMastery(
  userId: string,
  questionId: string,
  isCorrect: boolean
) {
  const { data: existing } = await supabase
    .from('question_mastery')
    .select('*')
    .eq('user_id', userId)
    .eq('question_id', questionId)
    .maybeSingle()

  const attempts = (existing?.attempts ?? 0) + 1
  const streak = isCorrect ? (existing?.correct_streak ?? 0) + 1 : 0

  let status: MasteryStatus = 'learning'
  if (streak >= 5) status = 'mastered'
  else if (streak >= 3) status = 'reviewing'

  const { error } = await supabase
    .from('question_mastery')
    .upsert({
      user_id: userId,
      question_id: questionId,
      status,
      attempts,
      correct_streak: streak,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'user_id,question_id' })
  if (error) throw error
}

export async function getQuestionMastery(userId: string) {
  const { data, error } = await supabase
    .from('question_mastery')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function getInterviewHistory(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
