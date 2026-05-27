import { memo, useEffect, useMemo } from 'react';
import { AppCard, Badge, PrimaryButton, SecondaryButton, SectionHeader, StatPill } from '../ui/design-system.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { mockInterviewModes } from '../../data/mockInterviewSimulator.js';

function clampIndex(index, total) {
  if (!Number.isFinite(index)) return 0;
  if (total <= 0) return 0;
  return Math.max(0, Math.min(index, total - 1));
}

function CoachNote({ label, text }) {
  if (!text) return null;
  return (
    <AppCard compact className="mis-coach-card">
      <span className="mis-coach-label">{label}</span>
      <p className="mis-coach-text">{text}</p>
    </AppCard>
  );
}

function StarPractice({ star }) {
  if (!star) return null;
  return (
    <AppCard compact className="mis-star-card">
      <div className="mis-star-head">
        <Badge variant="accent" size="sm">STAR practice</Badge>
        <span className="mis-star-note">Keep it calm, specific, and measurable.</span>
      </div>
      <div className="mis-star-grid">
        <div className="mis-star-item">
          <span className="mis-star-label">Situation</span>
          <p>{star.situation}</p>
        </div>
        <div className="mis-star-item">
          <span className="mis-star-label">Task</span>
          <p>{star.task}</p>
        </div>
        <div className="mis-star-item">
          <span className="mis-star-label">Action</span>
          <p>{star.action}</p>
        </div>
        <div className="mis-star-item">
          <span className="mis-star-label">Result</span>
          <p>{star.result}</p>
        </div>
      </div>
    </AppCard>
  );
}

const MockInterviewSimulator = memo(function MockInterviewSimulator() {
  const [modeId, setModeId] = useLocalStorage('dem-mock-interview-mode', 'sql');
  const [questionIndex, setQuestionIndex] = useLocalStorage('dem-mock-interview-question', 0);

  const mode = useMemo(
    () => mockInterviewModes.find(item => item.id === modeId) ?? mockInterviewModes[0],
    [modeId]
  );

  const totalQuestions = mode.questions.length;
  const safeIndex = clampIndex(questionIndex, totalQuestions);
  const question = mode.questions[safeIndex];
  const progressPct = totalQuestions ? ((safeIndex + 1) / totalQuestions) * 100 : 0;
  const isFirst = safeIndex === 0;
  const isLast = safeIndex === totalQuestions - 1;

  useEffect(() => {
    setQuestionIndex(0);
  }, [modeId, setQuestionIndex]);

  function handleModeChange(nextMode) {
    if (nextMode === modeId) return;
    setModeId(nextMode);
  }

  function handlePrev() {
    setQuestionIndex(prev => Math.max(0, Number(prev) - 1));
  }

  function handleNext() {
    if (isLast) {
      setQuestionIndex(0);
      return;
    }
    setQuestionIndex(prev => Math.min(totalQuestions - 1, Number(prev) + 1));
  }

  return (
    <div className="mis-section">
      <SectionHeader
        eyebrow="Practice"
        title="Mock Interview Simulator"
        description="Work through one realistic Azure Data Engineering question at a time, with interviewer expectations, strong answer direction, and common weak answers."
        badge={<Badge variant="muted" size="lg">Inline simulator</Badge>}
      />

      <AppCard compact className="mis-shell">
        <div className="mis-mode-bar" role="tablist" aria-label="Mock interview modes">
          {mockInterviewModes.map(item => (
            <button
              key={item.id}
              type="button"
              className={`mis-mode-chip${modeId === item.id ? ' mis-mode-chip--active' : ''}`}
              onClick={() => handleModeChange(item.id)}
              aria-pressed={modeId === item.id}
            >
              {item.title}
            </button>
          ))}
        </div>

        <div className="mis-mode-summary">
          <div className="mis-mode-copy">
            <p className="mis-mode-eyebrow">Current mode</p>
            <h3>{mode.title}</h3>
            <p className="mis-mode-desc">{mode.summary}</p>
          </div>
          <div className="mis-mode-stats">
            <StatPill label="Question" value={`${safeIndex + 1}/${totalQuestions}`} icon="◌" variant="accent" />
            <StatPill label="Focus" value={modeId.toUpperCase()} icon="✦" variant="muted" />
          </div>
        </div>

        <div className="mis-coach-grid" aria-label="Interview coaching notes">
          <CoachNote label="What interviewers really look for" text={mode.coaching.lookFor} />
          <CoachNote label="How seniors structure answers" text={mode.coaching.structure} />
          <CoachNote label="Common mistake to avoid" text={mode.coaching.mistakes} />
          <CoachNote label="When to mention performance, cost, or security" text={mode.coaching.mention} />
        </div>

        <div className="mis-progress">
          <div className="mis-progress-row">
            <span className="mis-progress-label">Mode progress</span>
            <span className="mis-progress-value">{safeIndex + 1} / {totalQuestions}</span>
          </div>
          <div className="mis-progress-track" aria-hidden="true">
            <div className="mis-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </AppCard>

      <AppCard compact className="mis-question-card">
        <div className="mis-question-top">
          <div className="mis-question-meta">
            <span className="mis-question-label">Question {safeIndex + 1}</span>
            <Badge variant="muted" size="sm">{mode.title}</Badge>
          </div>
          <div className="mis-question-nav">
            <SecondaryButton onClick={handlePrev} disabled={isFirst}>
              ← Previous
            </SecondaryButton>
            <PrimaryButton onClick={handleNext}>
              {isLast ? 'Restart mode' : 'Next question →'}
            </PrimaryButton>
          </div>
        </div>

        <p className="mis-question-text">{question.question}</p>

        <div className="mis-answer-grid">
          <AppCard compact className="mis-answer-card">
            <span className="mis-answer-label">Interviewer expectation</span>
            <p>{question.interviewerExpectation}</p>
          </AppCard>
          <AppCard compact className="mis-answer-card">
            <span className="mis-answer-label">Strong answer direction</span>
            <p>{question.strongAnswer}</p>
          </AppCard>
          <AppCard compact className="mis-answer-card">
            <span className="mis-answer-label">Common weak answer</span>
            <p>{question.commonWeakAnswer}</p>
          </AppCard>
        </div>

        <AppCard compact className="mis-coach-callout">
          <span className="mis-answer-label">Coach note</span>
          <p>{question.coachNote}</p>
        </AppCard>

        {question.star && <StarPractice star={question.star} />}
      </AppCard>
    </div>
  );
});

export default MockInterviewSimulator;

