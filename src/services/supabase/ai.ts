// AI service facade — exposes clean methods for all AI copilot features.
// Uses provider abstraction (mock → OpenAI) with conversation persistence in Supabase.

import { isAIEnabled, env } from '../../config/env'
import { isBackendEnabled } from '../../config/env'
import { requireSupabase } from './client'
import type { AIContext } from '../../types/database.types'

// ─── Prompt templates (system prompts per context) ────────────────────────────

const SYSTEM_PROMPTS: Record<string, string> = {
  sql_explain: `You are a senior data engineer. Explain the SQL query clearly and concisely.
Focus on what it does, any joins or aggregations, and performance considerations.`,

  interview_help: `You are an expert data engineering interviewer and coach.
Provide structured answers with: definition, real-world example, and trade-offs.
What strong candidates mention vs weak candidates.`,

  incident_rca: `You are a senior SRE conducting root cause analysis.
Structure your response: What Failed → Why → Business Impact → Remediation Steps → Prevention.`,

  spark_explain: `You are an Apache Spark expert. Explain the PySpark code covering:
what transformations are used, which trigger shuffles, and any optimization opportunities.`,

  architecture_review: `You are a data platform architect. Review the described architecture for:
scalability, reliability, cost efficiency, and best practices. Be specific and actionable.`,

  topic_summary: `You are a data engineering instructor. Summarize key concepts a practicing
engineer should remember — focus on practical application, not theory.`,

  general: `You are a knowledgeable data engineering assistant. Provide accurate,
practical answers grounded in modern data engineering best practices.`,
}

// ─── Mock responses (used when AI is disabled or provider = mock) ─────────────

const MOCK_RESPONSES: Record<string, string> = {
  sql_explain: `This query selects filtered records using a WHERE clause and joins related tables on a shared key column. The GROUP BY applies an aggregation, and the HAVING clause filters the grouped results. Consider adding a composite index on the filter and join columns to improve performance at scale.`,

  interview_help: `Strong candidates address this in three parts: (1) core concept with a clear definition, (2) a real-world scenario where it applies in production, (3) trade-offs and edge cases. For this question specifically, highlight practical experience — interviewers value concrete examples over textbook definitions.`,

  incident_rca: `**Root Cause:** Schema drift in the upstream source table — a new nullable column was added without updating the downstream pipeline mapping.

**Impact:** Pipeline SLA breached by 47 minutes, 3 downstream dashboards stale.

**Resolution:** (1) Updated ADF mapping to include new column, (2) re-ran failed pipeline, (3) validated output schema against contract.

**Prevention:** Implement schema validation at ingestion layer and configure alerts for source schema changes.`,

  spark_explain: `This PySpark job reads the source DataFrame, applies filter() (lazy — no shuffle), then performs groupBy().agg() which triggers a shuffle across partitions. The final collect() brings all results to the driver — for large datasets, replace with write() to a sink instead. Consider using broadcast() for small lookup tables to eliminate shuffle joins.`,

  architecture_review: `The architecture is sound for current scale. Key recommendations: (1) Add a dead-letter queue for failed records to prevent silent data loss, (2) consider Delta Lake or Iceberg for ACID transactions and schema evolution, (3) add data quality checks at each layer boundary (Bronze → Silver → Gold), (4) ensure compute and storage are separated for independent scaling.`,

  topic_summary: `Key takeaways: understand the core abstraction and when to use it vs alternatives. Know the operational overhead in production. Be able to explain performance characteristics and failure modes. In interviews, demonstrate practical experience with specific examples.`,

  general: `Great question. Modern data engineering typically involves balancing technical constraints (latency, throughput, cost) with organizational factors (team skills, tooling, maintenance burden). The right answer depends on your specific context — here's a structured way to think through it:`,
}

// ─── Core completion function ──────────────────────────────────────────────────

export interface AICompletionOptions {
  context?: string
  maxTokens?: number
}

