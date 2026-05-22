// Shared application types for the Supabase database schema.
// Phase 1: hand-authored. Later phases: auto-generate with
//   supabase gen types typescript --local > src/types/database.types.ts

// ─── User / Profile ───────────────────────────────────────────────────────────

export interface Profile {
  id: string
  email: string
  fullName: string | null
  avatarUrl: string | null
  role: 'learner' | 'pro' | 'admin'
  onboarded: boolean
  targetRole: string | null
  experienceLevel: 'junior' | 'mid' | 'senior' | 'staff' | null
  createdAt: string
  updatedAt: string
}

// ─── Learning Progress ────────────────────────────────────────────────────────

export interface LearningProgress {
  id: string
  userId: string
  topicId: string
  pctComplete: number        // 0–100
  lastActivityAt: string | null
  totalTimeSpentSec: number
  updatedAt: string
}

// ─── Topic Completion ─────────────────────────────────────────────────────────

export interface TopicCompletion {
  id: string
  userId: string
  topicId: string
  sectionId: string
  completed: boolean
  completedAt: string | null
  timeSpentSec: number
}

// ─── Saved Notes ──────────────────────────────────────────────────────────────

export interface SavedNote {
  topicId: string
  content: string
  updatedAt: string
}

// ─── Incident Attempt ─────────────────────────────────────────────────────────

export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4'
export type IncidentStatus   = 'active' | 'resolved' | 'failed' | 'abandoned'

export interface IncidentAttempt {
  id: string
  userId: string
  incidentId: string
  scenarioId: string
  severity: IncidentSeverity
  status: IncidentStatus
  startedAt: string
  resolvedAt: string | null
  durationSec: number | null
  score: number | null          // 0–100
  slaMet: boolean | null
  xpAwarded: number
  rcaSubmitted: string | null
}

// ─── SQL Attempt ──────────────────────────────────────────────────────────────

export interface SqlAttempt {
  id: string
  userId: string
  challengeId: string
  query: string
  isCorrect: boolean
  score: number                 // 0–100
  executionMs: number | null
  errorMessage: string | null
  attemptedAt: string
}

// ─── Interview Session ────────────────────────────────────────────────────────

export type InterviewMode = 'practice' | 'timed' | 'war_room'

export interface InterviewSession {
  id: string
  mode: InterviewMode
  category: string | null
  totalQuestions: number
  correctAnswers: number
  score: number | null          // 0–100
  startedAt: string
  completedAt: string | null
}

// ─── Achievement ──────────────────────────────────────────────────────────────

export interface Achievement {
  badgeId: string
  badgeName: string
  badgeIcon: string | null
  earnedAt: string
}

// ─── XP ───────────────────────────────────────────────────────────────────────

export type XPSource =
  | 'topic_complete'
  | 'sql_challenge'
  | 'incident_resolve'
  | 'interview'
  | 'streak_bonus'
  | 'achievement'
  | 'practice_task'

export interface XPEntry {
  id: string
  userId: string
  amount: number
  source: XPSource
  label: string | null
  createdAt: string
}

export interface UserXPSummary {
  totalXP: number
  level: number
  xpInCurrentLevel: number
  xpPerLevel: number
}
