// Recommendation engine — maps onboarding preferences to a prioritised learning plan.
// No AI involved: deterministic rules based on role × progress.

import type { OnboardingProfile, TargetRole } from '../../types/database'

export interface Recommendation {
  topicId: string
  topicLabel: string
  reason: string
  path: string[]
  roadmapTrackId: string
  projectId: string
  dailyTask: string
}

// ─── Learning paths ───────────────────────────────────────────────────────────

const LEARNING_PATHS: Record<TargetRole, string[]> = {
  'azure-data-engineer': ['sql', 'python', 'azure-data-factory', 'azure-databricks'],
  'databricks-engineer': ['sql', 'python', 'pyspark', 'azure-databricks'],
  'pyspark-engineer':    ['sql', 'python', 'pyspark', 'aws-glue'],
  'analytics-engineer':  ['sql', 'python', 'azure-data-factory'],
  'ai-data-engineer':    ['sql', 'python', 'pyspark', 'ai-for-data-engineers'],
}

const ROADMAP_MAP: Record<TargetRole, string> = {
  'azure-data-engineer': 'azure-de',
  'databricks-engineer': 'pyspark-engineer',
  'pyspark-engineer':    'pyspark-engineer',
  'analytics-engineer':  'etl-developer',
  'ai-data-engineer':    'lakehouse-engineer',
}

const PROJECT_MAP: Record<TargetRole, string> = {
  'azure-data-engineer': 'medallion-project',
  'databricks-engineer': 'databricks-optimization',
  'pyspark-engineer':    'incremental-etl',
  'analytics-engineer':  'sales-lakehouse',
  'ai-data-engineer':    'api-ingestion',
}

const ROLE_LABELS: Record<TargetRole, string> = {
  'azure-data-engineer': 'Azure Data Engineer',
  'databricks-engineer': 'Databricks Engineer',
  'pyspark-engineer':    'PySpark Engineer',
  'analytics-engineer':  'Analytics Engineer',
  'ai-data-engineer':    'AI Data Engineer',
}

const TOPIC_LABELS: Record<string, string> = {
  'sql':                    'SQL Mastery',
  'python':                 'Python for Data',
  'pyspark':                'PySpark',
  'azure-data-factory':     'Azure Data Factory',
  'azure-databricks':       'Azure Databricks',
  'aws-glue':               'AWS Glue',
  'ai-for-data-engineers':  'AI for Data Engineers',
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function getRecommendation(
  profile: OnboardingProfile,
  progress: Record<string, number>
): Recommendation {
  const path = LEARNING_PATHS[profile.targetRole]

  const nextTopicId = path.find(id => (progress[id] ?? 0) < 100) ?? path[0]
  const topicLabel  = TOPIC_LABELS[nextTopicId] ?? nextTopicId

  return {
    topicId:       nextTopicId,
    topicLabel,
    reason:        buildReason(profile, nextTopicId),
    path,
    roadmapTrackId: ROADMAP_MAP[profile.targetRole],
    projectId:     PROJECT_MAP[profile.targetRole],
    dailyTask:     buildDailyTask(profile, nextTopicId),
  }
}

export const DEFAULT_RECOMMENDATION: Recommendation = {
  topicId:        'sql',
  topicLabel:     'SQL Mastery',
  reason:         'SQL is the foundation every data engineer builds on — start here and everything else clicks faster',
  path:           ['sql', 'python', 'pyspark', 'azure-databricks'],
  roadmapTrackId: 'sql-engineer',
  projectId:      'sales-lakehouse',
  dailyTask:      'Complete one SQL practice task today',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildReason(profile: OnboardingProfile, topicId: string): string {
  const roleLabel  = ROLE_LABELS[profile.targetRole]
  const topicLabel = TOPIC_LABELS[topicId] ?? topicId

  const map: Record<string, string> = {
    'sql':                   `${topicLabel} is the core skill every ${roleLabel} uses daily`,
    'python':                `${topicLabel} unlocks scripting, automation, and pipeline logic for your ${roleLabel} path`,
    'pyspark':               `${topicLabel} is the distributed processing backbone of the ${roleLabel} path`,
    'azure-databricks':      `${topicLabel} is the primary execution environment for ${roleLabel} roles`,
    'azure-data-factory':    `${topicLabel} is how ${roleLabel}s orchestrate production pipelines on Azure`,
    'aws-glue':              `${topicLabel} is the serverless ETL runtime for your ${roleLabel} path on AWS`,
    'ai-for-data-engineers': `${topicLabel} is where data engineering meets the AI-first future`,
  }

  return map[topicId] ?? `${topicLabel} is your next step on the ${roleLabel} path`
}

function buildDailyTask(profile: OnboardingProfile, topicId: string): string {
  const studyLabel: Record<string, string> = {
    '30min':  '30 minutes',
    '1hour':  '1 hour',
    '2hours': '2 hours',
  }
  const time       = studyLabel[profile.studyTime] ?? '30 minutes'
  const topicLabel = TOPIC_LABELS[topicId] ?? topicId
  return `Spend ${time} on ${topicLabel} today`
}
