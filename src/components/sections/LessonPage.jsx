import { memo, useState, useMemo } from 'react';
import TopicDetails from './TopicDetails.jsx';
import {
  aiLearningPathPhases,
  learningPathPhases,
  optionalTechnologyPhases,
} from '../../data/learningPath.js';

const allLearningPhases = [...learningPathPhases, ...aiLearningPathPhases, ...optionalTechnologyPhases];

// Build a full lesson context object from a lesson ID by searching the path data
function findLessonCtx(lessonId) {
  for (const phase of allLearningPhases) {
    for (const module of phase.modules) {
      const lesson = module.lessons.find(l => l.id === lessonId);
      if (lesson) {
        const allLessons = phase.modules.flatMap(m => m.lessons);
        const idx = allLessons.findIndex(l => l.id === lessonId);
        const next = allLessons[idx + 1] ?? null;
        return {
          lessonId:        lesson.id,
          lessonTitle:     lesson.title,
          topicId:         lesson.topicId ?? null,
          type:            lesson.type ?? 'lesson',
          guide:           lesson.guide ?? null,
          body:            lesson.body ?? null,
          tools:           lesson.tools ?? [],
          label:           lesson.label ?? null,
          difficulty:      lesson.difficulty ?? null,
          section:         lesson.section ?? null,
          phaseId:         phase.id,
          phaseTitle:      phase.title,
          phaseShortTitle: phase.shortTitle,
          moduleId:        module.id,
          moduleTitle:     module.title,
          nextLesson:      lesson.nextLesson ?? (next ? { id: next.id, title: next.title } : null),
        };
      }
    }
  }
  return null;
}

// ── Lesson position helper ─────────────────────────────────────────────────────
function useLessonPosition(lessonId, phaseId) {
  return useMemo(() => {
    const phase = allLearningPhases.find(p => p.id === phaseId);
    if (!phase) return { lessonIndex: 0, totalLessons: 0, phaseIndex: 0, totalPhases: allLearningPhases.length };
    const allLessons = phase.modules.flatMap(m => m.lessons);
    const lessonIndex = allLessons.findIndex(l => l.id === lessonId);
    const phaseIndex  = allLearningPhases.indexOf(phase);
    return {
      lessonIndex: lessonIndex >= 0 ? lessonIndex : 0,
      totalLessons: allLessons.length,
      phaseIndex,
      totalPhases: allLearningPhases.length,
    };
  }, [lessonId, phaseId]);
}

// ── Phase + lesson progress indicator ─────────────────────────────────────────
function LessonProgressIndicator({ lessonIndex, totalLessons, phaseIndex, totalPhases, phaseTitle }) {
  const lessonPct  = totalLessons > 0 ? Math.round(((lessonIndex + 1) / totalLessons) * 100) : 0;

  return (
    <div className="lesson-progress-indicator">
      <div className="lpi-text">
        <span className="lpi-phase">Phase {phaseIndex + 1} of {totalPhases} — {phaseTitle}</span>
        <span className="lpi-lesson">Lesson {lessonIndex + 1} of {totalLessons}</span>
      </div>
      <div className="lpi-track">
        <div className="lpi-fill" style={{ width: `${lessonPct}%` }} />
      </div>
    </div>
  );
}

