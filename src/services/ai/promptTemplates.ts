// Prompt templates — context-aware suggested prompts shown as chips in the copilot panel.
// Each template has a short chip label and a pre-filled prompt string.

import type { CopilotContextType } from './aiCopilotService'

export interface PromptTemplate {
  id: string
  label: string
  prompt: string
}

const TEMPLATES: Record<CopilotContextType, PromptTemplate[]> = {
  sql: [
    { id: 'sql-window',   label: 'Window functions',  prompt: 'Explain window functions with a real production example. Include PARTITION BY and ORDER BY.' },
    { id: 'sql-explain',  label: 'Explain a query',   prompt: 'Explain what this SQL query does and any performance considerations:' },
    { id: 'sql-optimize', label: 'Optimize my query', prompt: 'How can I optimize this slow SQL query? It scans a large table:' },
    { id: 'sql-debug',    label: 'Debug my SQL',      prompt: 'My SQL query is returning unexpected results. Help me debug it:' },
  ],

  pyspark: [
    { id: 'spark-join',      label: 'Broadcast join',        prompt: 'When should I use broadcast join in PySpark, and how do I implement it?' },
    { id: 'spark-debug',     label: 'Debug PySpark error',   prompt: 'I am getting this PySpark error, help me debug it:' },
    { id: 'spark-partition', label: 'Partitioning strategy', prompt: 'Explain optimal partitioning strategy for a PySpark job writing to Delta Lake.' },
    { id: 'spark-perf',      label: 'Performance tips',      prompt: 'My PySpark job is slow. Walk me through a performance checklist.' },
  ],

  incident: [
    { id: 'inc-rca',    label: 'Write an RCA',       prompt: 'Help me write a root cause analysis (RCA) for this data pipeline incident:' },
    { id: 'inc-schema', label: 'Schema drift',       prompt: 'Explain schema drift in data pipelines and how to detect and prevent it.' },
    { id: 'inc-debug',  label: 'Debug pipeline',     prompt: 'My pipeline is failing with this error. Walk me through the investigation steps:' },
    { id: 'inc-dq',     label: 'Data quality check', prompt: 'What data quality checks should I add to my pipeline to prevent data incidents?' },
  ],

  interview: [
    { id: 'int-answer', label: 'Answer this question', prompt: 'Help me structure a strong answer for this data engineering interview question:' },
    { id: 'int-star',   label: 'STAR method',          prompt: 'Help me apply the STAR method to answer this behavioral data engineering question:' },
    { id: 'int-design', label: 'System design',        prompt: 'Walk me through how to answer a data pipeline system design question for a senior DE role.' },
    { id: 'int-common', label: 'Common mistakes',      prompt: 'What are the most common mistakes candidates make in data engineering interviews?' },
  ],

  architecture: [
    { id: 'arch-medallion', label: 'Medallion pattern', prompt: 'Explain medallion architecture (Bronze/Silver/Gold) and when to use each layer.' },
    { id: 'arch-batch',     label: 'Batch vs streaming', prompt: 'Help me decide between batch and streaming for a use case with 15-minute SLA requirements.' },
    { id: 'arch-lakehouse', label: 'Lakehouse design',   prompt: 'Explain the data lakehouse pattern and when it is better than a managed data warehouse.' },
    { id: 'arch-review',    label: 'Review my design',   prompt: 'Review this data architecture for scalability, reliability, and best practices:' },
  ],

  roadmap: [
    { id: 'road-next',  label: 'What to learn next', prompt: 'Based on a SQL + Python foundation, what should I focus on next for a cloud data engineer role?' },
    { id: 'road-plan',  label: '8-week study plan',  prompt: 'Create an 8-week study plan for a data engineering interview, starting from intermediate SQL.' },
    { id: 'road-gap',   label: 'Skill gap analysis', prompt: 'What skills am I likely missing for a senior data engineer role at a cloud-first company?' },
    { id: 'road-int',   label: 'Interview prep',     prompt: 'What are the top 10 most important topics for a data engineering interview in 2025?' },
  ],

  general: [
    { id: 'gen-concept',  label: 'Explain a concept', prompt: 'Explain this data engineering concept in practical terms with a real-world example:' },
    { id: 'gen-practice', label: 'Create a task',     prompt: 'Give me a hands-on practice task to improve my SQL and PySpark skills.' },
    { id: 'gen-career',   label: 'Career advice',     prompt: 'What should I prioritise to move from mid-level to senior data engineer within 12 months?' },
    { id: 'gen-simplify', label: 'Simplify concept',  prompt: 'Explain this concept simply, as if to a junior data engineer:' },
  ],
}

export function getSuggestedPrompts(contextType: CopilotContextType): PromptTemplate[] {
  return TEMPLATES[contextType] ?? TEMPLATES.general
}

// Map app section IDs to copilot context types
export function sectionToContext(activeSection: string): CopilotContextType {
  switch (activeSection) {
    case 'incidents':
    case 'enterprise':     return 'incident'
    case 'interview-prep':
    case 'war-room':       return 'interview'
    case 'roadmap':        return 'roadmap'
    case 'architecture':   return 'architecture'
    case 'databricks':     return 'pyspark'
    case 'topics':         return 'sql'
    default:               return 'general'
  }
}
