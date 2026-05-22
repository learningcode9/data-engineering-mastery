// Shared application types aligned with supabase/migrations/001_initial_schema.sql
// Update this file whenever the schema changes.
// For production, replace with auto-generated types:
//   supabase gen types typescript --local > src/types/database.types.ts

// ─── profiles ────────────────────────────────────────────────────────────────

export type UserRole = 'learner' | 'pro' | 'admin'

export interface Profile {
  id: string            // uuid — FK to auth.users(id)
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

// ─── learning_progress ───────────────────────────────────────────────────────

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed'

export interface LearningProgress {
  id: string
  user_id: string
  topic_id: string
  module_id: string
  progress_percent: number      // 0–100
  status: ProgressStatus
  last_opened_section: string | null
  updated_at: string
}

// ─── topic_completion ────────────────────────────────────────────────────────

export interface TopicCompletion {
  id: string
  user_id: string
  topic_id: string
  section_id: string
  completed_at: string
}

// ─── saved_notes ─────────────────────────────────────────────────────────────

export interface SavedNote {
  id: string
  user_id: string
  topic_id: string
  section_id: string
  content: string
  updated_at: string
}

// ─── xp_history ──────────────────────────────────────────────────────────────

export type XPSourceType =
  | 'topic_complete'
  | 'section_complete'
  | 'practice_task'
  | 'sql_challenge'
  | 'incident_resolve'
  | 'interview'
  | 'streak_bonus'
  | 'achievement'

export interface XPHistory {
  id: string
  user_id: string
  action: string
  xp_amount: number
  source_type: XPSourceType
  source_id: string | null
  created_at: string
}

// Derived from user_xp_summary view
export interface UserXPSummary {
  user_id: string
  total_xp: number
  level: number
  xp_in_level: number
}

// ─── achievements ────────────────────────────────────────────────────────────

export interface Achievement {
  id: string
  user_id: string
  achievement_key: string
  title: string
  unlocked_at: string
}

// ─── incidents ───────────────────────────────────────────────────────────────

export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4'
export type IncidentStatus   = 'active' | 'resolved' | 'closed'

export interface Incident {
  id: string
  title: string
  severity: IncidentSeverity
  status: IncidentStatus
  affected_system: string
  business_impact: string
  created_at: string
}

// ─── incident_attempts ───────────────────────────────────────────────────────

export interface IncidentAttempt {
  id: string
  user_id: string
  incident_id: string           // FK → incidents(id)
  selected_resolution: string
  success: boolean
  xp_earned: number
  completed_at: string
}

// ─── sql_attempts ────────────────────────────────────────────────────────────

export interface SqlAttempt {
  id: string
  user_id: string
  challenge_id: string
  query_text: string
  is_correct: boolean
  execution_time_ms: number | null
  attempts_count: number
  created_at: string
}

// ─── interview_sessions ──────────────────────────────────────────────────────

export type InterviewDifficulty = 'junior' | 'mid' | 'senior' | 'staff'

export interface InterviewSession {
  id: string
  user_id: string
  category: string | null
  difficulty: InterviewDifficulty | null
  score: number | null           // 0–100
  completed_at: string
}

// ─── ai_chat_history ─────────────────────────────────────────────────────────

export type AIContextType =
  | 'sql_explain'
  | 'interview_help'
  | 'incident_rca'
  | 'spark_explain'
  | 'architecture_review'
  | 'topic_summary'
  | 'general'

export interface AIChatHistory {
  id: string
  user_id: string
  message: string
  response: string
  context_type: AIContextType
  created_at: string
}

// ─── projects_progress ───────────────────────────────────────────────────────

export interface ProjectProgress {
  id: string
  user_id: string
  project_id: string
  progress_percent: number       // 0–100
  status: ProgressStatus
  updated_at: string
}

// ─── Insert helpers (omit server-generated fields) ───────────────────────────

export type InsertLearningProgress  = Omit<LearningProgress, 'id' | 'updated_at'>
export type InsertTopicCompletion   = Omit<TopicCompletion, 'id' | 'completed_at'>
export type InsertSavedNote         = Omit<SavedNote, 'id' | 'updated_at'>
export type InsertXPHistory         = Omit<XPHistory, 'id' | 'created_at'>
export type InsertAchievement       = Omit<Achievement, 'id' | 'unlocked_at'>
export type InsertIncidentAttempt   = Omit<IncidentAttempt, 'id' | 'completed_at'>
export type InsertSqlAttempt        = Omit<SqlAttempt, 'id' | 'created_at'>
export type InsertInterviewSession  = Omit<InterviewSession, 'id' | 'completed_at'>
export type InsertAIChatHistory     = Omit<AIChatHistory, 'id' | 'created_at'>
export type InsertProjectProgress   = Omit<ProjectProgress, 'id' | 'updated_at'>
