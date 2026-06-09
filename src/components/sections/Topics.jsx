import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { EmptyState } from '../ui/EmptyState.jsx';
import { learningPathPhases } from '../../data/learningPath.js';
import { computeLearningPathProgress } from '../../utils/learningPathProgress.js';
import { recommendSimulator } from '../../data/adfLearning.js';

// ─── Phase visual metadata ────────────────────────────────────────────────────
const PHASE_META = {
  'lp-foundations':             { label: 'Foundations', color: '#2f756e', icon: '▦' },
  'lp-de-core':                 { label: 'DE Core',     color: '#476b84', icon: '▧' },
  'lp-azure-foundations':       { label: 'Azure',       color: '#0078d4', icon: '☁' },
  'lp-spark-lakehouse':         { label: 'Lakehouse',   color: '#d97706', icon: '⚡' },
  'lp-enterprise-analytics':    { label: 'Analytics',   color: '#6b7cdb', icon: '◫' },
  'lp-production-engineering':  { label: 'Production',  color: '#0f766e', icon: '▣' },
  'lp-career-system-design':    { label: 'Career',      color: '#c2410c', icon: '◇' },
};

// ─── Filter chips ─────────────────────────────────────────────────────────────
const FILTER_CHIPS = [
  { id: 'all',        label: 'All' },
  { id: 'foundation', label: 'Foundations' },
  { id: 'azure',      label: 'Azure' },
  { id: 'lakehouse',  label: 'Lakehouse' },
  { id: 'analytics',  label: 'Analytics' },
  { id: 'production', label: 'Production' },
  { id: 'career',     label: 'Career' },
];

function moduleMatchesFilter(mod, filterId) {
  if (filterId === 'all') return true;
  const p = mod.phaseId;
  if (filterId === 'foundation') return ['lp-foundations', 'lp-de-core'].includes(p);
  if (filterId === 'azure')      return p === 'lp-azure-foundations';
  if (filterId === 'lakehouse')  return p === 'lp-spark-lakehouse';
  if (filterId === 'analytics')  return p === 'lp-enterprise-analytics';
  if (filterId === 'production') return p === 'lp-production-engineering';
  if (filterId === 'career')     return p === 'lp-career-system-design';
  return true;
}

// ─── CTA label + state helpers ────────────────────────────────────────────────
const CTA_LABEL = {
  locked:       'Locked',
  completed:    'Review',
  'in-progress':'Continue',
  available:    'Start',
};

