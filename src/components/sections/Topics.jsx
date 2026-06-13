import { memo, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { TopicCard } from '../ui/Card.jsx';
import { EmptyState } from '../ui/EmptyState.jsx';
import {
  aiLearningPathPhases,
  learningPathPhases,
  optionalTechnologyPhases,
} from '../../data/learningPath.js';
import { getCurriculumTopicMeta } from '../../data/curriculum.js';
import { computeLearningPathProgress } from '../../utils/learningPathProgress.js';
import { recommendSimulator } from '../../data/adfLearning.js';

// ─── Phase visual metadata ────────────────────────────────────────────────────
const PHASE_META = {
  'phase-1-foundations':                      { label: 'Foundations', color: '#2f756e', icon: '▦' },
  'phase-2-data-engineering-core':            { label: 'DE Core',     color: '#476b84', icon: '▧' },
  'phase-3-azure-foundations':                { label: 'Azure',       color: '#0078d4', icon: '☁' },
  'phase-4-microsoft-fabric':                 { label: 'Fabric',      color: '#6b7cdb', icon: '◫' },
  'phase-5-spark-lakehouse':                  { label: 'Lakehouse',   color: '#d97706', icon: '⚡' },
  'phase-6-production-engineering-finops':    { label: 'Production',  color: '#0f766e', icon: '▣' },
  'phase-7-advanced-streaming-cdc':           { label: 'Streaming',   color: '#0f766e', icon: '◉' },
  'phase-8-enterprise-architecture-governance': { label: 'Architecture', color: '#c2410c', icon: '◇' },
  'phase-9-career-readiness':                 { label: 'Career',      color: '#c2410c', icon: '◇' },
  'ai-track':                                 { label: 'AI',          color: '#6b7cdb', icon: '◉' },
  'optional-technologies':                    { label: 'Optional',    color: '#64748b', icon: '◎' },
};

// ─── Filter chips ─────────────────────────────────────────────────────────────
const FILTER_CHIPS = [
  { id: 'all',        label: 'All' },
  { id: 'foundation', label: 'Foundations' },
  { id: 'azure',      label: 'Azure' },
  { id: 'lakehouse',  label: 'Lakehouse' },
  { id: 'analytics',  label: 'Fabric' },
  { id: 'production', label: 'Production' },
  { id: 'career',     label: 'Career' },
];

function phaseMatchesFilter(phase, filterId) {
  if (filterId === 'all') return true;
  const p = phase.id;
  if (filterId === 'foundation') return ['phase-1-foundations', 'phase-2-data-engineering-core'].includes(p);
  if (filterId === 'azure')      return p === 'phase-3-azure-foundations';
  if (filterId === 'lakehouse')  return ['phase-4-microsoft-fabric', 'phase-5-spark-lakehouse'].includes(p);
  if (filterId === 'analytics')  return p === 'phase-4-microsoft-fabric';
  if (filterId === 'production') return p === 'phase-6-production-engineering-finops';
  if (filterId === 'career')     return ['phase-8-enterprise-architecture-governance', 'phase-9-career-readiness'].includes(p);
  return true;
}

function phaseMatchesSearch(phase, query) {
  if (!query) return true;
  const phaseText = [
    phase.title,
    phase.shortTitle,
    phase.description,
    phase.exitCriteria,
    ...(phase.modules ?? []).flatMap(module => (module.lessons ?? []).flatMap(lesson => [
      lesson.title,
      lesson.body,
      lesson.label,
    ])),
  ].filter(Boolean).join(' ').toLowerCase();

  return phaseText.includes(query);
}

// ─── CTA label + state helpers ────────────────────────────────────────────────
const CTA_LABEL = {
  locked:       'Locked',
  completed:    'Review',
  'in-progress':'Continue',
  available:    'Start',
};

const TOPIC_SUMMARY_OVERRIDES = {
  'SQL Foundations': 'SELECT, filters, joins, aggregations, CTEs, and window functions.',
  'Python for Data Work': 'Files, functions, pandas basics, APIs, and automation scripts.',
  'Git Fundamentals': 'Branching, commits, pull requests, and collaboration workflow.',
  'Linux Basics': 'Shell commands, files, permissions, and environment basics.',
  'Data Modeling': 'Fact tables, dimensions, grain, keys, and SCD patterns.',
  'ETL Fundamentals': 'Extract, transform, load, validation, and incremental refresh.',
  'API & File Ingestion': 'Build ADF pipelines for REST APIs, files, retries, and landing zones.',
  'Data Quality': 'Checks, reconciliation, schema drift, and failure handling.',
  'Data Contracts': 'Schema expectations, versioning, ownership, and downstream safety.',
  'Metadata-driven Pipelines': 'Parameterize pipeline logic from config instead of hardcoding.',
  'ADLS Gen2': 'Organize bronze, silver, and gold data with secure storage.',
  'Azure Data Factory': 'Orchestrate ingestion, retries, dependencies, and monitoring.',
  'Synapse Basics': 'Use SQL pools, serverless queries, and warehouse concepts.',
  'Security & Key Vault': 'Protect credentials, secrets, RBAC, and access boundaries.',
  'Fabric Fundamentals': 'Work across OneLake, lakehouse, warehouse, and semantic layers.',
  OneLake: 'Centralize shared data storage across Fabric workloads.',
  Lakehouse: 'Blend lake storage and warehouse-style analytics.',
  Warehouse: 'Model curated analytics tables for reporting and BI.',
  'Semantic Models': 'Shape curated data for business metrics and reporting.',
  'Direct Lake': 'Query lake data with near-warehouse speed in Fabric.',
  'Real-Time Analytics': 'Explore event data with low-latency analytics.',
  Eventstream: 'Ingest and route events into Fabric destinations.',
  'Data Activator': 'Trigger alerts and actions from live data patterns.',
  'Governance in Fabric': 'Manage sharing, lineage, and access in Fabric.',
  'PySpark ETL': 'Transform dataframes, joins, partitions, and Spark SQL.',
  'Spark SQL': 'Use SQL patterns on distributed Spark and Delta tables.',
  'Delta Lake': 'Use ACID tables, MERGE, time travel, and schema evolution.',
  Databricks: 'Run notebooks, jobs, and scalable Spark pipelines.',
  'Lakehouse Optimization / Medallion Patterns': 'Design bronze, silver, and gold flows with tuned storage.',
  'CI/CD': 'Promote notebooks, pipelines, and configs across environments.',
  'Infrastructure as Code': 'Provision repeatable environments with declarative templates.',
  Monitoring: 'Track pipeline health, logs, alerts, and SLA signals.',
  'Data Observability': 'Measure freshness, volume, schema, and pipeline quality.',
  'Cost Optimization': 'Reduce compute spend with pruning, caching, and right-sizing.',
  'FinOps for Data Platforms': 'Track usage, budgets, and cost accountability.',
  'Production Support': 'Handle incidents, retries, and recovery for live pipelines.',
  'CDC Mastery': 'Capture changes, merge safely, and reconcile data.',
  Streaming: 'Design real-time flows with checkpoints and watermarking.',
  'Kafka Fundamentals': 'Use topics, partitions, and consumer groups for event streaming.',
  'Kafka vs Event Hubs': 'Choose the right event platform for your use case.',
  'Event-Driven Architecture': 'Build decoupled systems around events and async workflows.',
  'System Design': 'Plan scalable, secure, and observable data platforms.',
  'Data Lineage': 'Trace upstream and downstream dependencies.',
  Governance: 'Define ownership, access, cataloging, and compliance.',
  'Data Mesh': 'Organize data around domain ownership and products.',
  'Lakehouse Governance': 'Apply policy, access, and quality controls in lakehouse systems.',
  'HA/DR': 'Design failover, backup, and recovery for critical pipelines.',
  'Multi-Region Design': 'Keep pipelines and data available across regions.',
  'Interview Prep': 'Practice SQL, Azure, Spark, and scenario questions.',
  'Workplace Scenarios': 'Handle realistic work tickets and production changes.',
  'Stakeholder Communication': 'Explain risks, tradeoffs, and progress to business partners.',
  'Estimation & Planning': 'Scope tasks, sequence work, and set delivery expectations.',
  'LLM Fundamentals': 'Understand model basics, tokens, and practical AI usage.',
  'Prompt Engineering': 'Write prompts that are clear, scoped, and repeatable.',
  Embeddings: 'Represent text as vectors for search and retrieval.',
  'Vector Databases': 'Store and query embeddings efficiently.',
  RAG: 'Combine retrieval with generation for grounded answers.',
  'AI Data Pipelines': 'Prepare data flows that feed AI workloads safely.',
  'AI Evaluation & Guardrails': 'Measure quality, safety, and grounded outputs.',
  'AI Agents': 'Chain tools and decisions into agentic workflows.',
  'AWS Data Stack': 'Learn S3, Glue, and Redshift patterns for cross-cloud work.',
  Snowflake: 'Model and optimize warehouse workloads in Snowflake.',
  dbt: 'Build modular SQL models, tests, and documentation.',
  'Kafka Advanced': 'Tune partitions, consumers, and throughput at scale.',
};

function compactTopicSummary(topicTitle, rawSummary, phaseTitle) {
  const override = TOPIC_SUMMARY_OVERRIDES[topicTitle];
  if (override) return override;

  const text = (rawSummary ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return `Practice ${topicTitle.toLowerCase()} in the ${phaseTitle} phase.`;

  const genericMatch = text.match(/^Learn\s+(.+?)\s+as part of the .*$/i);
  if (genericMatch?.[1]) return `${genericMatch[1].replace(/^(the|a)\s+/i, '')}.`;

  const firstSentence = text.split(/(?<=[.!?])\s+/)[0].trim();
  if (!firstSentence) return `Practice ${topicTitle.toLowerCase()} in the ${phaseTitle} phase.`;
  if (firstSentence.length <= 88) return firstSentence;
  return `${firstSentence.slice(0, 85).trimEnd()}…`;
}

// ─── Phase card ──────────────────────────────────────────────────────────────
function PhaseCard({
  phase,
  isRecommended,
  onCTA,
  onToggle,
  isExpanded,
  currentLessonId,
  focusPhaseId,
  focusLessonId,
  lessonStatus,
  lessonPct,
}) {
  const phaseMeta = PHASE_META[phase.id] ?? { label: phase.shortTitle ?? phase.title, color: '#10b981', icon: '◎' };
  const isFocused = focusPhaseId === phase.id;
  const phaseLessons = phase.modules.flatMap((module, moduleIndex) => (
    module.lessons.map((lesson, lessonIndex) => ({ ...lesson, moduleId: module.id, moduleTitle: module.title, moduleIndex, lessonIndex }))
  ));
  const headerLabel = phase.state === 'completed'
    ? 'Review'
    : phase.state === 'in-progress'
      ? 'Continue'
      : 'Start';
  const phaseHours = phase.estimatedHours
    ? `${phase.estimatedHours}h`
    : `${Math.max(4, Math.ceil((phase.total || 1) * 4))}h`;

  return (
    <section
      id={phase.id}
      className={[
        'lp-card',
        'lp-phase-card',
        isExpanded ? 'lp-phase-card--expanded' : 'lp-phase-card--collapsed',
        `lp-card--${phase.state}`,
        isRecommended && 'lp-card--recommended',
        isFocused && 'lp-card--focused',
      ].filter(Boolean).join(' ')}
    >
      {isRecommended && <div className="lp-card-ribbon">Up next</div>}

      {phase.state === 'completed' && (
        <span className="lp-card-done-badge" aria-hidden="true">✓</span>
      )}

      <div className="lp-phase-head">
        <div className="lp-phase-head-copy">
          <div className="lp-card-badges">
            <span className="lp-card-phase-tag" style={{ '--pc': phaseMeta.color }}>
              {phaseMeta.icon} {phaseMeta.label}
            </span>
            <span className="lp-card-diff-tag">{phase.difficulty ?? 'Intermediate'}</span>
          </div>
          {isExpanded ? (
            <h3 className="lp-card-title">{phase.title}</h3>
          ) : (
            <div className="lp-phase-summary lp-phase-summary--collapsed">
              <div className="lp-phase-summary-line">
                <h3 className="lp-card-title lp-card-title--collapsed">{phase.title}</h3>
                <p className="lp-phase-inline-meta">
                  <span>{phase.total} Topics</span>
                  <span>•</span>
                  <span>{phaseHours}</span>
                  <span>•</span>
                  <span>{phase.done} / {phase.total} Complete</span>
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="lp-phase-head-actions">
          {phase.isCurrent && isExpanded && (
            <button
              type="button"
              className={`lp-card-head-cta lp-card-cta--${phase.state}`}
              onClick={() => onCTA(phase)}
              aria-label={`${headerLabel} ${phase.title}`}
            >
              {headerLabel}
              <span className="lp-cta-arrow" aria-hidden="true"> →</span>
            </button>
          )}
          <button
            type="button"
            className="lp-card-expand-btn lp-phase-toggle"
            onClick={() => onToggle?.(phase.id)}
            aria-expanded={isExpanded}
            aria-controls={`phase-body-${phase.id}`}
          >
            {isExpanded ? 'Collapse' : 'Expand'}
            <span className="lp-cta-arrow" aria-hidden="true"> ▾</span>
          </button>
        </div>
      </div>

      {isExpanded ? (
        <>
          <div className="lp-phase-summary lp-phase-summary--expanded">
            <div className="lp-phase-stats">
              <span className="lp-phase-stat">
                <strong>{phase.total}</strong>
                <small>topics</small>
              </span>
              <span className="lp-phase-stat">
                <strong>{phaseHours}</strong>
                <small>hours</small>
              </span>
              <span className="lp-phase-stat">
                <strong>{phase.pct}%</strong>
                <small>complete</small>
              </span>
            </div>
            <p className="lp-card-phase-name">{phase.description ?? phase.shortTitle}</p>
          </div>

          <div className="lp-phase-progress" aria-hidden="true">
            <div className="lp-phase-progress-track">
              <div className="lp-phase-progress-fill" style={{ width: `${phase.pct}%` }} />
            </div>
          </div>

          <div id={`phase-body-${phase.id}`} className="lp-topic-grid">
            {phaseLessons.map((lesson) => {
              const status = lessonStatus(lesson);
              const topicMeta = lesson.topicId ? getCurriculumTopicMeta(lesson.topicId) : null;
              const isActive = lesson.id === currentLessonId;
              const isFocusedLesson = focusLessonId === lesson.id;
              const topic = {
                id: lesson.id,
                title: lesson.title,
                body: compactTopicSummary(
                  lesson.title,
                  lesson.body ?? topicMeta?.summary ?? '',
                  phase.title ?? phase.shortTitle ?? 'this'
                ),
                label: lesson.label ?? phase.shortTitle ?? phase.title ?? 'Topic',
                topicState: status,
                masteryPct: lessonPct(lesson),
                timeEstimate: topicMeta?.estimatedHours
                  ? topicMeta.estimatedHours
                  : `${Math.max(4, Math.ceil((phase.estimatedHours ?? 48) / Math.max(1, phaseLessons.length || 1)))}h`,
                prerequisites: phase.prerequisites ?? [],
                interviewImportance: lesson.interviewImportance ?? null,
              };
              return (
                <div
                  key={lesson.id}
                  id={`topic-${lesson.id}`}
                  className={[
                    'lp-topic-wrap',
                    isFocusedLesson && 'lp-topic-wrap--focused',
                  ].filter(Boolean).join(' ')}
                >
                  <TopicCard
                    topic={topic}
                    selected={isActive || isFocusedLesson}
                    onClick={() => onCTA(phase, lesson)}
                  />
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
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
  focusTarget,
}) {
  const sectionRef = useRef(null);
  const focusScrollTimer = useRef(null);
  const focusClearTimer = useRef(null);
  const completed  = completedTopics ?? {};
  const [manualOpenPhaseIds, setManualOpenPhaseIds] = useState(() => new Set());
  const [manualClosedPhaseIds, setManualClosedPhaseIds] = useState(() => new Set());
  const [filterChip, setFilterChip]   = useState('all');
  const [focusPhaseId, setFocusPhaseId] = useState(null);
  const [focusLessonId, setFocusLessonId] = useState(null);
  const nextSimulator = !searchTerm ? recommendSimulator(completed) : null;

  // ── Lesson helpers (unchanged from original) ────────────────────────────────
  const lessonStatus = useCallback(lesson => {
    if (lesson.type === 'guide') return completed[lesson.id] ? 'completed' : 'available';
    if (lesson.topicId) {
      const state = topicStates?.[lesson.topicId]?.state ?? 'available';
      if (state === 'locked') return 'available';
      return state;
    }
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

  // ── Phases ────────────────────────────────────────────────────────────────
  const q = searchTerm?.trim().toLowerCase() ?? '';

  const currentPhaseIndex = useMemo(() => {
    const idx = learningPathPhases.findIndex(p => computePhaseProgress(p) < 100);
    return idx >= 0 ? idx : Math.max(0, learningPathPhases.length - 1);
  }, [computePhaseProgress]);

  const allPhases = useMemo(() => {
    return learningPathPhases.map((phase, phaseIndex) => {
      const lessons = phase.modules.flatMap((module, moduleIndex) =>
        module.lessons.map((lesson, lessonIndex) => {
          const topicMeta = lesson.topicId ? getCurriculumTopicMeta(lesson.topicId) : null;
          return {
            ...lesson,
            moduleId: module.id,
            moduleTitle: module.title,
            moduleIndex,
            lessonIndex,
            topicState: lessonStatus(lesson),
            masteryPct: lessonPct(lesson),
            body: compactTopicSummary(
              lesson.title,
              lesson.body ?? topicMeta?.summary ?? '',
              phase.title ?? phase.shortTitle ?? 'this'
            ),
            label: lesson.label ?? phase.shortTitle ?? phase.title ?? 'Topic',
            timeEstimate: topicMeta?.estimatedHours
              ? topicMeta.estimatedHours
              : `${Math.max(4, Math.ceil((phase.estimatedHours ?? 48) / Math.max(1, phase.modules.flatMap(m => m.lessons).length || 1)))}h`,
            prerequisites: phase.prerequisites ?? [],
            interviewImportance: lesson.interviewImportance ?? null,
          };
        })
      );

      const searchableText = [
        phase.title,
        phase.shortTitle,
        phase.description,
        phase.exitCriteria,
        ...lessons.flatMap(lesson => [lesson.title, lesson.body, lesson.label]),
      ].filter(Boolean).join(' ').toLowerCase();

      const matchesSearch = !q || searchableText.includes(q);
      const done = lessons.filter(lesson => {
        const status = lessonStatus(lesson);
        return status === 'completed' || status === 'mastered';
      }).length;
      const inProg = lessons.filter(lesson => lessonStatus(lesson) === 'in-progress').length;
      const total = lessons.length;
      const pct = computePhaseProgress(phase);
      let state = 'available';
      if (done === total && total > 0) state = 'completed';
      else if (done > 0 || inProg > 0) state = 'in-progress';

      return {
        ...phase,
        lessons,
        progress: pct,
        done,
        total,
        state,
        isCurrent: phaseIndex === currentPhaseIndex,
        matchesSearch,
      };
    });
  }, [lessonPct, lessonStatus, currentPhaseIndex, computePhaseProgress, q]);

  const visiblePhases = useMemo(() => {
    return allPhases.filter(phase => phase.matchesSearch && phaseMatchesFilter(phase, filterChip));
  }, [allPhases, filterChip]);

  const recommendedPhase = useMemo(() => {
    return allPhases.find(phase => phase.state !== 'completed') ?? allPhases[0] ?? null;
  }, [allPhases]);

  const autoOpenPhaseIds = useMemo(() => {
    const ids = new Set();
    if (recommendedPhase?.id) ids.add(recommendedPhase.id);
    if (searchTerm) visiblePhases.forEach(phase => ids.add(phase.id));
    if (focusPhaseId) ids.add(focusPhaseId);
    return ids;
  }, [recommendedPhase?.id, searchTerm, visiblePhases, focusPhaseId]);

  const openPhaseIds = useMemo(() => {
    const ids = new Set(autoOpenPhaseIds);
    manualOpenPhaseIds.forEach(id => ids.add(id));
    manualClosedPhaseIds.forEach(id => ids.delete(id));
    return ids;
  }, [autoOpenPhaseIds, manualOpenPhaseIds, manualClosedPhaseIds]);

  const handlePhaseToggle = useCallback((phaseId) => {
    const isOpen = openPhaseIds.has(phaseId);
    setManualOpenPhaseIds(prev => {
      const next = new Set(prev);
      if (isOpen) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
    setManualClosedPhaseIds(prev => {
      const next = new Set(prev);
      if (isOpen) next.add(phaseId);
      else next.delete(phaseId);
      return next;
    });
  }, [openPhaseIds]);

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

  // Open first available lesson in a phase
  function handlePhaseCTA(phase, specificLesson = null) {
    const target = specificLesson ?? (
      phase.lessons.find(l => {
        const s = lessonStatus(l);
        return s !== 'completed' && s !== 'mastered';
      }) ?? phase.lessons[0]
    );
    if (!target) return;

    if (target.section) {
      onNavigate?.(target.section);
      return;
    }

    const idx  = phase.lessons.findIndex(l => l.id === target.id);
    const next = phase.lessons[idx + 1] ?? null;

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
      phaseId:         phase.id,
      phaseTitle:      phase.title,
      phaseShortTitle: phase.shortTitle,
      moduleId:        target.moduleId ?? null,
      moduleTitle:     target.moduleTitle ?? null,
      nextLesson: next ? { id: next.id, title: next.title, reason: `Continue ${phase.title}` } : null,
    });
  }

  useEffect(() => {
    if (!searchTerm || !sectionRef.current) return;
    sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [searchTerm]);

  useEffect(() => {
    clearTimeout(focusScrollTimer.current);
    clearTimeout(focusClearTimer.current);

    if (!focusTarget?.id) {
      setFocusPhaseId(null);
      setFocusLessonId(null);
      return undefined;
    }

    const targetPhase = allPhases.find(phase =>
      phase.id === focusTarget.id || phase.lessons.some(lesson => lesson.id === focusTarget.id)
    );

    if (!targetPhase) return undefined;

    const targetLesson = targetPhase.lessons.find(lesson => lesson.id === focusTarget.id) ?? null;
    const canOpenLesson = focusTarget.type === 'topic' && targetLesson;
    const focusNodeId = canOpenLesson ? `topic-${focusTarget.id}` : targetPhase.id;

    setManualClosedPhaseIds(prev => {
      const next = new Set(prev);
      next.delete(targetPhase.id);
      return next;
    });
    setManualOpenPhaseIds(prev => {
      const next = new Set(prev);
      next.add(targetPhase.id);
      return next;
    });

    focusScrollTimer.current = setTimeout(() => {
      const node = document.getElementById(focusNodeId);
      if (node) {
        node.scrollIntoView({
          behavior: 'smooth',
          block: canOpenLesson ? 'center' : 'start',
        });
        setFocusPhaseId(targetPhase.id);
        setFocusLessonId(canOpenLesson ? focusTarget.id : null);
        focusClearTimer.current = setTimeout(() => {
          setFocusPhaseId(null);
          setFocusLessonId(null);
        }, 1500);
      }
    }, canOpenLesson ? 120 : 60);

    return () => {
      clearTimeout(focusScrollTimer.current);
      clearTimeout(focusClearTimer.current);
    };
  }, [focusTarget, allPhases]);

  const renderTrackSection = (title, subtitle, trackPhases) => {
    const trackCurrentPhaseIndex = trackPhases.findIndex(p => computePhaseProgress(p) < 100);
    const trackKicker = title === 'AI for Data Engineers' ? 'AI Track' : 'Optional Track';
    const trackTitle = title === 'AI for Data Engineers' ? 'Specialization track' : 'Optional tools';
    const phasedSections = trackPhases.map((phase, phaseIndex) => {
      const lessons = phase.modules.flatMap((module, moduleIndex) =>
        module.lessons.map((lesson, lessonIndex) => {
          const topicMeta = lesson.topicId ? getCurriculumTopicMeta(lesson.topicId) : null;
          return {
            ...lesson,
            moduleId: module.id,
            moduleTitle: module.title,
            moduleIndex,
            lessonIndex,
            topicState: lessonStatus(lesson),
            masteryPct: lessonPct(lesson),
            body: compactTopicSummary(
              lesson.title,
              lesson.body ?? topicMeta?.summary ?? '',
              phase.title ?? phase.shortTitle ?? 'this'
            ),
            label: lesson.label ?? phase.shortTitle ?? phase.title ?? 'Topic',
            timeEstimate: topicMeta?.estimatedHours
              ? topicMeta.estimatedHours
              : `${Math.max(4, Math.ceil((phase.estimatedHours ?? 48) / Math.max(1, phase.modules.flatMap(m => m.lessons).length || 1)))}h`,
            prerequisites: phase.prerequisites ?? [],
            interviewImportance: lesson.interviewImportance ?? null,
          };
        })
      );

      const done = lessons.filter(lesson => {
        const status = lessonStatus(lesson);
        return status === 'completed' || status === 'mastered';
      }).length;
      const inProg = lessons.filter(lesson => lessonStatus(lesson) === 'in-progress').length;
      const total = lessons.length;
      const pct = computePhaseProgress(phase);
      let state = 'available';
      if (done === total && total > 0) state = 'completed';
      else if (done > 0 || inProg > 0) state = 'in-progress';

      return {
        ...phase,
        lessons,
        progress: pct,
        done,
        total,
        state,
        isCurrent: phaseIndex === trackCurrentPhaseIndex,
      };
    });

    if (!phasedSections.length) return null;

    return (
      <div className="lp-track-section">
        <div className="lp-header lp-track-header">
          <div className="lp-header-left">
            <p className="eyebrow">{trackKicker}</p>
            <h3 className="lp-track-title">{trackTitle}</h3>
            <p className="lp-track-sub">{subtitle}</p>
          </div>
        </div>
        <div className="lp-phase-stack">
          {phasedSections.map(phase => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            isRecommended={false}
            onCTA={handlePhaseCTA}
            onToggle={handlePhaseToggle}
            isExpanded={openPhaseIds.has(phase.id)}
            currentLessonId={currentLessonId}
            focusPhaseId={focusPhaseId}
            focusLessonId={focusLessonId}
            lessonStatus={lessonStatus}
            lessonPct={lessonPct}
            />
          ))}
        </div>
      </div>
    );
  };

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
      {recommendedPhase && !searchTerm && (
        <div className="lp-next-banner">
          <div className="lp-next-banner-main">
            <div className="lp-next-banner-left">
              <span className="lp-next-kicker">{recommendedPhase?.state === 'available' ? 'Start here' : 'Continue where you left off'}</span>
              <strong className="lp-next-title">{recommendedPhase?.title ?? recommendedPhase?.shortTitle}</strong>
              <span className="lp-next-meta">
                {recommendedPhase?.shortTitle ?? recommendedPhase?.title}
                {' · '}
                {Math.max(0, (recommendedPhase?.total ?? 0) - (recommendedPhase?.done ?? 0))} lesson{Math.max(0, (recommendedPhase?.total ?? 0) - (recommendedPhase?.done ?? 0)) !== 1 ? 's' : ''} remaining
              </span>
            </div>
            <button
              type="button"
              className="lp-next-cta"
              onClick={() => handlePhaseCTA(recommendedPhase)}
            >
              {recommendedPhase?.state === 'available' ? 'Start' : 'Continue'} →
            </button>
          </div>
          {nextSimulator && (
            <div className="lp-next-secondary-row">
              <span className="lp-next-secondary-kicker">Next simulator</span>
              <div className="lp-next-secondary-copy">
                <strong className="lp-next-secondary-title">{nextSimulator.title}</strong>
                <span className="lp-next-secondary-meta">Practice what you&apos;ve learned in the Workplace Simulator</span>
              </div>
              <button
                type="button"
                className="lp-next-secondary-cta"
                onClick={() => onNavigate?.('workplace')}
              >
                Open Simulator →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Filter pills ────────────────────────────────────────────────────── */}
      <div className="lp-filter-bar" role="group" aria-label="Filter by category">
        {FILTER_CHIPS.map(chip => (
          <button
            key={chip.id}
            type="button"
            className={`lp-chip${filterChip === chip.id ? ' lp-chip--active' : ''}`}
            onClick={() => { setFilterChip(chip.id); }}
            aria-pressed={filterChip === chip.id}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* ── Phase stack ─────────────────────────────────────────────────────── */}
      {visiblePhases.length === 0 ? (
        <EmptyState
          icon="▦"
          title={searchTerm ? `No lessons match "${searchTerm}"` : 'No phases match this filter'}
          body="Try All to see every phase."
          variant="compact"
        />
      ) : (
        <div className="lp-phase-stack">
          {visiblePhases.map(phase => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            isRecommended={phase.id === recommendedPhase?.id}
            onCTA={handlePhaseCTA}
            onToggle={handlePhaseToggle}
            isExpanded={openPhaseIds.has(phase.id)}
            currentLessonId={currentLessonId}
            focusPhaseId={focusPhaseId}
            focusLessonId={focusLessonId}
            lessonStatus={lessonStatus}
              lessonPct={lessonPct}
            />
          ))}
        </div>
      )}

      {!searchTerm && renderTrackSection(
        'AI for Data Engineers',
        'A separate specialization track for LLM fundamentals, RAG, embeddings, and AI-assisted data pipelines.',
        aiLearningPathPhases
      )}

      {!searchTerm && renderTrackSection(
        'Optional Technologies',
        'Browse adjacent tools like AWS, Snowflake, dbt, and Kafka Advanced without affecting core progress.',
        optionalTechnologyPhases
      )}
    </section>
  );
});

export default Topics;
