import { memo, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { AccordionItem } from '../ui/Accordion.jsx';
import { InterviewQuestionCard } from '../ui/InterviewQuestionCard.jsx';
import { sqlInterviewQuestions } from '../../data/interviewQuestions.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { EmptyState } from '../ui/EmptyState.jsx';
import { SearchInput } from '../ui/design-system.jsx';

const LEVEL_META = {
  beginner:     { label: 'Beginner',     icon: '◎', desc: 'Core SQL concepts and syntax' },
  intermediate: { label: 'Intermediate', icon: '◈', desc: 'Joins, CTEs, window functions' },
  advanced:     { label: 'Advanced',     icon: '◆', desc: 'Performance, SCD, deduplication' },
  realWorld:    { label: 'Real-world',   icon: '◉', desc: 'Scenario-based pipeline questions' },
};

function questionKey(q) {
  return (q.q ?? '').slice(0, 60).replace(/\W+/g, '_');
}

// Flatten all questions into one array with level info
function getAllQuestions() {
  return Object.entries(sqlInterviewQuestions).flatMap(([level, qs]) =>
    qs.map(q => ({ ...q, level }))
  );
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function TimedModePanel({ onExit }) {
  const ALL = getAllQuestions();
  const [questions] = useState(() => {
    const shuffled = [...ALL].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  });
  const [current, setCurrent]   = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [scores, setScores]     = useState([]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [phase, setPhase]       = useState('answering'); // answering | revealed | done
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
    const newScores = [...scores, s];
    setScores(newScores);
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
      <div className="timed-done">
        <div className="timed-done-score">
          <span className="timed-done-pct">{pct}%</span>
          <span className="timed-done-label">{got}/{questions.length} correct</span>
        </div>
        <p className="timed-done-feedback">
          {pct >= 80 ? '🎉 Excellent! You are interview-ready on this topic.' :
           pct >= 60 ? '👍 Good performance. Review the questions you missed.' :
           '📚 Keep practising. Focus on the questions you were unsure about.'}
        </p>
        <div className="timed-done-breakdown">
          {questions.map((q, i) => (
            <div key={i} className={`timed-done-q timed-done-q--${scores[i] ?? 'skip'}`}>
              <span className="timed-done-q-icon">
                {scores[i] === 'got' ? '✓' : scores[i] === 'almost' ? '~' : '✗'}
              </span>
              <span className="timed-done-q-text">{q.q?.slice(0, 70)}…</span>
            </div>
          ))}
        </div>
        <button type="button" className="secondary-button" onClick={onExit}>← Back to questions</button>
      </div>
    );
  }

  const q = questions[current];
  const urgency = timeLeft <= 30 ? 'urgent' : timeLeft <= 60 ? 'warning' : 'normal';

  return (
    <div className="timed-panel">
      <div className="timed-header">
        <div className="timed-progress">
          <span className="timed-progress-label">Question {current + 1} / {questions.length}</span>
          <div className="timed-progress-bar">
            <div className="timed-progress-fill" style={{ width: `${((current) / questions.length) * 100}%` }} />
          </div>
        </div>
        <div className={`timed-timer timed-timer--${urgency}`}>
          ⏱ {formatTime(timeLeft)}
        </div>
        <button type="button" className="secondary-button timed-exit-btn" onClick={onExit}>Exit</button>
      </div>

      <div className="timed-question-card">
        <div className="timed-q-meta">
          <span className="timed-q-level">{LEVEL_META[q.level]?.icon} {LEVEL_META[q.level]?.label}</span>
        </div>
        <p className="timed-q-text">{q.q}</p>

        {!revealed ? (
          <button type="button" className="timed-reveal-btn" onClick={handleReveal}>
            Reveal Answer
          </button>
        ) : (
          <>
            <div className="timed-answer">
              <p className="timed-answer-label">Answer</p>
              <p className="timed-answer-text">{q.a}</p>
              {q.scenario && (
                <div className="timed-scenario">
                  <p className="timed-scenario-label">Real-world context</p>
                  <p>{q.scenario}</p>
                </div>
              )}
            </div>
            <div className="timed-score-row">
              <p className="timed-score-label">How did you do?</p>
              <div className="timed-score-btns">
                <button type="button" className="timed-score-btn timed-score-btn--miss" onClick={() => handleScore('miss')}>
                  ✗ Missed
                </button>
                <button type="button" className="timed-score-btn timed-score-btn--almost" onClick={() => handleScore('almost')}>
                  ~ Almost
                </button>
                <button type="button" className="timed-score-btn timed-score-btn--got" onClick={() => handleScore('got')}>
                  ✓ Got it
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function QuestionGroup({ level, questions, filter, learnedSet, revisionSet, onToggleLearn, onToggleRevision }) {
  const meta = LEVEL_META[level];
  const lc   = filter.toLowerCase();

  const filtered = useMemo(() => {
    if (!lc) return questions;
    return questions.filter(q =>
      q.q?.toLowerCase().includes(lc) ||
      q.a?.toLowerCase().includes(lc) ||
      q.scenario?.toLowerCase().includes(lc)
    );
  }, [questions, lc]);

  if (filtered.length === 0) return null;

  const learnedCount = filtered.filter(q => learnedSet[questionKey(q)]).length;
  const badge = learnedCount > 0
    ? `${learnedCount}/${filtered.length} learned`
    : `${filtered.length} questions`;

  return (
    <AccordionItem title={`${meta.icon}  ${meta.label}`} badge={badge} level="h3">
      <p className="level-desc">{meta.desc}</p>
      <div className="iq-list">
        {filtered.map((item, i) => {
          const key = questionKey(item);
          return (
            <InterviewQuestionCard
              key={i}
              question={item.q}
              answer={item.a}
              scenario={item.scenario}
              learned={!!learnedSet[key]}
              revision={!!revisionSet[key]}
              onToggleLearn={() => onToggleLearn(key)}
              onToggleRevision={() => onToggleRevision(key)}
              level={level}
            />
          );
        })}
      </div>
    </AccordionItem>
  );
}

function RandomQuestion({ learnedSet }) {
  const [question, setQuestion] = useState(null);
  const [revealed, setRevealed] = useState(false);

  function newQuestion() {
    const all = getAllQuestions();
    const unlearned = all.filter(q => !learnedSet[questionKey(q)]);
    const pool = unlearned.length > 0 ? unlearned : all;
    setQuestion(pool[Math.floor(Math.random() * pool.length)]);
    setRevealed(false);
  }

  return (
    <div className="random-q-panel">
      <div className="random-q-header">
        <span className="random-q-title">Random Question</span>
        <button type="button" className="secondary-button practice-btn" onClick={newQuestion}>
          🎲 Generate
        </button>
      </div>
      {question && (
        <div className="random-q-card">
          <span className="random-q-level">{LEVEL_META[question.level]?.icon} {LEVEL_META[question.level]?.label}</span>
          <p className="random-q-text">{question.q}</p>
          {!revealed ? (
            <button type="button" className="secondary-button practice-btn" onClick={() => setRevealed(true)}>
              Show answer
            </button>
          ) : (
            <div className="random-q-answer">
              <p>{question.a}</p>
            </div>
          )}
        </div>
      )}
      {!question && (
        <p className="random-q-hint">Click Generate to get a random interview question from your unlearned pool.</p>
      )}
    </div>
  );
}

const InterviewPrep = memo(function InterviewPrep() {
  const [filter, setFilter]           = useState('');
  const [collapseVersion, setCollapseVersion] = useState(0);
  const [mode, setMode]               = useState('browse'); // browse | timed
  const [learnedSet,  setLearnedSet]  = useLocalStorage('dem-interview-learned',   {});
  const [revisionSet, setRevisionSet] = useLocalStorage('dem-interview-revision',  {});

  const toggleLearn    = useCallback(key => setLearnedSet(p  => ({ ...p,  [key]: !p[key]  })), [setLearnedSet]);
  const toggleRevision = useCallback(key => setRevisionSet(p => ({ ...p,  [key]: !p[key]  })), [setRevisionSet]);

  const levelKeys      = Object.keys(LEVEL_META);
  const totalQuestions = Object.values(sqlInterviewQuestions).reduce((a, b) => a + b.length, 0);
  const totalLearned   = Object.values(learnedSet ?? {}).filter(Boolean).length;
  const totalRevision  = Object.values(revisionSet ?? {}).filter(Boolean).length;
  const masteryPct     = Math.round((totalLearned / totalQuestions) * 100);

  const anyResult = useMemo(() => {
    const lc = filter.toLowerCase();
    if (!lc) return true;
    return levelKeys.some(key =>
      sqlInterviewQuestions[key]?.some(q =>
        q.q?.toLowerCase().includes(lc) ||
        q.a?.toLowerCase().includes(lc) ||
        q.scenario?.toLowerCase().includes(lc)
      )
    );
  }, [filter, levelKeys]);

  if (mode === 'timed') {
    return (
      <section className="section" id="interview-prep">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Interview Prep</p>
            <h2>Timed Interview Session</h2>
          </div>
        </div>
        <TimedModePanel onExit={() => setMode('browse')} />
      </section>
    );
  }

  return (
    <section className="section" id="interview-prep">
      <div className="iq-toolbar">
        <div>
          <p className="eyebrow">Interview Prep</p>
          <h2>SQL Interview Questions</h2>
        </div>
        <div className="iq-toolbar-right">
          <SearchInput
            className="search iq-search"
            placeholder="Search questions…"
            value={filter}
            onChange={e => setFilter(e.target.value)}
            aria-label="Filter interview questions"
          />
          <div className="interview-stats">
            {totalLearned > 0 && (
              <span className="interview-stat interview-stat--learned">✓ {totalLearned}</span>
            )}
            {totalRevision > 0 && (
              <span className="interview-stat interview-stat--revision">↻ {totalRevision}</span>
            )}
            <span className="interview-stat">{totalQuestions} q</span>
            <button
              type="button"
              className="interview-timed-btn"
              onClick={() => setMode('timed')}
            >
              ⏱ Timed
            </button>
            <button
              type="button"
              className="secondary-button practice-btn"
              onClick={() => setCollapseVersion(v => v + 1)}
            >
              Collapse all
            </button>
          </div>
        </div>
      </div>

      {masteryPct > 0 && (
        <div className="iq-mastery-strip">
          <div className="iq-mastery-label">
            <span>Overall mastery</span>
            <span className="iq-mastery-pct" style={{ color: masteryPct >= 80 ? 'var(--strong-green)' : masteryPct >= 50 ? '#d4a800' : 'var(--muted)' }}>
              {masteryPct}%
            </span>
          </div>
          <div className="iq-mastery-track">
            <div className="iq-mastery-fill" style={{ width: `${masteryPct}%` }} />
          </div>
          <span className="iq-mastery-sub">{totalLearned} of {totalQuestions} questions mastered
            {masteryPct >= 80 && ' · Interview ready ✦'}
            {masteryPct >= 50 && masteryPct < 80 && ' · Strong progress'}
          </span>
        </div>
      )}

      {!anyResult && (
        <EmptyState
          icon="◌"
          title={`No questions match "${filter}"`}
          body="Try a different keyword — topics include joins, CTEs, window functions, performance, and SCD patterns."
          variant="compact"
        />
      )}

      <div className="accordion">
        {levelKeys.map(key => (
          <QuestionGroup
            key={`${key}-${collapseVersion}`}
            level={key}
            questions={sqlInterviewQuestions[key]}
            filter={filter}
            learnedSet={learnedSet}
            revisionSet={revisionSet}
            onToggleLearn={toggleLearn}
            onToggleRevision={toggleRevision}
          />
        ))}
      </div>

      <RandomQuestion learnedSet={learnedSet} />
    </section>
  );
});

export default InterviewPrep;