// ─── Module Card ──────────────────────────────────────────────────────────────
function ModuleCard({ mod, isRecommended, onCTA, currentLessonId, onToggle, isExpanded, lessonStatus, onNavigate }) {
  const phase  = PHASE_META[mod.phaseId] ?? { label: mod.phaseTitle, color: '#10b981', icon: '◎' };
  const cta    = CTA_LABEL[mod.state] ?? 'Start';
  const isLocked = mod.state === 'locked';

  return (
    <div
      className={[
        'lp-card',
        `lp-card--${mod.state}`,
        isRecommended && 'lp-card--recommended',
      ].filter(Boolean).join(' ')}
    >
      {/* Recommended ribbon */}
      {isRecommended && (
        <div className="lp-card-ribbon">Up next</div>
      )}

      {/* Completed check badge */}
      {mod.state === 'completed' && (
        <span className="lp-card-done-badge" aria-hidden="true">✓</span>
      )}

      {/* Top badges row */}
      <div className="lp-card-badges">
        <span className="lp-card-phase-tag" style={{ '--pc': phase.color }}>
          {phase.icon} {phase.label}
        </span>
        <span className="lp-card-diff-tag">{mod.difficulty ?? 'Intermediate'}</span>
      </div>

      {/* Title */}
      <h3 className="lp-card-title">
        {isLocked && <span className="lp-card-lock-icon" aria-hidden="true">🔒</span>}
        {mod.title}
      </h3>

      {/* Phase subtitle */}
      <p className="lp-card-phase-name">{mod.phaseTitle}</p>

      {/* Lesson count / locked msg */}
      <div className="lp-card-meta">
        {isLocked ? (
          <span className="lp-card-locked-hint">Complete current phase to unlock</span>
        ) : (
          <>
            <span className="lp-card-meta-lessons">
              {mod.done} / {mod.total} lessons complete
            </span>
            {mod.total > 0 && mod.done < mod.total && mod.done > 0 && (
              <span className="lp-card-meta-rem">
                {mod.total - mod.done} remaining
              </span>
            )}
          </>
        )}
      </div>

      {/* Progress bar */}
      {!isLocked && (
        <div className="lp-card-progress">
          <div className="lp-card-progress-track">
            <div
              className="lp-card-progress-fill"
              style={{ width: `${mod.pct}%` }}
            />
          </div>
          <span className="lp-card-progress-pct">{mod.pct}%</span>
        </div>
      )}

      {/* Expand toggle for lesson list */}
      {!isLocked && (
        <button
          type="button"
          className="lp-card-expand-btn"
          onClick={() => onToggle(mod._key)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? `Hide lessons ↑` : `See all ${mod.total} lessons ↓`}
        </button>
      )}

      {/* Expanded lesson list */}
      {isExpanded && !isLocked && (
        <ul className="lp-card-lessons">
          {mod.lessons.map(lesson => {
            const status  = lessonStatus(lesson);
            const isActive = lesson.id === currentLessonId;
            return (
              <li
                key={lesson.id}
                className={[
                  'lp-card-lesson',
                  `lp-card-lesson--${status}`,
                  isActive && 'lp-card-lesson--active',
                ].filter(Boolean).join(' ')}
                onClick={() => !isLocked && !lesson.labPage && onCTA(mod, lesson)}
              >
                <span className="lp-card-lesson-dot" aria-hidden="true">
                  {status === 'completed' || status === 'mastered' ? '✓' :
                   status === 'in-progress' ? '▶' : '○'}
                </span>
                <span className="lp-card-lesson-title">{lesson.title}</span>
                {lesson.label && <span className="lp-card-lesson-label">{lesson.label}</span>}
                {lesson.labPage && (
                  <button
                    type="button"
                    className="lp-card-lesson-lab-btn"
                    onClick={e => { e.stopPropagation(); onNavigate?.(lesson.labPage); }}
                    aria-label={`Open practice lab for ${lesson.title}`}
                  >
                    Practice Lab →
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* CTA footer */}
      <div className="lp-card-footer">
        <button
          type="button"
          className={`lp-card-cta lp-card-cta--${mod.state}`}
          onClick={() => !isLocked && onCTA(mod)}
          disabled={isLocked}
          aria-label={`${cta} ${mod.title}`}
        >
          {cta}
          {!isLocked && <span className="lp-cta-arrow" aria-hidden="true"> →</span>}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const Topics = memo(function Topics({
  topics,
  topicStates,
  completedTopics,
  onLessonOpen,
  onNavigate,
  searchTerm,
  currentLessonId,
}) {
  const sectionRef = useRef(null);
  const completed  = completedTopics ?? {};
  const [filterChip, setFilterChip]   = useState('all');
  const [expandedKey, setExpandedKey] = useState(null);

  // ── Lesson helpers (unchanged from original) ────────────────────────────────
  const lessonStatus = useCallback(lesson => {
    if (lesson.type === 'guide') return completed[lesson.id] ? 'completed' : 'available';
    if (lesson.topicId) return topicStates?.[lesson.topicId]?.state ?? 'available';
    if (lesson.section) return 'available';
    return 'available';
  }, [topicStates, completed]);

  const lessonPct = useCallback(lesson => {
    if (lesson.topicId) return topicStates?.[lesson.topicId]?.masteryPct ?? 0;
    return 0;
  }, [topicStates]);

  const computePhaseProgress = useCallback(phase => {
    const allLessons   = phase.modules.flatMap(m => m.lessons);
    const guideLessons = allLessons.filter(l => l.type === 'guide');
    const topicLessons = allLessons.filter(l => l.topicId);
    if (topicLessons.length === 0 && guideLessons.length > 0) {
      const doneCount = guideLessons.filter(l => !!completed[l.id]).length;
      return Math.round((doneCount / guideLessons.length) * 100);
    }
    const trackable = topicLessons;
    if (!trackable.length) return 0;
    const total = trackable.reduce((sum, l) => {
      const state = topicStates?.[l.topicId]?.state;
      if (state === 'mastered' || state === 'completed') return sum + 100;
      return sum + lessonPct(l);
    }, 0);
    return Math.round(total / trackable.length);
  }, [lessonPct, topicStates, completed]);

  // ── Phases + module flattening ──────────────────────────────────────────────
  const pathPhases = useMemo(() => {
    const q = searchTerm?.trim().toLowerCase() ?? '';
    return learningPathPhases.map(phase => ({
      ...phase,
      progress: computePhaseProgress(phase),
    })).filter(phase => !q || phase.title.toLowerCase().includes(q));
  }, [searchTerm, computePhaseProgress]);

  const currentPhaseIndex = useMemo(() => {
    const idx = pathPhases.findIndex(p => p.progress < 100);
    return idx >= 0 ? idx : Math.max(0, pathPhases.length - 1);
  }, [pathPhases]);

  // Build flat list of enriched module objects
  const allModules = useMemo(() => {
    const q = searchTerm?.trim().toLowerCase() ?? '';
    return pathPhases.flatMap((phase, phaseIndex) => {
      const isLocked = !searchTerm && phaseIndex > currentPhaseIndex;
      return phase.modules
        .map(module => {
          const filteredLessons = q
            ? module.lessons.filter(l =>
                l.title?.toLowerCase().includes(q) ||
                l.body?.toLowerCase().includes(q) ||
                l.label?.toLowerCase().includes(q)
              )
            : module.lessons;
          if (q && filteredLessons.length === 0) return null;

          const done   = isLocked ? 0 : filteredLessons.filter(l => {
            const s = lessonStatus(l);
            return s === 'completed' || s === 'mastered';
          }).length;
          const inProg = isLocked ? 0 : filteredLessons.filter(l =>
            lessonStatus(l) === 'in-progress'
          ).length;
          const total  = filteredLessons.length;
          const pct    = total > 0 ? Math.round((done / total) * 100) : 0;

          let state = 'available';
          if (isLocked)                          state = 'locked';
          else if (done === total && total > 0)  state = 'completed';
          else if (done > 0 || inProg > 0)       state = 'in-progress';

          return {
            ...module,
            lessons:    filteredLessons,
            _key:       `${phase.id}::${module.id}`,
            phaseId:    phase.id,
            phaseTitle: phase.shortTitle ?? phase.title,
            difficulty: phase.difficulty,
            isLocked,
            isCurrent:  phaseIndex === currentPhaseIndex,
            state,
            done,
            total,
            pct,
            phase,
          };
        })
        .filter(Boolean);
    });
  }, [pathPhases, currentPhaseIndex, lessonStatus, searchTerm]);

  const visibleModules = useMemo(() =>
    allModules.filter(m => moduleMatchesFilter(m, filterChip)),
    [allModules, filterChip]
  );

  // Overall stats use the same lesson-based progress model as the sidebar.
  const pathProgress = useMemo(
    () => computeLearningPathProgress({
      completedMap: completed,
      topicStates,
    }),
    [completed, topicStates]
  );
  const totalModules     = pathProgress.totalModules;
  const completedModules = pathProgress.completedModules;
  const overallPct       = pathProgress.overallPct;

  // Recommended = first non-completed, non-locked module in the current phase
  const recommendedKey = useMemo(() => {
    const mod = allModules.find(m => !m.isLocked && m.state !== 'completed');
    return mod?._key ?? null;
  }, [allModules]);

  // Open first available lesson in a module
  function handleModuleCTA(mod, specificLesson = null) {
    if (mod.isLocked) return;
    const target = specificLesson ?? (
      mod.lessons.find(l => {
        const s = lessonStatus(l);
        return s !== 'completed' && s !== 'mastered';
      }) ?? mod.lessons[0]
    );
    if (!target) return;

    if (target.section) {
      onNavigate?.(target.section);
      return;
    }

    // Build lesson context
    const allInPhase = mod.phase.modules.flatMap(m => m.lessons);
    const idx  = allInPhase.findIndex(l => l.id === target.id);
    const next = allInPhase[idx + 1] ?? null;

    onLessonOpen?.({
      lessonId:        target.id,
      lessonTitle:     target.title,
      topicId:         target.topicId ?? null,
      type:            target.type ?? 'lesson',
      guide:           target.guide ?? null,
      body:            target.body ?? null,
      tools:           target.tools ?? [],
      label:           target.label ?? null,
      difficulty:      target.difficulty ?? null,
      section:         target.section ?? null,
      phaseId:         mod.phase.id,
      phaseTitle:      mod.phase.title,
      phaseShortTitle: mod.phase.shortTitle,
      moduleId:        mod.id,
      moduleTitle:     mod.title,
      nextLesson: next ? { id: next.id, title: next.title, reason: `Continue ${mod.phaseTitle}` } : null,
    });
  }

  useEffect(() => {
    if (!searchTerm || !sectionRef.current) return;
    sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [searchTerm]);

  const recommendedMod = allModules.find(m => m._key === recommendedKey);

  return (
    <section className="section" id="topics" ref={sectionRef}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="lp-header">
        <div className="lp-header-left">
          <p className="eyebrow">Guided Bootcamp</p>
          <h2 className="lp-header-title">Learning Path</h2>
          <p className="lp-header-sub">
            Follow the Senior Azure Data Engineer path from SQL foundations to production systems and interviews.
          </p>
        </div>
        <div className="lp-header-right">
          <div className="lp-overall-ring">
            <svg viewBox="0 0 36 36" className="lp-ring-svg" aria-hidden="true">
              <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="2.5" className="lp-ring-track" />
              <circle
                cx="18" cy="18" r="15.5"
                fill="none" strokeWidth="2.5"
                className="lp-ring-fill"
                strokeDasharray={`${overallPct} ${100 - overallPct}`}
                strokeDashoffset="25"
              />
            </svg>
            <span className="lp-ring-pct">{overallPct}%</span>
          </div>
          <div className="lp-overall-labels">
            <span className="lp-overall-count">{completedModules}/{totalModules}</span>
            <span className="lp-overall-sub">modules done</span>
          </div>
        </div>
      </div>

      {/* ── Up Next Banner ──────────────────────────────────────────────────── */}
      {recommendedMod && !searchTerm && (
        <div className="lp-next-banner">
          <div className="lp-next-banner-left">
            <span className="lp-next-kicker">Continue where you left off</span>
            <strong className="lp-next-title">{recommendedMod.title}</strong>
            <span className="lp-next-meta">
              {recommendedMod.phaseTitle}
              {' · '}
              {recommendedMod.total - recommendedMod.done} lesson{recommendedMod.total - recommendedMod.done !== 1 ? 's' : ''} remaining
            </span>
          </div>
          <button
            type="button"
            className="lp-next-cta"
            onClick={() => handleModuleCTA(recommendedMod)}
          >
            {recommendedMod.state === 'available' ? 'Start' : 'Continue'} →
          </button>
        </div>
      )}

      {/* ── Next Recommended Simulator (Learn → Simulate bridge) ───────────────── */}
      {!searchTerm && (() => {
        const rec = recommendSimulator(completed);
        if (!rec) return null;
        return (
          <div className="lp-next-banner lp-sim-banner">
            <div className="lp-next-banner-left">
              <span className="lp-next-kicker">Next recommended simulator · {rec.pct}% ready</span>
              <strong className="lp-next-title">{rec.title}</strong>
              <span className="lp-next-meta">Practice what you've learned in the Workplace Simulator</span>
            </div>
            <button
              type="button"
              className="lp-next-cta"
              onClick={() => onNavigate?.('workplace')}
            >
              Open Simulator →
            </button>
          </div>
        );
      })()}

      {/* ── Filter pills ────────────────────────────────────────────────────── */}
      <div className="lp-filter-bar" role="group" aria-label="Filter by category">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.id}
            type="button"
            className={`lp-chip${filterChip === chip.id ? ' lp-chip--active' : ''}`}
            onClick={() => { setFilterChip(chip.id); setExpandedKey(null); }}
            aria-pressed={filterChip === chip.id}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Module grid ─────────────────────────────────────────────────────── */}
      {visibleModules.length === 0 ? (
        <EmptyState
          icon="▦"
          title={searchTerm ? `No lessons match "${searchTerm}"` : 'No modules match this filter'}
          body="Try All to see every module."
          variant="compact"
        />
      ) : (
        <div className="lp-grid">
          {visibleModules.map(mod => (
            <ModuleCard
              key={mod._key}
              mod={mod}
              isRecommended={mod._key === recommendedKey}
              onCTA={handleModuleCTA}
              currentLessonId={currentLessonId}
              onToggle={key => setExpandedKey(p => p === key ? null : key)}
              isExpanded={expandedKey === mod._key}
              lessonStatus={lessonStatus}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </section>
  );
});

export default Topics;
