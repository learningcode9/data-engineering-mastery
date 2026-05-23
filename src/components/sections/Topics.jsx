import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { EmptyState } from '../ui/EmptyState.jsx';
import { learningPathPhases } from '../../data/learningPath.js';

// ── Phase outcomes — motivational "you will be able to" copy ─────────────────
const PHASE_OUTCOMES = {
  'lp-orientation': [
    'Explain what a data engineer does and how pipelines work',
    'Describe ETL vs ELT, batch vs streaming, and warehouse vs lake',
    'Understand the modern data stack before touching any tool',
    'Answer "What does a data engineer do?" confidently in any interview',
  ],
  'lp-sql': [
    'Write SQL queries with SELECT, JOINs, GROUP BY, and window functions',
    'Aggregate and validate data the way every production pipeline does',
    'Pass SQL interview screens at entry-to-mid level',
  ],
  'lp-engineering-foundations': [
    'Write Python scripts for data extraction and transformation',
    'Use Git for version control, branching, and pull requests',
    'Navigate Linux servers and schedule jobs with cron',
    'Extract data from REST APIs with pagination and error handling',
  ],
  'lp-intermediate': [
    'Build batch pipelines with watermarks and idempotent writes',
    'Model data in star schema with SCD Type 2',
    'Write PySpark jobs for distributed transformation',
    'Tune Spark performance with partitioning and broadcast joins',
  ],
  'lp-cloud': [
    'Build end-to-end pipelines in Azure Data Factory and Databricks',
    'Orchestrate multi-step DAGs in Airflow with retries and alerts',
    'Design a Medallion Architecture lakehouse (Bronze → Silver → Gold)',
    'Deploy and monitor production-grade data pipelines',
  ],
  'lp-streaming': [
    'Build real-time event pipelines with Apache Kafka',
    'Capture every database change using CDC patterns',
    'Write fault-tolerant Structured Streaming jobs in Spark',
    'Design event-driven architectures with exactly-once semantics',
  ],
  'lp-career': [
    'Build 3+ end-to-end portfolio projects you can demo in interviews',
    'Tell compelling STAR stories about data systems you designed',
    'Pass SQL, Spark, and system design rounds at DE-level',
    'Have a polished DE resume and LinkedIn ready for applications',
  ],
};

