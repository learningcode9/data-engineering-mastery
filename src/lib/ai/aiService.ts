import type { AIProvider, AIRequest, AIResponse, AIStreamChunk, AIRequestContext } from './aiTypes'
import { mockProvider } from './providers/mockProvider'
import { openaiProvider } from './providers/openaiProvider'
import { appendMessage, createThread, getMessages } from '../db/ai'
import type { AIContext } from '../../types/database.types'

// Switch provider based on environment
function getProvider(): AIProvider {
  const useReal = import.meta.env.VITE_AI_PROVIDER === 'openai' && import.meta.env.VITE_OPENAI_API_KEY
  return useReal ? openaiProvider : mockProvider
}

const provider = getProvider()

// ─── Core completion (no persistence) ────────────────────────────────────────

export async function complete(
  messages: AIRequest['messages'],
  context: AIRequestContext,
  options?: { maxTokens?: number }
): Promise<AIResponse> {
  return provider.complete({ messages, context, ...options })
}

export async function* stream(
  messages: AIRequest['messages'],
  context: AIRequestContext,
  options?: { maxTokens?: number }
): AsyncIterable<AIStreamChunk> {
  if (!provider.stream) {
    const res = await provider.complete({ messages, context, ...options })
    yield { delta: res.content, done: true }
    return
  }
  yield* provider.stream({ messages, context, ...options })
}

// ─── Persisted conversation helpers ──────────────────────────────────────────

export async function explainSQL(userId: string, query: string, error?: string) {
  const thread = await createThread(userId, 'sql_explain', `SQL: ${query.slice(0, 50)}...`)
  const userMsg = error
    ? `Explain this SQL query and why it might be causing this error:\n\nQuery:\n${query}\n\nError: ${error}`
    : `Explain this SQL query:\n\n${query}`

  await appendMessage(thread.id, 'user', userMsg)
  const res = await complete(
    [{ role: 'user', content: userMsg }],
    { type: 'sql_explain', query, error }
  )
  await appendMessage(thread.id, 'assistant', res.content, res.model, res.tokensUsed)
  return { thread, response: res.content }
}

export async function generateInterviewHelp(userId: string, question: string, category: string) {
  const thread = await createThread(userId, 'interview_help', `Q: ${question.slice(0, 60)}...`)
  const userMsg = `Help me answer this data engineering interview question:\n\n"${question}"\n\nCategory: ${category}`

  await appendMessage(thread.id, 'user', userMsg)
  const res = await complete(
    [{ role: 'user', content: userMsg }],
    { type: 'interview_help', question, category }
  )
  await appendMessage(thread.id, 'assistant', res.content, res.model, res.tokensUsed)
  return { thread, response: res.content }
}

export async function generateRCA(
  userId: string,
  incidentDescription: string,
  stepsTaken: string[]
) {
  const thread = await createThread(userId, 'incident_rca', 'Incident RCA')
  const userMsg = `Generate a root cause analysis for this incident:\n\n${incidentDescription}\n\nSteps taken:\n${stepsTaken.map((s, i) => `${i + 1}. ${s}`).join('\n')}`

  await appendMessage(thread.id, 'user', userMsg)
  const res = await complete(
    [{ role: 'user', content: userMsg }],
    { type: 'incident_rca', incidentDescription, stepsToken: stepsTaken }
  )
  await appendMessage(thread.id, 'assistant', res.content, res.model, res.tokensUsed)
  return { thread, response: res.content }
}

export async function summarizeTopic(userId: string, topicId: string, sectionTitle: string) {
  const thread = await createThread(userId, 'topic_summary', `Summary: ${sectionTitle}`)
  const userMsg = `Summarize the key concepts from "${sectionTitle}" in the ${topicId} topic for a practicing data engineer.`

  await appendMessage(thread.id, 'user', userMsg)
  const res = await complete(
    [{ role: 'user', content: userMsg }],
    { type: 'topic_summary', topicId, sectionTitle }
  )
  await appendMessage(thread.id, 'assistant', res.content, res.model, res.tokensUsed)
  return { thread, response: res.content }
}

export { provider as activeProvider }
