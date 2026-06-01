import { memo, useState, useMemo, useEffect, useRef } from 'react';
import { sqlInterviewQuestions, deInterviewCategories, categoryQuestions } from '../../data/interviewQuestions.js';
import { EmptyState } from '../ui/EmptyState.jsx';
import { SearchInput, StatPill } from '../ui/design-system.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { getInterviewPrepAnalytics } from '../../utils/interviewPrepAnalytics.js';
import MockInterviewSimulator from './MockInterviewSimulator.jsx';
import ResumeStoryBuilder from './ResumeStoryBuilder.jsx';

// ─── Level metadata ───────────────────────────────────────────────────────────
const LEVEL_META = {
  beginner:     { label: 'Beginner',     color: '#059669' },
  intermediate: { label: 'Intermediate', color: '#d97706' },
  advanced:     { label: 'Advanced',     color: '#dc2626' },
  realWorld:    { label: 'Real-world',   color: '#0284c7' },
};

// ─── Filter chips ─────────────────────────────────────────────────────────────
const FILTER_CHIPS = [
  { id: 'all',           label: 'All' },
  { id: 'sql',           label: 'SQL' },
  { id: 'python',        label: 'Python' },
  { id: 'spark',         label: 'PySpark' },
  { id: 'fabric',        label: 'Fabric' },
  { id: 'cloud',         label: 'Azure / Cloud' },
  { id: 'databricks',    label: 'Databricks' },
  { id: 'orchestration', label: 'ADF / Airflow' },
  { id: 'etl',           label: 'ETL' },
  { id: 'data-modeling', label: 'Data Modeling' },
  { id: 'streaming',     label: 'Kafka' },
  { id: 'system-design', label: 'System Design' },
  { id: 'scenario',      label: 'Scenarios' },
  { id: 'behavioral',    label: 'Behavioral' },
];

// Official doc source per category — shown as reference link in expanded answers
const DOC_SOURCES = {
  sql:           { label: 'PostgreSQL Docs',     url: 'https://www.postgresql.org/docs/' },
  python:        { label: 'Python Docs',          url: 'https://docs.python.org/3/' },
  spark:         { label: 'Apache Spark Docs',    url: 'https://spark.apache.org/docs/latest/' },
  fabric:        { label: 'Microsoft Learn — Fabric', url: 'https://learn.microsoft.com/en-us/fabric/' },
  cloud:         { label: 'Microsoft Learn — Azure',  url: 'https://learn.microsoft.com/en-us/azure/' },
  databricks:    { label: 'Databricks Docs',      url: 'https://docs.databricks.com/' },
  orchestration: { label: 'Apache Airflow Docs',  url: 'https://airflow.apache.org/docs/' },
  etl:           { label: 'dbt Docs',             url: 'https://docs.getdbt.com/' },
  'data-modeling': { label: 'Kimball Group',      url: 'https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/' },
  streaming:     { label: 'Apache Kafka Docs',    url: 'https://kafka.apache.org/documentation/' },
  'system-design': { label: 'AWS Architecture',  url: 'https://aws.amazon.com/architecture/' },
};

// ─── Flat question bank ───────────────────────────────────────────────────────
function buildAllQuestions() {
  const qs = [];
  const sqlCat = deInterviewCategories.find(c => c.id === 'sql');
  Object.entries(sqlInterviewQuestions).forEach(([level, items]) => {
    items.forEach((q, i) => {
      qs.push({
        id: `sql-${level}-${i}`,
        categoryId: 'sql',
        categoryName: sqlCat?.name ?? 'SQL & Analytics',
        categoryColor: sqlCat?.color ?? '#10b981',
        level,
        q: q.q,
        a: q.a,
        scenario: q.scenario ?? null,
        detailedAnswer: q.detailedAnswer ?? null,
        productionTradeoff: q.productionTradeoff ?? null,
        interviewerExpectation: q.interviewerExpectation ?? null,
        commonWeakAnswer: q.commonWeakAnswer ?? null,
        followUps: q.followUps ?? null,
        tags: q.tags ?? null,
      });
    });
  });
  Object.entries(categoryQuestions).forEach(([catId, levels]) => {
    const cat = deInterviewCategories.find(c => c.id === catId);
    Object.entries(levels).forEach(([level, items]) => {
      items.forEach((q, i) => {
        qs.push({
          id: `${catId}-${level}-${i}`,
          categoryId: catId,
          categoryName: cat?.name ?? catId,
          categoryColor: cat?.color ?? '#64748b',
          level,
          q: q.q,
          a: q.a,
          scenario: q.scenario ?? null,
          detailedAnswer: q.detailedAnswer ?? null,
          productionTradeoff: q.productionTradeoff ?? null,
          interviewerExpectation: q.interviewerExpectation ?? null,
          commonWeakAnswer: q.commonWeakAnswer ?? null,
          followUps: q.followUps ?? null,
          tags: q.tags ?? null,
        });
      });
    });
  });
  return qs;
}