// ── Skills preview for locked phases ─────────────────────────────────────────
const PHASE_SKILLS = {
  'lp-orientation': ['Pipeline concepts', 'ETL vs ELT', 'Batch vs Streaming', 'Modern data stack'],
  'lp-sql':         ['SELECT / WHERE', 'JOINs', 'GROUP BY', 'Window functions'],
  'lp-engineering-foundations': ['Python', 'Git', 'Linux CLI', 'REST APIs'],
  'lp-intermediate': ['Advanced SQL', 'Data Modeling', 'PySpark', 'Incremental loads'],
  'lp-cloud':       ['Azure ADF', 'Databricks', 'Airflow', 'Medallion Architecture'],
  'lp-streaming':   ['Apache Kafka', 'CDC', 'Structured Streaming', 'Event Hubs'],
  'lp-career':      ['Portfolio projects', 'SQL interviews', 'System design', 'Resume'],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function matchesTopic(topic, q) {
  if (!q) return true;
  const lc = q.toLowerCase();
  return (
    topic.title?.toLowerCase().includes(lc) ||
    topic.body?.toLowerCase().includes(lc) ||
    topic.category?.toLowerCase().includes(lc)
  );
}

function matchesLesson(lesson, topics, q) {
  if (!q) return true;
  const lc = q.toLowerCase();
  if (lesson.title.toLowerCase().includes(lc)) return true;
  if (lesson.body?.toLowerCase().includes(lc)) return true;
  if (lesson.tools?.join(' ').toLowerCase().includes(lc)) return true;
  if (lesson.topicId) {
    const topic = topics.find(t => t.id === lesson.topicId);
    if (topic && matchesTopic(topic, q)) return true;
  }
  return false;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function PhaseOutcomesHero({ phase }) {
  const outcomes = PHASE_OUTCOMES[phase.id] ?? [];
  return (
    <div className="path-phase-outcomes">
      <div className="path-phase-outcomes-header">
        <span className="path-outcomes-kicker">By the end of this phase you will be able to</span>
      </div>
      <ul className="path-outcomes-list">
        {outcomes.map((o, i) => (
          <li key={i}>
            <span className="path-outcomes-check" aria-hidden="true">✓</span>
            <span>{o}</span>
          </li>
        ))}
      </ul>
      <div className="path-phase-meta-row">
        <span className="path-phase-meta-chip path-phase-meta-chip--time">
          {phase.estimatedTime}
        </span>
        <span className="path-phase-meta-chip path-phase-meta-chip--diff">
          {phase.difficulty}
        </span>
        <span className="path-phase-meta-chip path-phase-meta-chip--interview">
          Interview: {phase.interviewImportance.split('.')[0]}
        </span>
      </div>
    </div>
  );
}

function PhaseLockedPreview({ phase, prevPhaseTitle }) {
  const skills = PHASE_SKILLS[phase.id] ?? [];
  return (
    <div className="path-phase-locked-preview">
      <p className="path-locked-unlock-msg">
        Complete <strong>{prevPhaseTitle}</strong> to unlock this phase
      </p>
      {skills.length > 0 && (
        <div className="path-locked-skills">
          {skills.map(s => (
            <span key={s} className="path-locked-skill-chip">{s}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function PhaseTransitionFooter({ nextPhase }) {
  if (!nextPhase) return null;
  const nextSkills = PHASE_SKILLS[nextPhase.id] ?? [];
  return (
    <div className="path-phase-transition">
      <div className="path-transition-label">
        <span className="path-transition-arrow" aria-hidden="true">↓</span>
        <div>
          <span className="path-transition-kicker">Next phase unlocks when you finish this one</span>
          <strong>{nextPhase.title}</strong>
        </div>
      </div>
      {nextSkills.length > 0 && (
        <div className="path-transition-skills">
          {nextSkills.slice(0, 3).map(s => (
            <span key={s} className="path-locked-skill-chip">{s}</span>
          ))}
          {nextSkills.length > 3 && <span className="path-locked-skill-chip">+{nextSkills.length - 3} more</span>}
        </div>
      )}
    </div>
  );
}

function RoadmapConnector({ isComplete, isCurrent }) {
  return (
    <div className={[
      'path-roadmap-connector',
      isComplete && 'path-roadmap-connector--done',
      isCurrent  && 'path-roadmap-connector--active',
    ].filter(Boolean).join(' ')}>
      <div className="path-connector-track">
        <div className="path-connector-line" />
        <div className="path-connector-dot" aria-hidden="true">
          {isComplete ? '✓' : '↓'}
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
const Topics = memo(function Topics({
  topics,
  topicStates,
  onLessonOpen,
  onNavigate,
  searchTerm,
  currentLessonId,
}) {
  const sectionRef = useRef(null);

  const lessonStatus = useCallback(lesson => {
    if (lesson.type === 'guide') return 'available';
    if (lesson.topicId) return topicStates?.[lesson.topicId]?.state ?? 'available';
    if (lesson.section) return 'available';
    return 'available';
  }, [topicStates]);

  const lessonPct = useCallback(lesson => {
    if (lesson.topicId) return topicStates?.[lesson.topicId]?.masteryPct ?? 0;
    return 0;
  }, [topicStates]);

  const computePhaseProgress = useCallback(phase => {
    const trackable = phase.modules.flatMap(m => m.lessons).filter(l => l.topicId);
    if (!trackable.length) return 0;
    const total = trackable.reduce((sum, l) => {
      const state = topicStates?.[l.topicId]?.state;
      if (state === 'mastered') return sum + 100;
      if (state === 'completed') return sum + Math.max(70, lessonPct(l));
      return sum + lessonPct(l);
    }, 0);
    return Math.round(total / trackable.length);
  }, [lessonPct, topicStates]);

  const pathPhases = useMemo(() => {
    const q = searchTerm?.trim().toLowerCase() ?? '';
    return learningPathPhases
      .map(phase => ({
        ...phase,
        progress: computePhaseProgress(phase),
        modules: phase.modules
          .map(module => ({
            ...module,
            lessons: module.lessons.filter(l => matchesLesson(l, topics, q)),
          }))
          .filter(m => m.lessons.length > 0),
      }))
      .filter(phase => {
        if (!q) return true;
        return phase.modules.length > 0 || phase.title.toLowerCase().includes(q);
      });
  }, [topics, searchTerm, computePhaseProgress]);

  const currentPhaseIndex = useMemo(() => {
    const idx = pathPhases.findIndex(p => p.progress < 100);
    return idx >= 0 ? idx : Math.max(0, pathPhases.length - 1);
  }, [pathPhases]);

  const [openPhaseId, setOpenPhaseId] = useState(undefined);
  const autoOpenPhaseId = pathPhases[currentPhaseIndex]?.id ?? null;
  const visibleOpenPhaseId = openPhaseId === undefined ? autoOpenPhaseId : openPhaseId;

  useEffect(() => {
    if (!searchTerm || !sectionRef.current) return;
    sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [searchTerm]);

  const firstRecommendedLesson = useMemo(() => {
    const current = pathPhases[currentPhaseIndex];
    if (!current) return null;
    return current.modules
      .flatMap(m => m.lessons.map(l => ({
        ...l,
        phaseId: current.id,
        phaseTitle: current.title,
        phaseShortTitle: current.shortTitle,
        moduleTitle: m.title,
        moduleId: m.id,
      })))
      .find(l => ['available', 'in-progress'].includes(lessonStatus(l)))
      ?? current.modules[0]?.lessons[0];
  }, [pathPhases, currentPhaseIndex, lessonStatus]);

  function buildLessonCtx(lesson, phase, module) {
    // Compute next lesson within this phase for continuity CTA
    const allLessons = phase.modules.flatMap(m => m.lessons);
    const thisIdx = allLessons.findIndex(l => l.id === lesson.id);
    const nextInPhase = allLessons[thisIdx + 1] ?? null;
    const computedNext = nextInPhase
      ? { id: nextInPhase.id, title: nextInPhase.title, reason: `Continue ${phase.shortTitle ?? phase.title}` }
      : null;

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
      nextLesson:      lesson.nextLesson ?? computedNext,
    };
  }

  function handleLessonClick(lesson, phase, module) {
    if (lesson.section) {
      onNavigate?.(lesson.section);
      return;
    }
    onLessonOpen?.(buildLessonCtx(lesson, phase, module));
  }

  function renderLesson(lesson, phase, module, phaseLocked) {
    const status   = phaseLocked ? 'locked' : lessonStatus(lesson);
    const pct      = lessonPct(lesson);
    const isActive = lesson.id === currentLessonId;

    const statusLabel = {
      mastered:      'Mastered',
      completed:     'Complete',
      'in-progress': `${pct}%`,
      available:     'Start',
      locked:        'Soon',
    }[status] ?? 'Start';

    const statusIcon = {
      mastered:      '✓',
      completed:     '✓',
      'in-progress': '▶',
      available:     '◎',
      locked:        '◇',
    }[status] ?? '◎';

    return (
      <button
        key={lesson.id}
        type="button"
        className={[
          'path-lesson',
          `path-lesson--${status}`,
          isActive && 'path-lesson--active',
        ].filter(Boolean).join(' ')}
        onClick={() => !phaseLocked && status !== 'locked' && handleLessonClick(lesson, phase, module)}
        disabled={phaseLocked || status === 'locked'}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={`path-lesson-status path-lesson-status--${status}`} aria-hidden="true">
          {statusIcon}
        </span>
        <span className="path-lesson-copy">
          <strong>{lesson.title}</strong>
          <span>{lesson.label ?? lesson.difficulty ?? 'Lesson'}</span>
          {lesson.tools?.length > 0 && (
            <span className="path-lesson-tools">{lesson.tools.join(' · ')}</span>
          )}
        </span>
        <span className={`path-lesson-pill path-lesson-pill--${status}`}>{statusLabel}</span>
      </button>
    );
  }

  const completedCount = pathPhases.filter(p => p.progress >= 100).length;
  const totalPhases    = pathPhases.length;

  return (
    <section className="section" id="topics" ref={sectionRef}>

      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Guided Bootcamp</p>
          <h2>Learning Path</h2>
          <p className="section-subtitle">
            Concepts before tools — each phase builds on the last.
          </p>
        </div>
        <div className="path-header-stats">
          <span className="path-stat-phases">{completedCount}/{totalPhases} phases</span>
          <div className="path-overall-track">
            <div
              className="path-overall-fill"
              style={{ width: `${totalPhases > 0 ? Math.round((completedCount / totalPhases) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Philosophy strip ────────────────────────────────────────────── */}
      {!searchTerm && (
        <div className="path-philosophy-strip">
          <span className="path-philosophy-icon" aria-hidden="true">◎</span>
          <p>We teach concepts before tools so you understand <em>why</em> systems exist before learning to build them. Complete each phase at your own pace — there is no deadline.</p>
        </div>
      )}

      {/* ── "Up next" recommendation ────────────────────────────────────── */}
      {firstRecommendedLesson && !searchTerm && (
        <div className="path-next-step">
          <div className="path-next-step-body">
            <p className="eyebrow">Up next for you</p>
            <strong>{firstRecommendedLesson.title}</strong>
            <span>
              {firstRecommendedLesson.moduleTitle}
              {firstRecommendedLesson.label ? ` · ${firstRecommendedLesson.label}` : ''}
            </span>
          </div>
          <button
            type="button"
            className="path-next-cta"
            onClick={() => {
              const phase  = pathPhases[currentPhaseIndex];
              const module = phase?.modules.find(m =>
                m.lessons.some(l => l.id === (firstRecommendedLesson.lessonId ?? firstRecommendedLesson.id))
              );
              handleLessonClick(
                firstRecommendedLesson,
                phase ?? pathPhases[0],
                module ?? phase?.modules[0],
              );
            }}
          >
            Open lesson →
          </button>
        </div>
      )}

      {/* ── Phase list ──────────────────────────────────────────────────── */}
      {pathPhases.length === 0 ? (
        <EmptyState
          icon="▦"
          title={`No lessons match "${searchTerm}"`}
          body="Try searching for SQL, Spark, Python, Delta Lake, or Kafka."
          variant="compact"
        />
      ) : (
        <div className="learning-path-shell">
          {pathPhases.map((phase, phaseIndex) => {
            const isOpen     = searchTerm ? true : visibleOpenPhaseId === phase.id;
            const isComplete = phase.progress >= 100;
            const isCurrent  = phaseIndex === currentPhaseIndex;
            const isLocked   = !searchTerm && phaseIndex > currentPhaseIndex;
            const nextPhase  = pathPhases[phaseIndex + 1] ?? null;
            const prevPhase  = pathPhases[phaseIndex - 1] ?? null;

            return (
              <div key={phase.id} className="path-phase-wrapper">
                <article
                  className={[
                    'path-phase-card',
                    isOpen     && 'path-phase-card--open',
                    isCurrent  && 'path-phase-card--current',
                    isComplete && 'path-phase-card--complete',
                    isLocked   && 'path-phase-card--locked',
                  ].filter(Boolean).join(' ')}
                >
                  {/* Phase header */}
                  <button
                    type="button"
                    className="path-phase-header"
                    onClick={() => !isLocked && setOpenPhaseId(isOpen ? null : phase.id)}
                    aria-expanded={isOpen}
                    disabled={isLocked}
                  >
                    <span className={`path-phase-index${isComplete ? ' path-phase-index--done' : ''}`} aria-hidden="true">
                      {isComplete ? '✓' : phaseIndex + 1}
                    </span>

                    <span className="path-phase-copy">
                      <span className="path-phase-kicker">
                        {isLocked   ? 'Upcoming'
                         : isCurrent ? 'Current phase'
                         : isComplete ? 'Completed'
                         : 'Phase'}
                      </span>
                      <strong>{phase.title}</strong>
                      <span>{phase.why}</span>
                    </span>

                    <span className="path-phase-progress">
                      {isLocked ? (
                        <span className="path-phase-progress-locked">Locked</span>
                      ) : (
                        <>
                          <span className="path-phase-progress-pct">{phase.progress}%</span>
                          <span className="path-phase-track">
                            <span style={{ width: `${phase.progress}%` }} />
                          </span>
                        </>
                      )}
                    </span>
                  </button>

                  {/* Locked preview — upcoming content teaser */}
                  {isLocked && !searchTerm && (
                    <PhaseLockedPreview
                      phase={phase}
                      prevPhaseTitle={prevPhase?.shortTitle ?? prevPhase?.title ?? 'the previous phase'}
                    />
                  )}

                  {/* Phase body (open + unlocked) */}
                  {isOpen && !isLocked && (
                    <div className="path-phase-body">
                      <PhaseOutcomesHero phase={phase} />

                      <div className="path-modules">
                        {phase.modules.map(module => (
                          <section key={module.id} className="path-module">
                            <div className="path-module-header">
                              <h3>{module.title}</h3>
                              <span>{module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="path-lessons">
                              {module.lessons.map(lesson => renderLesson(lesson, phase, module, false))}
                            </div>
                          </section>
                        ))}
                      </div>

                      {/* Transition footer pointing to next phase */}
                      {!searchTerm && (
                        <PhaseTransitionFooter
                          currentPhase={phase}
                          nextPhase={nextPhase}
                        />
                      )}
                    </div>
                  )}
                </article>

                {/* Roadmap connector between phases */}
                {phaseIndex < pathPhases.length - 1 && !searchTerm && (
                  <RoadmapConnector
                    isComplete={isComplete}
                    isCurrent={isCurrent}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
});

export default Topics;