export async function complete(
  userMessage: string,
  options: AICompletionOptions = {}
): Promise<string> {
  if (!isAIEnabled()) return MOCK_RESPONSES[options.context ?? 'general'] ?? MOCK_RESPONSES.general

  if (env.aiProvider === 'openai' && env.openaiApiKey) {
    return callOpenAI(userMessage, options)
  }

  // Simulate realistic delay for mock
  await new Promise(r => setTimeout(r, 500 + Math.random() * 400))
  return MOCK_RESPONSES[options.context ?? 'general'] ?? MOCK_RESPONSES.general
}

async function callOpenAI(userMessage: string, options: AICompletionOptions): Promise<string> {
  const systemPrompt = SYSTEM_PROMPTS[options.context ?? 'general'] ?? SYSTEM_PROMPTS.general
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: options.maxTokens ?? 1024,
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${res.statusText}`)
  const data = await res.json()
  return data.choices[0]?.message?.content ?? ''
}

// ─── Streaming completion ─────────────────────────────────────────────────────

export async function* stream(
  userMessage: string,
  options: AICompletionOptions = {}
): AsyncIterable<string> {
  if (!isAIEnabled() || env.aiProvider !== 'openai') {
    const content = await complete(userMessage, options)
    const words = content.split(' ')
    for (const word of words) {
      await new Promise(r => setTimeout(r, 25))
      yield word + ' '
    }
    return
  }

  const systemPrompt = SYSTEM_PROMPTS[options.context ?? 'general'] ?? SYSTEM_PROMPTS.general
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.openaiApiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: true,
      max_tokens: options.maxTokens ?? 1024,
    }),
  })

  if (!res.ok) throw new Error(`OpenAI stream ${res.status}`)

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    for (const line of decoder.decode(value).split('\n')) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (raw === '[DONE]') return
      try {
        const delta = JSON.parse(raw)?.choices?.[0]?.delta?.content ?? ''
        if (delta) yield delta
      } catch {}
    }
  }
}

// ─── Domain-specific helpers ──────────────────────────────────────────────────

export const explainSQL = (query: string, error?: string) =>
  complete(error ? `Explain this SQL and the error:\n\nSQL:\n${query}\n\nError: ${error}` : `Explain this SQL:\n${query}`,
    { context: 'sql_explain' })

export const helpInterview = (question: string, category: string) =>
  complete(`Data engineering interview question (${category}):\n\n"${question}"\n\nHow should I answer this?`,
    { context: 'interview_help' })

export const generateRCA = (description: string, steps: string[]) =>
  complete(`Write an RCA for this incident:\n\n${description}\n\nSteps taken:\n${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
    { context: 'incident_rca' })

export const explainSpark = (code: string) =>
  complete(`Explain this PySpark code:\n\n${code}`, { context: 'spark_explain' })

export const reviewArchitecture = (description: string) =>
  complete(`Review this data architecture:\n\n${description}`, { context: 'architecture_review' })

export const summarizeTopic = (topicId: string, sectionTitle: string) =>
  complete(`Summarize key concepts from "${sectionTitle}" in the ${topicId} topic for a practicing data engineer.`,
    { context: 'topic_summary' })

// ─── Conversation persistence (when backend is enabled) ───────────────────────

export async function saveConversation(
  userId: string | null,
  context: AIContext,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  if (!isBackendEnabled() || !userId) return

  const sb = requireSupabase()
  const { data: thread, error: threadErr } = await sb
    .from('ai_threads')
    .insert({ user_id: userId, context, title: userMessage.slice(0, 60) })
    .select('id').single()
  if (threadErr || !thread) return

  await sb.from('ai_messages').insert([
    { thread_id: thread.id, role: 'user', content: userMessage },
    { thread_id: thread.id, role: 'assistant', content: assistantResponse },
  ])
}

export async function getConversationHistory(userId: string | null, context?: AIContext) {
  if (!isBackendEnabled() || !userId) return []
  let q = requireSupabase().from('ai_threads').select('*, ai_messages(*)').eq('user_id', userId)
  if (context) q = q.eq('context', context)
  const { data } = await q.order('updated_at', { ascending: false }).limit(20)
  return data ?? []
}
