// OnboardingPage — collects learner preferences and saves them via useOnboarding.
// Displayed as an overlay; does not block app use.

import { useState } from 'react'
import { useOnboarding } from '../hooks/useOnboarding'
import type { TargetRole, SkillLevel, PreferredCloud, StudyTime, InterviewTimeline } from '../types/database'

const TARGET_ROLES: { value: TargetRole; label: string }[] = [
  { value: 'azure-data-engineer', label: 'Azure Data Engineer' },
  { value: 'databricks-engineer', label: 'Databricks Engineer' },
  { value: 'pyspark-engineer',    label: 'PySpark Engineer' },
  { value: 'analytics-engineer',  label: 'Analytics Engineer' },
  { value: 'ai-data-engineer',    label: 'AI Data Engineer' },
]

const SKILL_LEVELS: { value: SkillLevel; label: string }[] = [
  { value: 'beginner',     label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced',     label: 'Advanced' },
]

const CLOUD_PLATFORMS: { value: PreferredCloud; label: string }[] = [
  { value: 'azure', label: 'Azure' },
  { value: 'aws',   label: 'AWS' },
  { value: 'both',  label: 'Both' },
]

const STUDY_TIMES: { value: StudyTime; label: string }[] = [
  { value: '30min',  label: '30 minutes / day' },
  { value: '1hour',  label: '1 hour / day' },
  { value: '2hours', label: '2 hours / day' },
]

const INTERVIEW_TIMELINES: { value: InterviewTimeline; label: string }[] = [
  { value: '2weeks',  label: '2 weeks' },
  { value: '1month',  label: '1 month' },
  { value: '3months', label: '3 months' },
  { value: 'no-rush', label: 'No rush' },
]

interface OnboardingPageProps {
  onComplete?: () => void
  onSkip?: () => void
}

export function OnboardingPage({ onComplete, onSkip }: OnboardingPageProps) {
  const { saveProfile, onboardingProfile } = useOnboarding()

  const [targetRole,         setTargetRole]         = useState<TargetRole | ''>(onboardingProfile?.targetRole ?? '')
  const [skillLevel,         setSkillLevel]         = useState<SkillLevel | ''>(onboardingProfile?.skillLevel ?? '')
  const [preferredCloud,     setPreferredCloud]     = useState<PreferredCloud | ''>(onboardingProfile?.preferredCloud ?? '')
  const [studyTime,          setStudyTime]          = useState<StudyTime | ''>(onboardingProfile?.studyTime ?? '')
  const [interviewTimeline,  setInterviewTimeline]  = useState<InterviewTimeline | ''>(onboardingProfile?.interviewTimeline ?? '')
  const [saving, setSaving] = useState(false)

  const allFilled = targetRole && skillLevel && preferredCloud && studyTime && interviewTimeline

  async function handleSubmit() {
    if (!allFilled) return
    setSaving(true)
    try {
      await saveProfile({
        targetRole:        targetRole as TargetRole,
        skillLevel:        skillLevel as SkillLevel,
        preferredCloud:    preferredCloud as PreferredCloud,
        studyTime:         studyTime as StudyTime,
        interviewTimeline: interviewTimeline as InterviewTimeline,
        completedAt:       new Date().toISOString(),
      })
      onComplete?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="auth-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Learning preferences"
      onClick={e => { if (e.target === e.currentTarget) onSkip?.() }}
    >
      <div className="auth-card" style={{ maxWidth: 480 }}>
        {onSkip && (
          <button
            type="button"
            className="auth-close-btn"
            onClick={onSkip}
            aria-label="Close"
          >
            ×
          </button>
        )}

        <div className="auth-card-header">
          <div className="auth-card-logo" aria-hidden="true">◎</div>
          <h2 className="auth-card-title">
            {onboardingProfile ? 'Update your goals' : 'Personalise your path'}
          </h2>
          <p className="auth-card-subtitle">
            Takes 30 seconds. We'll tailor your roadmap, timeline, and recommended first step.
          </p>
        </div>

        <div className="onboarding-primer">
          <div>
            <span>What Data Engineers do</span>
            <p>Build pipelines that move, clean, govern, and deliver data for analytics and AI teams.</p>
          </div>
          <div>
            <span>What interviews test</span>
            <p>SQL, Python, Spark, cloud pipelines, production debugging, and project storytelling.</p>
          </div>
        </div>

        <div className="auth-form">
          <div className="auth-field">
            <label htmlFor="ob-role">Target role</label>
            <select
              id="ob-role"
              className="auth-input"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value as TargetRole)}
            >
              <option value="">Select a role…</option>
              {TARGET_ROLES.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div className="auth-field">
            <label htmlFor="ob-level">Current experience level</label>
            <select
              id="ob-level"
              className="auth-input"
              value={skillLevel}
              onChange={e => setSkillLevel(e.target.value as SkillLevel)}
            >
              <option value="">Select your level…</option>
              {SKILL_LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>

          <div className="auth-field">
            <label htmlFor="ob-cloud">Preferred cloud platform</label>
            <select
              id="ob-cloud"
              className="auth-input"
              value={preferredCloud}
              onChange={e => setPreferredCloud(e.target.value as PreferredCloud)}
            >
              <option value="">Select a platform…</option>
              {CLOUD_PLATFORMS.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="auth-field">
            <label htmlFor="ob-time">Daily study time</label>
            <select
              id="ob-time"
              className="auth-input"
              value={studyTime}
              onChange={e => setStudyTime(e.target.value as StudyTime)}
            >
              <option value="">Select a goal…</option>
              {STUDY_TIMES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="auth-field">
            <label htmlFor="ob-timeline">Interview timeline</label>
            <select
              id="ob-timeline"
              className="auth-input"
              value={interviewTimeline}
              onChange={e => setInterviewTimeline(e.target.value as InterviewTimeline)}
            >
              <option value="">When are you interviewing?</option>
              {INTERVIEW_TIMELINES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="auth-submit-btn"
            onClick={handleSubmit}
            disabled={saving || !allFilled}
          >
            {saving ? 'Saving…' : onboardingProfile ? 'Update preferences →' : 'Start learning →'}
          </button>
        </div>

        {onSkip && (
          <button type="button" className="auth-demo-continue" onClick={onSkip}>
            {onboardingProfile ? 'Cancel' : 'Skip for now'}
          </button>
        )}
      </div>
    </div>
  )
}