// ── Quiz component ─────────────────────────────────────────────────────────────
function QuizBlock({ questions, lessonId }) {
  // keyed by lessonId externally so state always starts blank for each lesson
  const [selected,  setSelected]  = useState(() => ({}));
  const [submitted, setSubmitted] = useState(() => false);

  if (!questions?.length) return null;

  const allAnswered = questions.every((_, qi) => selected[qi] !== undefined);
  const score = submitted
    ? questions.filter((q, qi) => selected[qi] === q.answer).length
    : 0;

  function handleAnswer(qi, oi) {
    // Never mutate state when already submitted
    if (submitted) return;
    setSelected(s => ({ ...s, [qi]: oi }));
  }

  function handleSubmit() {
    if (submitted || !allAnswered) return;
    setSubmitted(true);
  }

  return (
    <div className={`lesson-quiz${submitted ? ' quiz-submitted' : ''}`}>
      <div className="lesson-quiz-header">
        <span className="lesson-quiz-icon" aria-hidden="true">◎</span>
        <strong>Check Your Understanding</strong>
        <span className="lesson-quiz-count">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="lesson-quiz-questions">
        {questions.map((q, qi) => {
          const sel     = selected[qi];
          const correct = q.answer;
          return (
            <div key={qi} className={`quiz-question${submitted ? ' quiz-question--revealed' : ''}`}>
              <p className="quiz-q">{q.q}</p>
              <div className="quiz-options">
                {q.options.map((opt, oi) => {
                  let cls = 'quiz-option';
                  if (submitted && oi === correct)                    cls += ' quiz-option--correct';
                  if (submitted && oi === sel && sel !== correct)     cls += ' quiz-option--wrong';
                  if (!submitted && sel === oi)                       cls += ' quiz-option--selected';
                  return (
                    <button
                      key={oi}
                      type="button"
                      className={cls}
                      onClick={() => handleAnswer(qi, oi)}
                      disabled={submitted}
                    >
                      <span className="quiz-option-marker">{String.fromCharCode(65 + oi)}</span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div className={`quiz-explanation${sel === correct ? ' quiz-explanation--correct' : ' quiz-explanation--wrong'}`}>
                  <span aria-hidden="true">{sel === correct ? '✓ Correct — ' : '✕ Not quite — '}</span>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit row */}
      <div className="quiz-submit-row">
        {submitted ? (
          <div className="quiz-score">
            {score === questions.length
              ? `Perfect score — ${score}/${questions.length} correct!`
              : `You got ${score}/${questions.length} correct`}
          </div>
        ) : (
          <button
            type="button"
            className={`quiz-submit-btn${!allAnswered ? ' quiz-submit-btn--disabled' : ''}`}
            onClick={handleSubmit}
            disabled={!allAnswered}
            title={!allAnswered ? 'Answer all questions to submit' : 'Submit quiz'}
          >
            {allAnswered ? 'Submit Quiz' : 'Answer all questions to submit'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Next lesson CTA ────────────────────────────────────────────────────────────
function NextLessonCTA({ nextLesson, onNavigate, onBack }) {
  if (!nextLesson) {
    return (
      <div className="lesson-next-cta lesson-next-cta--phase-end">
        <div className="lesson-next-body">
          <span className="eyebrow">Phase complete</span>
          <strong>You finished this phase. Ready for the next?</strong>
          <p>Return to the Learning Path to continue your journey.</p>
        </div>
        <button type="button" className="lesson-next-btn" onClick={onBack}>
          Back to Learning Path →
        </button>
      </div>
    );
  }

  return (
    <div className="lesson-next-cta">
      <div className="lesson-next-body">
        <span className="eyebrow">Up next</span>
        <strong>{nextLesson.title}</strong>
        {nextLesson.reason && <p>{nextLesson.reason}</p>}
      </div>
      <button
        type="button"
        className="lesson-next-btn"
        onClick={() => onNavigate?.(nextLesson.id)}
      >
        Start {nextLesson.title} →
      </button>
    </div>
  );
}

// ── Rich guide lesson content ──────────────────────────────────────────────────
function GuideLessonContent({ ctx, onBack, onNavigate, onToggleComplete, completedTopics }) {
  const { guide, lessonTitle, label, difficulty, lessonId } = ctx;
  if (!guide) return null;

  const isCompleted = !!(completedTopics ?? {})[lessonId];

  return (
    <article className="lesson-page-article">
      {/* Header */}
      <div className="lesson-page-header">
        <div className="lesson-page-meta">
          <span className="lesson-meta-chip">{label ?? 'Orientation'}</span>
          <span className="lesson-meta-chip lesson-meta-chip--diff">{difficulty ?? 'Beginner'}</span>
        </div>
        <h1 className="lesson-page-title">{lessonTitle}</h1>
        <p className="lesson-page-headline">{guide.headline}</p>
      </div>

      {/* Learning objectives */}
      {guide.objectives?.length > 0 && (
        <section className="lesson-objectives">
          <h2 className="lesson-section-heading">What you will learn</h2>
          <ul className="lesson-objectives-list">
            {guide.objectives.map((obj, i) => (
              <li key={i}>
                <span className="lesson-obj-num">{i + 1}</span>
                <span>{obj}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Explanation */}
      {guide.explanation && (
        <section className="lesson-explanation">
          <h2 className="lesson-section-heading">The concept</h2>
          <p>{guide.explanation}</p>
        </section>
      )}

      {/* Analogy */}
      {guide.analogy && (
        <div className="lesson-analogy">
          <span className="lesson-analogy-kicker">Analogy</span>
          <strong>{guide.analogy.title}</strong>
          <p>{guide.analogy.text}</p>
        </div>
      )}

      {/* Key points */}
      {guide.keyPoints?.length > 0 && (
        <section className="lesson-keypoints">
          <h2 className="lesson-section-heading">Key concepts</h2>
          <div className="lesson-keypoints-grid">
            {guide.keyPoints.map((kp, i) => (
              <div key={i} className="lesson-keypoint-card">
                <strong>{kp.title}</strong>
                <p>{kp.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Why companies care */}
      {guide.whyCompaniesUse && (
        <div className="lesson-why-box">
          <span className="lesson-why-kicker">Why companies care</span>
          <p>{guide.whyCompaniesUse}</p>
        </div>
      )}

      {/* Interview note */}
      {guide.interviewNote && (
        <div className="lesson-interview-note">
          <span className="lesson-interview-icon" aria-hidden="true">◉</span>
          <div>
            <strong>Interview tip</strong>
            <p>{guide.interviewNote}</p>
          </div>
        </div>
      )}

      {/* Common mistakes */}
      {guide.commonMistakes?.length > 0 && (
        <section className="lesson-mistakes">
          <h2 className="lesson-section-heading">Common mistakes</h2>
          <div className="lesson-mistakes-list">
            {guide.commonMistakes.map((m, i) => (
              <div key={i} className="lesson-mistake-card">
                <div className="lesson-mistake-header">
                  <span className="lesson-mistake-icon" aria-hidden="true">⚠</span>
                  <strong className="lesson-mistake-title">{m.mistake}</strong>
                </div>
                {m.why && <p className="lesson-mistake-why">{m.why}</p>}
                {m.fix && <p className="lesson-mistake-fix"><strong>Fix:</strong> {m.fix}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Performance tips */}
      {guide.performanceTips?.length > 0 && (
        <section className="lesson-perf">
          <h2 className="lesson-section-heading">Performance considerations</h2>
          <ul className="lesson-perf-list">
            {guide.performanceTips.map((t, i) => (
              <li key={i}>
                <span aria-hidden="true">⚡</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Best practices */}
      {guide.bestPractices?.length > 0 && (
        <section className="lesson-bestpractices">
          <h2 className="lesson-section-heading">Best practices</h2>
          <ul className="lesson-bestpractices-list">
            {guide.bestPractices.map((b, i) => (
              <li key={i}>
                <span aria-hidden="true">◆</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Recap */}
      {guide.recap?.length > 0 && (
        <section className="lesson-recap">
          <h2 className="lesson-section-heading">Recap</h2>
          <ul className="lesson-recap-list">
            {guide.recap.map((r, i) => (
              <li key={i}>
                <span aria-hidden="true">✓</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Quiz — keyed by lessonId so state always resets on lesson change */}
      {guide.quiz?.length > 0 && <QuizBlock key={lessonId} lessonId={lessonId} questions={guide.quiz} />}

      {/* Mark Complete */}
      <div className="lesson-complete-row">
        {isCompleted ? (
          <div className="lesson-complete-done" role="status">
            <span aria-hidden="true">✓</span> Lesson Completed
          </div>
        ) : (
          <button
            type="button"
            className="lesson-complete-btn"
            onClick={() => onToggleComplete?.(lessonId)}
          >
            Mark Lesson Complete ✓
          </button>
        )}
      </div>

      {/* Next lesson CTA */}
      <NextLessonCTA nextLesson={ctx.nextLesson} onNavigate={onNavigate} onBack={onBack} />
    </article>
  );
}

// ── Body-only fallback lesson (no topic, no rich guide) ────────────────────────
function BodyLessonContent({ ctx, onBack }) {
  const { lessonTitle, body, tools, label, difficulty } = ctx;
  return (
    <article className="lesson-page-article">
      <div className="lesson-page-header">
        <div className="lesson-page-meta">
          {label && <span className="lesson-meta-chip">{label}</span>}
          {difficulty && <span className="lesson-meta-chip lesson-meta-chip--diff">{difficulty}</span>}
        </div>
        <h1 className="lesson-page-title">{lessonTitle}</h1>
        {body && <p className="lesson-page-body">{body}</p>}
        {tools?.length > 0 && (
          <div className="lesson-tools">
            {tools.map(t => <span key={t} className="lesson-tool-chip">{t}</span>)}
          </div>
        )}
      </div>
      <div className="lesson-page-content-placeholder">
        <p>Deep-dive content for this lesson is coming soon. Use the practice projects and interview prep sections to explore this topic in context.</p>
      </div>
      <div className="lesson-page-footer">
        <button type="button" className="lesson-back-btn" onClick={onBack}>
          ← Back to Learning Path
        </button>
      </div>
    </article>
  );
}

// ── Main LessonPage ────────────────────────────────────────────────────────────
const LessonPage = memo(function LessonPage({
  lessonContext,
  topics,
  completedTopics,
  notes,
  onNotesChange,
  onToggleComplete,
  practiceProgress,
  onTogglePractice,
  onBack,
  onLessonOpen,
}) {
  // Hooks must run unconditionally — extract safe values first
  const lessonId = lessonContext?.lessonId ?? '';
  const phaseId  = lessonContext?.phaseId  ?? '';
  const lessonPos = useLessonPosition(lessonId, phaseId);

  if (!lessonContext) return null;

  const { topicId, type, lessonTitle, phaseTitle, phaseShortTitle, moduleTitle } = lessonContext;
  const topic = topicId ? topics.find(t => t.id === topicId) : null;

  // Navigate forward to a sibling lesson by ID, or fall back to the learning path
  function handleNavigateLesson(targetLessonId) {
    if (!targetLessonId) { onBack?.(); return; }
    const ctx = findLessonCtx(targetLessonId);
    if (ctx && onLessonOpen) {
      onLessonOpen(ctx);
    } else {
      onBack?.();
    }
  }

  return (
    <div className="page page--lesson">
      {/* Breadcrumb */}
      <nav className="lesson-breadcrumb" aria-label="Breadcrumb">
        <button type="button" className="lesson-breadcrumb-back" onClick={onBack}>
          ← Learning Path
        </button>
        <span className="lesson-breadcrumb-sep" aria-hidden="true">›</span>
        <span className="lesson-breadcrumb-item">{phaseShortTitle ?? phaseTitle}</span>
        <span className="lesson-breadcrumb-sep" aria-hidden="true">›</span>
        <span className="lesson-breadcrumb-item">{moduleTitle}</span>
        <span className="lesson-breadcrumb-sep" aria-hidden="true">›</span>
        <span className="lesson-breadcrumb-current" aria-current="page">{lessonTitle}</span>
      </nav>

      {/* Progress indicator */}
      <LessonProgressIndicator
        {...lessonPos}
        phaseTitle={phaseShortTitle ?? phaseTitle}
      />

      {/* Lesson content */}
      {type === 'guide' ? (
        <GuideLessonContent
          ctx={lessonContext}
          onBack={onBack}
          onNavigate={handleNavigateLesson}
          onToggleComplete={onToggleComplete}
          completedTopics={completedTopics}
        />
      ) : topic ? (
        <>
          <TopicDetails
            topic={topic}
            completed={!!(completedTopics ?? {})[topicId]}
            notes={notes?.[topicId] ?? ''}
            onNotesChange={onNotesChange}
            onToggleComplete={onToggleComplete}
            practiceProgress={practiceProgress}
            onTogglePractice={onTogglePractice}
            onSelectTopic={onBack}
          />
          <div className="lesson-page-footer">
            <button type="button" className="lesson-back-btn" onClick={onBack}>
              ← Back to Learning Path
            </button>
          </div>
        </>
      ) : (
        <BodyLessonContent ctx={lessonContext} onBack={onBack} />
      )}
    </div>
  );
});

export default LessonPage;
