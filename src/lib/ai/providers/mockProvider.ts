import type { AIProvider, AIRequest, AIResponse, AIStreamChunk } from '../aiTypes'

const MOCK_RESPONSES: Record<string, string> = {
  sql_explain: `This query selects all records matching the filter condition. The JOIN operation links the two tables on their shared key. Consider adding an index on the filter column to improve performance at scale.`,

  interview_help: `Strong candidates address this in three parts: (1) the core concept with a clear definition, (2) a real-world scenario where it applies, and (3) trade-offs or gotchas. For this specific question, focus on partition pruning and broadcast joins as key optimizations.`,

  incident_rca: `**Root Cause:** The pipeline failure was caused by schema drift in the upstream source table — a new nullable column was added without updating the downstream schema.

**Timeline:** Alert triggered at T+0, investigation began T+5m, root cause identified T+15m, fix deployed T+35m.

**Remediation:** (1) Add schema validation step at ingestion, (2) configure alerts for source schema changes, (3) document schema evolution process.`,

  spark_explain: `This PySpark job reads the source data, applies a filter transformation (lazy), then performs a groupBy aggregation (triggers a shuffle). The \`collect()\` at the end brings all data to the driver — consider using \`write()\` instead for large datasets.`,

  architecture_review: `The architecture is sound for current scale. Key recommendations: (1) Add a dead-letter queue for failed records, (2) consider Delta Lake for ACID transactions, (3) separate compute and storage for independent scaling, (4) add data quality checks at each layer boundary.`,

  topic_summary: `Key takeaways: understand the core abstraction, know when to use it vs alternatives, and be aware of the operational overhead. In interviews, demonstrate practical experience with real-world trade-offs.`,

  general: `Great question. In modern data engineering, the standard approach involves considering both the technical constraints (latency, throughput, cost) and organizational factors (team skill set, existing tooling). Here's how I'd approach it...`,
}

async function* mockStream(response: string): AsyncIterable<AIStreamChunk> {
  const words = response.split(' ')
  for (let i = 0; i < words.length; i++) {
    await new Promise(r => setTimeout(r, 30))
    yield {
      delta: words[i] + (i < words.length - 1 ? ' ' : ''),
      done: i === words.length - 1,
    }
  }
}

export const mockProvider: AIProvider = {
  name: 'mock',

  async complete(request: AIRequest): Promise<AIResponse> {
    await new Promise(r => setTimeout(r, 600))
    const content = MOCK_RESPONSES[request.context.type] ?? MOCK_RESPONSES.general
    return {
      content,
      model: 'mock-v1',
      tokensUsed: Math.round(content.length / 4),
      finishReason: 'stop',
    }
  },

  async *stream(request: AIRequest): AsyncIterable<AIStreamChunk> {
    const content = MOCK_RESPONSES[request.context.type] ?? MOCK_RESPONSES.general
    yield* mockStream(content)
  },
}