const ALL_QUESTIONS = buildAllQuestions();

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ─── Mock Interview (Timed Mode) Panel ───────────────────────────────────────
function MockInterviewPanel({ questions: pool, onExit }) {
  const [questions] = useState(() => {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  });
  const [current,  setCurrent]  = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [scores,   setScores]   = useState([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [phase,    setPhase]    = useState('answering');
  const timerRef = useRef(null);

  useEffect(() => {
    if (phase !== 'answering') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('revealed');
          setRevealed(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, current]);

  function handleReveal() {
    clearInterval(timerRef.current);
    setPhase('revealed');
    setRevealed(true);
  }

  function handleScore(s) {
    const next = [...scores, s];
    setScores(next);
    if (current + 1 >= questions.length) {
      setPhase('done');
    } else {
      setCurrent(c => c + 1);
      setRevealed(false);
      setTimeLeft(120);
      setPhase('answering');
    }
  }

  if (phase === 'done' || (current >= questions.length && scores.length > 0)) {
    const got = scores.filter(s => s === 'got').length;
    const pct = Math.round((got / questions.length) * 100);
    return (
      <div className="mock-done">
        <div className="mock-done-score">
          <span className="mock-done-pct">{pct}%</span>
          <span className="mock-done-label">{got}/{questions.length} correct</span>
        </div>
        <p className="mock-done-feedback">
          {pct >= 80 ? 'Excellent — interview ready.' :
           pct >= 60 ? 'Good. Review the ones you missed.' :
           'Keep practising. Focus on the questions you were unsure about.'}
        </p>
        <div className="mock-done-breakdown">
          {questions.map((q, i) => (
            <div key={i} className={`mock-done-row mock-done-row--${scores[i] ?? 'skip'}`}>
              <span className="mock-done-row-icon">
                {scores[i] === 'got' ? '✓' : scores[i] === 'almost' ? '~' : '✗'}
              </span>
              <span className="mock-done-row-text">{q.q?.slice(0, 80)}{q.q?.length > 80 ? '…' : ''}</span>
            </div>
          ))}
        </div>
        <button type="button" className="mock-back-btn" onClick={onExit}>
          ← Back to questions
        </button>
      </div>
    );
  }

  const q = questions[current];
  const urgency = timeLeft <= 30 ? 'urgent' : timeLeft <= 60 ? 'warn' : 'ok';
  const pct = ((current) / questions.length) * 100;

  return (
    <div className="mock-panel">
      <div className="mock-topbar">
        <div className="mock-progress-wrap">
          <span className="mock-progress-label">{current + 1} / {questions.length}</span>
          <div className="mock-progress-track">
            <div className="mock-progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className={`mock-timer mock-timer--${urgency}`}>⏱ {formatTime(timeLeft)}</span>
        <button type="button" className="mock-exit-btn" onClick={onExit}>Exit</button>
      </div>

      <div className="mock-card">
        <div className="mock-card-meta">
          <span className="mock-cat-badge" style={{ '--tc': q.categoryColor }}>{q.categoryName}</span>
          <span className="mock-level-badge" style={{ color: LEVEL_META[q.level]?.color ?? '#64748b' }}>
            {LEVEL_META[q.level]?.label ?? q.level}
          </span>
        </div>
        <p className="mock-q-text">{q.q}</p>

        {!revealed ? (
          <button type="button" className="mock-reveal-btn" onClick={handleReveal}>
            Reveal Answer
          </button>
        ) : (
          <>
            <div className="mock-answer">
              <span className="mock-answer-label">Answer</span>
              <p className="mock-answer-text">{q.a}</p>
              {q.scenario && (
                <div className="mock-answer-note">
                  <span className="mock-note-label">Real-world context</span>
                  <p>{q.scenario}</p>
                </div>
              )}
              {q.detailedAnswer && (
                <div className="mock-answer-note mock-answer-note--deep">
                  <span className="mock-note-label">Deep Dive</span>
                  <p>{q.detailedAnswer}</p>
                </div>
              )}
              {q.followUps && q.followUps.length > 0 && (
                <div className="mock-followups">
                  <span className="mock-followups-label">Follow-up questions</span>
                  <ul className="mock-followups-list">
                    {q.followUps.map((fu, idx) => (
                      <li key={idx} className="mock-followup-item">{fu}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="mock-score-row">
              <span className="mock-score-label">How did you do?</span>
              <div className="mock-score-btns">
                <button type="button" className="mock-score-btn mock-score-btn--miss" onClick={() => handleScore('miss')}>✗ Missed</button>
                <button type="button" className="mock-score-btn mock-score-btn--almost" onClick={() => handleScore('almost')}>~ Almost</button>
                <button type="button" className="mock-score-btn mock-score-btn--got" onClick={() => handleScore('got')}>✓ Got it</button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Question Card — 2-col grid card matching reference image ─────────────────
function QuestionCard({ item, isExpanded, onToggle, isReviewed, onToggleReviewed }) {
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);
  const level  = LEVEL_META[item.level] ?? { label: item.level, color: '#64748b' };
  const docSrc = DOC_SOURCES[item.categoryId];
  const highlights = [];
  if (['advanced', 'realWorld'].includes(item.level)) highlights.push('Most important for senior roles');
  if (['cloud', 'databricks', 'fabric', 'orchestration'].includes(item.categoryId)) highlights.push('Frequently asked in Azure interviews');
  if (item.categoryId === 'sql' && ['intermediate', 'advanced'].includes(item.level)) highlights.push('Interview critical');

  return (
    <div className={`iqc-card${isExpanded ? ' iqc-card--open' : ''}${isReviewed ? ' iqc-card--reviewed' : ''}`}>
      {/* Reviewed badge */}
      {isReviewed && (
        <span className="iqc-reviewed-badge" aria-label="Reviewed">✓</span>
      )}

      {/* Card body */}
      <div className="iqc-body">
        {/* Meta row: topic name left, difficulty right */}
        <div className="iqc-meta">
          <span className="iqc-topic" style={{ '--tc': item.categoryColor }}>
            {item.categoryName}
          </span>
          <span className="iqc-diff" style={{ '--lc': level.color }}>
            {level.label}
          </span>
        </div>

        {highlights.length > 0 && (
          <div className="iqc-tags">
            {highlights.map(label => (
              <span key={label} className="iqc-tag">{label}</span>
            ))}
          </div>
        )}

        {/* Tags (company context chips) */}
        {item.tags && item.tags.length > 0 && (
          <div className="iqc-tags">
            {item.tags.map(tag => (
              <span key={tag} className="iqc-tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Question text */}
        <p className="iqc-question">{item.q}</p>

        {/* Action row: toggle answer + mark reviewed */}
        <div className="iqc-actions">
          <button
            type="button"
            className="iqc-toggle"
            onClick={onToggle}
            aria-expanded={isExpanded}
          >
            {isExpanded ? 'Hide answer ↑' : 'Show answer →'}
          </button>
          <button
            type="button"
            className={`iqc-reviewed-btn${isReviewed ? ' iqc-reviewed-btn--done' : ''}`}
            onClick={onToggleReviewed}
            aria-pressed={isReviewed}
            title={isReviewed ? 'Click to unmark' : 'Mark this question as practiced'}
          >
            {isReviewed ? 'Reviewed ✓' : 'Mark Reviewed'}
          </button>
        </div>
      </div>

      {/* Answer panel — slides in below */}
      {isExpanded && (
        <div className="iqc-answer">
          <span className="iqc-answer-label">Answer</span>
          <p className="iqc-answer-text">{item.a}</p>

          {item.scenario && (
            <div className="iqc-answer-note">
              <span className="iqc-note-label">Real-world context</span>
              <p className="iqc-note-text">{item.scenario}</p>
            </div>
          )}

          {(item.productionTradeoff || item.interviewerExpectation || item.commonWeakAnswer) && (
            <div className="iqc-answer-note">
              {item.productionTradeoff && (
                <>
                  <span className="iqc-note-label">Production tradeoff</span>
                  <p className="iqc-note-text">{item.productionTradeoff}</p>
                </>
              )}
              {item.interviewerExpectation && (
                <>
                  <span className="iqc-note-label">Interviewer expectation</span>
                  <p className="iqc-note-text">{item.interviewerExpectation}</p>
                </>
              )}
              {item.commonWeakAnswer && (
                <>
                  <span className="iqc-note-label">Common weak answer</span>
                  <p className="iqc-note-text">{item.commonWeakAnswer}</p>
                </>
              )}
            </div>
          )}

          {/* Deep Dive — collapsed by default */}
          {item.detailedAnswer && (
            <div className="iqc-deep-dive">
              <button
                type="button"
                className="iqc-deep-dive-toggle"
                onClick={() => setDeepDiveOpen(o => !o)}
                aria-expanded={deepDiveOpen}
              >
                {deepDiveOpen ? 'Hide Deep Dive ↑' : 'Show Deep Dive ↓'}
              </button>
              {deepDiveOpen && (
                <div className="iqc-deep-dive-body">
                  <span className="iqc-deep-dive-label">Deep Dive</span>
                  <p className="iqc-deep-dive-text">{item.detailedAnswer}</p>
                </div>
              )}
            </div>
          )}

          {/* Follow-up questions */}
          {item.followUps && item.followUps.length > 0 && (
            <div className="iqc-followups">
              <span className="iqc-followups-label">Follow-up questions</span>
              <ul className="iqc-followups-list">
                {item.followUps.map((fu, idx) => (
                  <li key={idx} className="iqc-followup-item">{fu}</li>
                ))}
              </ul>
            </div>
          )}

          {docSrc && (
            <a
              href={docSrc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="iqc-doc-link"
            >
              ◎ Source: {docSrc.label} ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const InterviewPrep = memo(function InterviewPrep() {
  const [mockMode,    setMockMode]    = useState(false);
  const [filterChip,  setFilterChip]  = useState('all');
  const [search,      setSearch]      = useState('');
  const [expandedId,  setExpandedId]  = useState(null);
  const [learnedSet,  setLearnedSet]  = useLocalStorage('dem-interview-learned', {});

  const filteredQuestions = useMemo(() => {
    let qs = ALL_QUESTIONS;
    if (filterChip !== 'all') qs = qs.filter(q => q.categoryId === filterChip);
    if (search.trim()) {
      const lc = search.toLowerCase();
      qs = qs.filter(q =>
        q.q.toLowerCase().includes(lc) ||
        q.a.toLowerCase().includes(lc) ||
        q.categoryName.toLowerCase().includes(lc) ||
        (q.scenario ?? '').toLowerCase().includes(lc)
      );
    }
    return qs;
  }, [filterChip, search]);

  // Progress summary counts across ALL questions (not just filtered)
  const {
    reviewedCount,
    totalCount,
    reviewedPct,
    categoryStats,
    strongestCategory,
    seniorReviewed,
    azureReviewed,
  } = useMemo(
    () => getInterviewPrepAnalytics(ALL_QUESTIONS, learnedSet, deInterviewCategories),
    [learnedSet]
  );

  function handleToggleReviewed(id) {
    setLearnedSet(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function handleChip(id) {
    setFilterChip(id);
    setSearch('');
    setExpandedId(null);
  }

  const activeLabel = filterChip !== 'all'
    ? (deInterviewCategories.find(c => c.id === filterChip)?.name ?? filterChip)
    : null;

  // ── Mock interview view ────────────────────────────────────────────────────
  if (mockMode) {
    return (
      <section className="section" id="interview-prep">
        <div className="ipv2-page">
          <MockInterviewPanel
            questions={filteredQuestions.length >= 5 ? filteredQuestions : ALL_QUESTIONS}
            onExit={() => setMockMode(false)}
          />
        </div>
      </section>
    );
  }

  // ── Main view ──────────────────────────────────────────────────────────────
  return (
    <section className="section" id="interview-prep">
      <div className="ipv2-page">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="ipv2-header">
          <div className="ipv2-header-left">
            <h2 className="ipv2-title">Interview Preparation</h2>
            <p className="ipv2-subtitle">
              Topic-wise questions, scenarios, coding, and mock interviews.
            </p>
          </div>
          <div className="ipv2-header-right">
            <SearchInput
              className="ipv2-search-input"
              placeholder="Search questions…"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setExpandedId(null);
              }}
              aria-label="Search interview questions"
            />
            <button
              type="button"
              className="ipv2-mock-btn"
              onClick={() => setMockMode(true)}
            >
              <span className="ipv2-mock-icon" aria-hidden="true">⏱</span>
              Timed Mock Interview
            </button>
          </div>
        </div>

        <div className="ipv2-insights-row">
          <StatPill label="Reviewed" value={`${reviewedCount}/${totalCount}`} icon="✓" variant="success" />
          <StatPill label="Readiness" value={`${reviewedPct}%`} icon="◌" variant="accent" />
          <StatPill label="Senior focus" value={`${seniorReviewed}`} icon="⭐" variant="warning" />
          <StatPill label="Azure asked" value={`${azureReviewed}`} icon="☁" variant="info" />
        </div>
        <p className="ipv2-readiness-note">
          Strongest category: <strong>{strongestCategory?.name ?? 'SQL'}</strong> · {strongestCategory ? `${strongestCategory.pct}% complete` : 'Start with SQL to build momentum'}
        </p>

        <MockInterviewSimulator />
        <ResumeStoryBuilder />

        {/* ── Progress summary ───────────────────────────────────────────── */}
        <div className="ipv2-progress-summary">
          <span className="ipv2-progress-text">
            <strong>{reviewedCount}</strong> question{reviewedCount !== 1 ? 's' : ''} reviewed
            &nbsp;·&nbsp;
            <strong>{reviewedPct}%</strong> complete
          </span>
          <div className="ipv2-progress-bar-track">
            <div
              className="ipv2-progress-bar-fill"
              style={{ width: `${reviewedPct}%` }}
              role="progressbar"
              aria-valuenow={reviewedPct}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* ── Filter pills ───────────────────────────────────────────────── */}
        <div className="ipv2-filter-bar" role="group" aria-label="Filter by topic">
          {FILTER_CHIPS.map(chip => (
            <button
              key={chip.id}
              type="button"
              className={`ipv2-chip${filterChip === chip.id ? ' ipv2-chip--active' : ''}`}
              onClick={() => handleChip(chip.id)}
              aria-pressed={filterChip === chip.id}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* ── Result count + clear ───────────────────────────────────────── */}
        {(filterChip !== 'all' || search.trim()) && (
          <div className="ipv2-count-row">
            <span className="ipv2-count">
              {filteredQuestions.length} question{filteredQuestions.length !== 1 ? 's' : ''}
              {activeLabel && <> in <strong>{activeLabel}</strong></>}
              {search.trim() && <> matching &ldquo;{search}&rdquo;</>}
            </span>
            <button
              type="button"
              className="ipv2-clear-btn"
              onClick={() => { setFilterChip('all'); setSearch(''); setExpandedId(null); }}
            >
              × Clear
            </button>
          </div>
        )}

        {/* ── Questions list ─────────────────────────────────────────────── */}
        {filteredQuestions.length === 0 ? (
          <EmptyState
            icon="◌"
            title="No matching questions"
            body={search
              ? `No questions match "${search}". Try clearing the search or picking a different topic.`
              : 'No questions found for this filter.'}
            variant="compact"
          />
        ) : (
          <div className="iqc-grid">
            {filteredQuestions.map(item => (
              <QuestionCard
                key={item.id}
                item={item}
                isExpanded={expandedId === item.id}
                onToggle={() => setExpandedId(p => p === item.id ? null : item.id)}
                isReviewed={!!learnedSet[item.id]}
                onToggleReviewed={() => handleToggleReviewed(item.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

export default InterviewPrep;
