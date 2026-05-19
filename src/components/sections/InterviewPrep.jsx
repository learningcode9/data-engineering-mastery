import { memo, useState, useMemo, useCallback } from 'react';
import { AccordionItem } from '../ui/Accordion.jsx';
import { InterviewQuestionCard } from '../ui/InterviewQuestionCard.jsx';
import { sqlInterviewQuestions } from '../../data/interviewQuestions.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';

const LEVEL_META = {
  beginner:     { label: 'Beginner',     icon: '◎', desc: 'Core SQL concepts and syntax' },
  intermediate: { label: 'Intermediate', icon: '◈', desc: 'Joins, CTEs, window functions' },
  advanced:     { label: 'Advanced',     icon: '◆', desc: 'Performance, SCD, deduplication' },
  realWorld:    { label: 'Real-world',   icon: '◉', desc: 'Scenario-based pipeline questions' },
};

function questionKey(q) {
  return (q.q ?? '').slice(0, 60).replace(/\W+/g, '_');
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
            />
          );
        })}
      </div>
    </AccordionItem>
  );
}

const InterviewPrep = memo(function InterviewPrep() {
  const [filter, setFilter] = useState('');
  const [collapseVersion, setCollapseVersion] = useState(0);
  const [learnedSet,  setLearnedSet]  = useLocalStorage('dem-interview-learned',   {});
  const [revisionSet, setRevisionSet] = useLocalStorage('dem-interview-revision',  {});

  const toggleLearn    = useCallback(key => setLearnedSet(p  => ({ ...p,  [key]: !p[key]  })), [setLearnedSet]);
  const toggleRevision = useCallback(key => setRevisionSet(p => ({ ...p,  [key]: !p[key]  })), [setRevisionSet]);

  const levelKeys      = Object.keys(LEVEL_META);
  const totalQuestions = Object.values(sqlInterviewQuestions).reduce((a, b) => a + b.length, 0);
  const totalLearned   = Object.values(learnedSet).filter(Boolean).length;
  const totalRevision  = Object.values(revisionSet).filter(Boolean).length;

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

  return (
    <section className="section" id="interview-prep">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Interview Prep</p>
          <h2>SQL Interview Questions</h2>
        </div>
        <div className="interview-stats">
          {totalLearned > 0 && (
            <span className="interview-stat interview-stat--learned">✓ {totalLearned} learned</span>
          )}
          {totalRevision > 0 && (
            <span className="interview-stat interview-stat--revision">↻ {totalRevision} to review</span>
          )}
          <span className="interview-stat">{totalQuestions} total</span>
          <button
            type="button"
            className="secondary-button practice-btn"
            onClick={() => setCollapseVersion(v => v + 1)}
          >
            Collapse all
          </button>
        </div>
      </div>

      <p style={{ color: 'var(--muted)', marginBottom: 16 }}>
        Click any question to reveal the answer. Mark learned or add to revision queue.
      </p>

      <div className="search" style={{ maxWidth: 420, marginBottom: 16 }}>
        <span aria-hidden="true">⌕</span>
        <input
          type="search"
          placeholder="Search questions…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          aria-label="Filter interview questions"
        />
      </div>

      {!anyResult && (
        <div className="empty-state">
          <p>No questions match "{filter}"</p>
        </div>
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
    </section>
  );
});

export default InterviewPrep;
