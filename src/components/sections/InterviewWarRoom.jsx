import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { WAR_ROOM_CATEGORIES } from '../../data/warRoomQuestions.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';

// ── helpers ───────────────────────────────────────────────────────────────────

function formatMmSs(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const TIME_LIMITS = [
  { label: 'Quick',    minutes: 15 },
  { label: 'Standard', minutes: 30 },
  { label: 'Deep',     minutes: 45 },
];

const DIFFICULTY_OPTIONS = ['All', 'Easy', 'Medium', 'Hard'];

const CONFIDENCE_LABELS = {
  1: 'Guessed',
  2: 'Partial',
  3: 'OK',
  4: 'Good',
  5: 'Nailed it',
};

const DIFFICULTY_COLORS = {
  Easy:   { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  Medium: { bg: '#fef3c7', text: '#b45309', border: '#fcd34d' },
  Hard:   { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' },
};

function DiffBadge({ difficulty }) {
  const c = DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.Medium;
  return (
    <span
      className="wr-diff-badge"
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
    >
      {difficulty}
    </span>
  );
}

// Best streak: max consecutive days with at least one session
function computeBestStreak(history) {
  if (!history.length) return 0;
  const days = [...new Set(history.map(s => s.date.slice(0, 10)))].sort();
  let best = 1;
  let cur = 1;
  for (let i = 1; i < days.length; i++) {
    const prev = new Date(days[i - 1]);
    const curr = new Date(days[i]);
    const diffDays = Math.round((curr - prev) / 86400000);
    if (diffDays === 1) {
      cur++;
      if (cur > best) best = cur;
    } else {
      cur = 1;
    }
  }
  return best;
}

function computeStats(history) {
  const totalSessions = history.length;
  const questionsAnswered = history.reduce((a, s) => a + (s.questionsAnswered || 0), 0);
  const avgConfidence = totalSessions === 0 ? 0 :
    Math.round(
      (history.reduce((a, s) => a + (s.avgConfidence || 0), 0) / totalSessions) * 10
    ) / 10;
  const bestStreak = computeBestStreak(history);
  return { totalSessions, questionsAnswered, avgConfidence, bestStreak };
}

// ── Home view ─────────────────────────────────────────────────────────────────

function HomeView({ sessionHistory, onStartCategory }) {
  const stats = computeStats(sessionHistory);

  return (
    <div className="wr-home">
      {/* Stats row */}
      <div className="wr-stats-row">
        <div className="wr-stat-card">
          <span className="wr-stat-num">{stats.totalSessions}</span>
          <span className="wr-stat-label">Total sessions</span>
        </div>
        <div className="wr-stat-card">
          <span className="wr-stat-num">{stats.questionsAnswered}</span>
          <span className="wr-stat-label">Questions answered</span>
        </div>
        <div className="wr-stat-card">
          <span className="wr-stat-num">{stats.avgConfidence > 0 ? stats.avgConfidence : '—'}</span>
          <span className="wr-stat-label">Avg confidence</span>
        </div>
        <div className="wr-stat-card">
          <span className="wr-stat-num">{stats.bestStreak > 0 ? stats.bestStreak : '—'}</span>
          <span className="wr-stat-label">Best streak (days)</span>
        </div>
      </div>

      {/* Category grid */}
      <div className="wr-category-grid">
        {WAR_ROOM_CATEGORIES.map(cat => (
          <div key={cat.id} className="wr-category-card">
            <div className="wr-cat-icon-row">
              <span
                className="wr-cat-icon"
                style={{ background: cat.color + '22', color: cat.color }}
                aria-hidden="true"
              >
                {cat.icon}
              </span>
            </div>
            <h3 className="wr-cat-label">{cat.label}</h3>
            <p className="wr-cat-desc">{cat.description}</p>
            <div className="wr-cat-footer">
              <span className="wr-cat-count">{cat.questions.length} questions</span>
              <button
                type="button"
                className="wr-start-btn"
                onClick={() => onStartCategory(cat)}
              >
                Start Session
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Session config view ───────────────────────────────────────────────────────

function SessionConfig({ category, onBegin, onCancel }) {
  const [difficulty, setDifficulty] = useState('All');
  const [timeLimit, setTimeLimit] = useState(TIME_LIMITS[1]);

  function handleBegin() {
    const questions = difficulty === 'All'
      ? category.questions
      : category.questions.filter(q => q.difficulty === difficulty);
    if (!questions.length) return;
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    onBegin({ questions: shuffled, timeLimitSeconds: timeLimit.minutes * 60, category, difficulty });
  }

  const availableCount = difficulty === 'All'
    ? category.questions.length
    : category.questions.filter(q => q.difficulty === difficulty).length;

  return (
    <div className="wr-config">
      <button type="button" className="inc-back-btn" onClick={onCancel}>
        ← Back
      </button>
      <h3 className="wr-config-title">Configure Session</h3>
      <p className="wr-config-category">{category.icon} {category.label}</p>

      <div className="wr-config-section">
        <p className="wr-config-label">Difficulty</p>
        <div className="wr-config-options">
          {DIFFICULTY_OPTIONS.map(d => (
            <button
              key={d}
              type="button"
              className={difficulty === d ? 'wr-option-btn wr-option-btn-active' : 'wr-option-btn'}
              onClick={() => setDifficulty(d)}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="wr-config-section">
        <p className="wr-config-label">Time limit</p>
        <div className="wr-config-options">
          {TIME_LIMITS.map(t => (
            <button
              key={t.label}
              type="button"
              className={timeLimit.label === t.label ? 'wr-option-btn wr-option-btn-active' : 'wr-option-btn'}
              onClick={() => setTimeLimit(t)}
            >
              {t.label} ({t.minutes}m)
            </button>
          ))}
        </div>
      </div>

      <p className="wr-config-hint">
        {availableCount} question{availableCount !== 1 ? 's' : ''} available
      </p>

      <button
        type="button"
        className="wr-begin-btn"
        onClick={handleBegin}
        disabled={availableCount === 0}
      >
        Begin Session
      </button>
    </div>
  );
}

// ── Session view ──────────────────────────────────────────────────────────────

function SessionView({ session, onEnd }) {
  const { questions, timeLimitSeconds, category } = session;

  const [currentIdx, setCurrentIdx] = useState(0);
  const [phase, setPhase] = useState('thinking'); // thinking | revealed
  const [noteText, setNoteText] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [coveredPoints, setCoveredPoints] = useState({});
  const [responses, setResponses] = useState([]); // array of { questionId, confidence, coveredPoints }
  const [timeLeft, setTimeLeft] = useState(timeLimitSeconds);
  const timerRef = useRef(null);

  function handleAutoEnd() {
    clearInterval(timerRef.current);
    onEnd(responses, timeLimitSeconds - timeLeft);
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          // Auto-end: save whatever we have
          handleAutoEnd();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleReveal() {
    setPhase('revealed');
    setCoveredPoints({});
    setConfidence(0);
  }

  function togglePoint(i) {
    setCoveredPoints(prev => ({ ...prev, [i]: !prev[i] }));
  }

  function handleNext() {
    const q = questions[currentIdx];
    const newResponse = { questionId: q.id, confidence, coveredPoints: { ...coveredPoints } };
    const newResponses = [...responses, newResponse];
    setResponses(newResponses);

    if (currentIdx + 1 >= questions.length) {
      clearInterval(timerRef.current);
      onEnd(newResponses, timeLimitSeconds - timeLeft);
    } else {
      setCurrentIdx(i => i + 1);
      setPhase('thinking');
      setNoteText('');
      setConfidence(0);
      setCoveredPoints({});
    }
  }

  function handleEndEarly() {
    clearInterval(timerRef.current);
    onEnd(responses, timeLimitSeconds - timeLeft);
  }

  const urgency = timeLeft <= 60 ? 'urgent' : timeLeft <= 180 ? 'warning' : 'normal';
  const timerColor = urgency === 'urgent' ? '#dc2626' : urgency === 'warning' ? '#d97706' : '#2f756e';

  const question = questions[currentIdx];

  return (
    <div className="wr-session">
      {/* Session top bar */}
      <div className="wr-session-bar">
        <div className="wr-session-progress-label">
          Question {currentIdx + 1} / {questions.length}
        </div>
        <div className="wr-session-timer" style={{ color: timerColor }}>
          ⏱ {formatMmSs(timeLeft)}
        </div>
        <button type="button" className="wr-end-early-link" onClick={handleEndEarly}>
          End Session Early
        </button>
      </div>

      {/* Progress bar */}
      <div className="wr-session-progress-track">
        <div
          className="wr-session-progress-fill"
          style={{ width: `${(currentIdx / questions.length) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="wr-question-card">
        <div className="wr-question-meta">
          <span className="wr-question-category">{category.icon} {category.label}</span>
          <DiffBadge difficulty={question.difficulty} />
        </div>
        <p className="wr-question-text">{question.question}</p>

        {phase === 'thinking' && (
          <>
            <label className="wr-notes-label">
              Think &amp; Answer (notes for yourself — not graded)
            </label>
            <textarea
              className="wr-notes-textarea"
              rows={5}
              placeholder="Jot down your approach, key points, or outline your answer…"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
            />
            <button type="button" className="wr-reveal-btn" onClick={handleReveal}>
              Reveal Answer
            </button>
          </>
        )}

        {phase === 'revealed' && (
          <>
            {/* Expected points */}
            <div className="wr-expected-section">
              <h4 className="wr-expected-title">Expected Points</h4>
              <ul className="wr-expected-list">
                {question.expectedPoints.map((pt, i) => (
                  <li key={i} className="wr-expected-item">
                    <label className="wr-expected-label">
                      <input
                        type="checkbox"
                        className="wr-expected-check"
                        checked={!!coveredPoints[i]}
                        onChange={() => togglePoint(i)}
                      />
                      <span className={coveredPoints[i] ? 'wr-expected-text wr-expected-text-checked' : 'wr-expected-text'}>
                        {pt}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            {/* Model answer */}
            <div className="wr-model-answer">
              <h4 className="wr-model-title">Model Answer</h4>
              <p className="wr-model-text">{question.modelAnswer}</p>
            </div>

            {/* Follow-up */}
            <div className="wr-followup">
              <span className="wr-followup-label">Follow-up:</span>
              <span className="wr-followup-text">{question.followUp}</span>
            </div>

            {/* Confidence rating */}
            <div className="wr-confidence-section">
              <p className="wr-confidence-label">Rate your confidence</p>
              <div className="wr-confidence-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={confidence >= star ? 'wr-star wr-star-active' : 'wr-star'}
                    onClick={() => setConfidence(star)}
                    title={CONFIDENCE_LABELS[star]}
                  >
                    ★
                  </button>
                ))}
                {confidence > 0 && (
                  <span className="wr-confidence-desc">{CONFIDENCE_LABELS[confidence]}</span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="wr-next-btn"
              onClick={handleNext}
              disabled={confidence === 0}
            >
              {currentIdx + 1 >= questions.length ? 'Finish Session' : 'Next Question →'}
            </button>
            {confidence === 0 && (
              <p className="wr-next-hint">Rate your confidence to continue</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Summary view ──────────────────────────────────────────────────────────────

function SummaryView({ session, responses, timeTakenSeconds, onSaveExit }) {
  const { questions, category } = session;

  // Build per-question data
  const questionData = responses.map((r, i) => {
    const q = questions.find(q => q.id === r.questionId) || questions[i];
    return { question: q, confidence: r.confidence };
  });

  const answered = questionData.length;
  const avgConf = answered === 0 ? 0 :
    Math.round((questionData.reduce((a, d) => a + d.confidence, 0) / answered) * 10) / 10;

  const weak = questionData.filter(d => d.confidence <= 2);
  const strong = questionData.filter(d => d.confidence >= 4);

  // Confidence breakdown counts
  const confCounts = [1, 2, 3, 4, 5].map(star => ({
    star,
    label: CONFIDENCE_LABELS[star],
    count: questionData.filter(d => d.confidence === star).length,
  }));
  const maxCount = Math.max(...confCounts.map(c => c.count), 1);

  const weakTopics = weak.map(d => d.question?.question?.slice(0, 60) || '');
  const date = new Date().toISOString();

  function handleSave() {
    onSaveExit({
      date,
      category: category.label,
      questionsAnswered: answered,
      avgConfidence: avgConf,
      weakTopics,
    });
  }

  return (
    <div className="wr-summary">
      <h3 className="wr-summary-title">Session Complete</h3>

      <div className="wr-summary-overview">
        <div className="wr-summary-stat">
          <span className="wr-summary-num">{formatMmSs(timeTakenSeconds)}</span>
          <span className="wr-summary-label">Time taken</span>
        </div>
        <div className="wr-summary-stat">
          <span className="wr-summary-num">{answered}</span>
          <span className="wr-summary-label">Questions answered</span>
        </div>
        <div className="wr-summary-stat">
          <span className="wr-summary-num">{avgConf > 0 ? avgConf : '—'}</span>
          <span className="wr-summary-label">Avg confidence</span>
        </div>
      </div>

      {/* Confidence chart */}
      <div className="wr-conf-chart">
        <h4 className="wr-conf-chart-title">Confidence Breakdown</h4>
        <div className="wr-conf-bars">
          {confCounts.map(c => (
            <div key={c.star} className="wr-conf-bar-row">
              <span className="wr-conf-bar-label">{c.label}</span>
              <div className="wr-conf-bar-track">
                <div
                  className="wr-conf-bar-fill"
                  style={{ width: `${(c.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="wr-conf-bar-count">{c.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Weak areas */}
      {weak.length > 0 && (
        <div className="wr-areas-section wr-areas-weak">
          <h4 className="wr-areas-title">Weak Areas (1–2 confidence)</h4>
          <ul className="wr-areas-list">
            {weak.map((d, i) => (
              <li key={i} className="wr-area-item wr-area-item-weak">
                <span className="wr-area-dot" style={{ background: '#dc2626' }} />
                <span>{d.question?.question?.slice(0, 90)}…</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strong areas */}
      {strong.length > 0 && (
        <div className="wr-areas-section wr-areas-strong">
          <h4 className="wr-areas-title">Strong Areas (4–5 confidence)</h4>
          <ul className="wr-areas-list">
            {strong.map((d, i) => (
              <li key={i} className="wr-area-item wr-area-item-strong">
                <span className="wr-area-dot" style={{ background: '#2f756e' }} />
                <span>{d.question?.question?.slice(0, 90)}…</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" className="wr-save-btn" onClick={handleSave}>
        Save &amp; Exit
      </button>
    </div>
  );
}

// ── Root export ───────────────────────────────────────────────────────────────

export const InterviewWarRoom = memo(function InterviewWarRoom() {
  const [sessionHistory, setSessionHistory] = useLocalStorage('dem-war-room-history', []);

  // view: 'home' | 'config' | 'session' | 'summary'
  const [view, setView] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionResponses, setSessionResponses] = useState([]);
  const [timeTaken, setTimeTaken] = useState(0);

  const handleStartCategory = useCallback((cat) => {
    setSelectedCategory(cat);
    setView('config');
  }, []);

  const handleBeginSession = useCallback((sessionConfig) => {
    setActiveSession(sessionConfig);
    setView('session');
  }, []);

  const handleEndSession = useCallback((responses, elapsed) => {
    setSessionResponses(responses);
    setTimeTaken(elapsed);
    setView('summary');
  }, []);

  const handleSaveExit = useCallback((summaryData) => {
    setSessionHistory(prev => [...prev, summaryData]);
    setView('home');
    setSelectedCategory(null);
    setActiveSession(null);
    setSessionResponses([]);
    setTimeTaken(0);
  }, [setSessionHistory]);

  const handleCancelConfig = useCallback(() => {
    setView('home');
    setSelectedCategory(null);
  }, []);

  return (
    <section className="section" id="war-room">
      {/* Section header */}
      <div className="wr-section-header">
        <div>
          <p className="eyebrow">Interview Practice</p>
          <h2>Interview War Room</h2>
          <p className="wr-subtitle">Timed mock sessions. Rate your confidence. Track weak areas.</p>
        </div>
      </div>

      {/* Purpose card — shown on home view only */}
      {view === 'home' && (
        <div className="lab-purpose-card">
          <div className="lab-purpose-header">
            <span className="lab-purpose-icon">⚔</span>
            <div>
              <div className="lab-purpose-title">Interview War Room</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 2 }}>
                Estimated time: 15–45 min per session
              </div>
            </div>
          </div>
          <strong style={{ fontSize: '0.85rem', color: 'var(--heading)' }}>What you will practice:</strong>
          <ul style={{ margin: '8px 0 12px', paddingLeft: 18, fontSize: '0.875rem', color: 'var(--text)' }}>
            <li>Communicating data work to stakeholders under time pressure</li>
            <li>Timed mock interview questions with confidence self-rating</li>
            <li>Identifying weak areas and building systematic review habits</li>
          </ul>
          <div className="lab-skills-row">
            {['Communication', 'Stakeholder Management', 'Technical Writing', 'Interview Readiness'].map(s => (
              <span key={s} className="lab-skill-badge">{s}</span>
            ))}
          </div>
        </div>
      )}

      {view === 'home' && (
        <HomeView
          sessionHistory={sessionHistory}
          onStartCategory={handleStartCategory}
        />
      )}

      {view === 'config' && selectedCategory && (
        <SessionConfig
          category={selectedCategory}
          onBegin={handleBeginSession}
          onCancel={handleCancelConfig}
        />
      )}

      {view === 'session' && activeSession && (
        <SessionView
          session={activeSession}
          onEnd={handleEndSession}
        />
      )}

      {view === 'summary' && activeSession && (
        <SummaryView
          session={activeSession}
          responses={sessionResponses}
          timeTakenSeconds={timeTaken}
          onSaveExit={handleSaveExit}
        />
      )}
    </section>
  );
});

export default InterviewWarRoom;
