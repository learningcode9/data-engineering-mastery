// Auto-generate this file with: supabase gen types typescript --local > src/types/database.types.ts
// This is the hand-authored version for development before Supabase CLI is set up.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'learner' | 'pro' | 'admin'
          onboarded: boolean
          target_role: string | null
          experience_level: 'junior' | 'mid' | 'senior' | 'staff' | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      xp_ledger: {
        Row: {
          id: string
          user_id: string
          amount: number
          source: XPSource
          source_id: string | null
          label: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['xp_ledger']['Row'], 'id' | 'created_at'>
        Update: never
      }
      streaks: {
        Row: {
          id: string
          user_id: string
          current_streak: number
          longest_streak: number
          last_activity_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['streaks']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['streaks']['Row'], 'id' | 'user_id' | 'created_at'>>
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          badge_name: string
          badge_icon: string | null
          earned_at: string
        }
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id' | 'earned_at'>
        Update: never
      }
      topic_progress: {
        Row: {
          id: string
          user_id: string
          topic_id: string
          section_id: string
          completed: boolean
          completed_at: string | null
          time_spent_sec: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['topic_progress']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['topic_progress']['Row'], 'id' | 'user_id' | 'created_at'>>
      }
      notes: {
        Row: {
          id: string
          user_id: string
          topic_id: string
          section_id: string
          content: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['notes']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Pick<Database['public']['Tables']['notes']['Row'], 'content'>>
      }
      sql_attempts: {
        Row: {
          id: string
          user_id: string
          challenge_id: string
          query: string
          is_correct: boolean
          score: number
          execution_ms: number | null
          error_message: string | null
          result_rows: Json | null
          execution_plan: Json | null
          attempted_at: string
        }
        Insert: Omit<Database['public']['Tables']['sql_attempts']['Row'], 'id' | 'attempted_at'>
        Update: never
      }
      saved_queries: {
        Row: {
          id: string
          user_id: string
          name: string
          query: string
          description: string | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['saved_queries']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['saved_queries']['Row'], 'id' | 'user_id' | 'created_at'>>
      }
      incident_sessions: {
        Row: {
          id: string
          user_id: string
          incident_id: string
          scenario_id: string
          status: IncidentStatus
          severity: IncidentSeverity | null
          started_at: string
          resolved_at: string | null
          duration_sec: number | null
          score: number | null
          steps_taken: Json
          rca_submitted: string | null
          sla_met: boolean | null
          xp_awarded: number
        }
        Insert: Omit<Database['public']['Tables']['incident_sessions']['Row'], 'id' | 'started_at'>
        Update: Partial<Omit<Database['public']['Tables']['incident_sessions']['Row'], 'id' | 'user_id' | 'started_at'>>
      }
      incident_events: {
        Row: {
          id: string
          session_id: string
          event_type: IncidentEventType
          actor: string
          description: string
          metadata: Json
          occurred_at: string
        }
        Insert: Omit<Database['public']['Tables']['incident_events']['Row'], 'id' | 'occurred_at'>
        Update: never
      }
      interview_sessions: {
        Row: {
          id: string
          user_id: string
          mode: InterviewMode
          category: string | null
          total_q: number
          answered_q: number
          correct_q: number
          score: number | null
          duration_sec: number | null
          completed: boolean
          started_at: string
          completed_at: string | null
          xp_awarded: number
        }
        Insert: Omit<Database['public']['Tables']['interview_sessions']['Row'], 'id' | 'started_at'>
        Update: Partial<Omit<Database['public']['Tables']['interview_sessions']['Row'], 'id' | 'user_id' | 'started_at'>>
      }
      question_mastery: {
        Row: {
          id: string
          user_id: string
          question_id: string
          status: MasteryStatus
          attempts: number
          correct_streak: number
          last_seen_at: string | null
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['question_mastery']['Row'], 'id' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['question_mastery']['Row'], 'id' | 'user_id'>>
      }
      ai_threads: {
        Row: {
          id: string
          user_id: string
          context: AIContext
          title: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_threads']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Pick<Database['public']['Tables']['ai_threads']['Row'], 'title' | 'metadata'>>
      }
      ai_messages: {
        Row: {
          id: string
          thread_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens_used: number | null
          model: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['ai_messages']['Row'], 'id' | 'created_at'>
        Update: never
      }
      career_enrollments: {
        Row: {
          id: string
          user_id: string
          track_id: string
          track_name: string
          status: 'active' | 'paused' | 'completed'
          enrolled_at: string
          target_date: string | null
          completed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['career_enrollments']['Row'], 'id' | 'enrolled_at'>
        Update: Partial<Omit<Database['public']['Tables']['career_enrollments']['Row'], 'id' | 'user_id' | 'enrolled_at'>>
      }
      daily_plans: {
        Row: {
          id: string
          user_id: string
          plan_date: string
          goal: string | null
          tasks: Json
          notes: string | null
          completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['daily_plans']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Database['public']['Tables']['daily_plans']['Row'], 'id' | 'user_id' | 'created_at'>>
      }
      user_files: {
        Row: {
          id: string
          user_id: string
          name: string
          file_type: FileType
          storage_path: string
          size_bytes: number | null
          metadata: Json
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_files']['Row'], 'id' | 'created_at'>
        Update: never
      }
    }
    Views: {
      user_xp_totals: {
        Row: {
          user_id: string
          total_xp: number
          level: number
          xp_in_current_level: number
        }
      }
      topic_completion_summary: {
        Row: {
          user_id: string
          topic_id: string
          total_sections: number
          completed_sections: number
          pct_complete: number
          last_completed_at: string | null
          total_time_sec: number
        }
      }
      sql_best_attempts: {
        Row: {
          user_id: string
          challenge_id: string
          query: string
          score: number
          is_correct: boolean
          execution_ms: number | null
          attempted_at: string
        }
      }
    }
  }
}

// ─── Domain Enums ────────────────────────────────────────────────────────────

export type XPSource =
  | 'topic_complete'
  | 'sql_challenge'
  | 'incident_resolve'
  | 'interview'
  | 'streak_bonus'
  | 'achievement'

export type IncidentStatus = 'active' | 'resolved' | 'failed' | 'abandoned'
export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4'
export type IncidentEventType = 'alert' | 'investigation' | 'action' | 'escalation' | 'resolution'
export type InterviewMode = 'practice' | 'timed' | 'war_room'
export type MasteryStatus = 'unseen' | 'learning' | 'reviewing' | 'mastered'
export type AIContext =
  | 'sql_explain'
  | 'interview_help'
  | 'incident_rca'
  | 'spark_explain'
  | 'architecture_review'
  | 'topic_summary'
  | 'general'
export type FileType = 'diagram' | 'notebook' | 'resume' | 'report' | 'note_export'

// ─── Convenience row types ────────────────────────────────────────────────────

export type Profile = Database['public']['Tables']['profiles']['Row']
export type XPEntry = Database['public']['Tables']['xp_ledger']['Row']
export type Streak = Database['public']['Tables']['streaks']['Row']
export type Achievement = Database['public']['Tables']['achievements']['Row']
export type TopicProgress = Database['public']['Tables']['topic_progress']['Row']
export type Note = Database['public']['Tables']['notes']['Row']
export type SQLAttempt = Database['public']['Tables']['sql_attempts']['Row']
export type SavedQuery = Database['public']['Tables']['saved_queries']['Row']
export type IncidentSession = Database['public']['Tables']['incident_sessions']['Row']
export type IncidentEvent = Database['public']['Tables']['incident_events']['Row']
export type InterviewSession = Database['public']['Tables']['interview_sessions']['Row']
export type QuestionMastery = Database['public']['Tables']['question_mastery']['Row']
export type AIThread = Database['public']['Tables']['ai_threads']['Row']
export type AIMessage = Database['public']['Tables']['ai_messages']['Row']
export type CareerEnrollment = Database['public']['Tables']['career_enrollments']['Row']
export type DailyPlan = Database['public']['Tables']['daily_plans']['Row']
export type UserFile = Database['public']['Tables']['user_files']['Row']
