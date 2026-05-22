export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIRequest {
  messages: AIMessage[]
  context: AIRequestContext
  stream?: boolean
  maxTokens?: number
}

export type AIRequestContext =
  | { type: 'sql_explain'; query: string; error?: string }
  | { type: 'interview_help'; question: string; category: string }
  | { type: 'incident_rca'; incidentDescription: string; stepsToken: string[] }
  | { type: 'spark_explain'; code: string }
  | { type: 'architecture_review'; description: string }
  | { type: 'topic_summary'; topicId: string; sectionTitle: string }
  | { type: 'general' }

export interface AIResponse {
  content: string
  model: string
  tokensUsed: number
  finishReason: 'stop' | 'length' | 'error'
}

export interface AIStreamChunk {
  delta: string
  done: boolean
}

export interface AIProvider {
  name: string
  complete(request: AIRequest): Promise<AIResponse>
  stream?(request: AIRequest): AsyncIterable<AIStreamChunk>
}

// System prompts per context
export const SYSTEM_PROMPTS: Record<string, string> = {
  sql_explain: `You are a senior data engineer helping explain SQL queries.
Be concise, precise, and practical. Focus on what the query does and any performance implications.`,

  interview_help: `You are an expert interviewer coaching a data engineer candidate.
Provide structured, example-driven answers. Include what strong candidates mention.`,

  incident_rca: `You are a senior SRE conducting a root cause analysis on a data pipeline incident.
Analyze systematically: what failed, why, impact, and remediation steps.`,

  spark_explain: `You are an Apache Spark expert. Explain PySpark code clearly, covering
transformations, actions, shuffle behavior, and any optimization opportunities.`,

  architecture_review: `You are a data platform architect. Review the described architecture for
scalability, reliability, cost, and best practices. Be specific and actionable.`,

  topic_summary: `You are a data engineering instructor. Provide a clear, concise summary
of the topic with key takeaways a practicing engineer should remember.`,

  general: `You are a knowledgeable data engineering assistant. Provide accurate,
practical answers relevant to modern data engineering practices.`,
}
