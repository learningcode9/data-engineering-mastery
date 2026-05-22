import { memo, useMemo, useRef, useState } from 'react';
import { AccordionItem } from '../ui/Accordion.jsx';
import { CodeBlock } from '../ui/CodeBlock.jsx';
import { DifficultyBadge } from '../ui/DifficultyBadge.jsx';
import { PracticeCard } from '../ui/PracticeCard.jsx';
import { SQLWorkspace } from '../workspace/SQLWorkspace.jsx';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';

// ── Subtopic card ──────────────────────────────────────────────────────────────
function SubtopicCard({ subtopic, practiceCompleted, onTogglePractice, sqlMode }) {
  return (
    <div className="subtopic-card">
      <div className="subtopic-card-header">
        <h5>{subtopic.title}</h5>
        <DifficultyBadge level={subtopic.difficulty} />
      </div>
      <div className="subtopic-content">
        <div>
          <span>What it does</span>
          <p>{subtopic.explanation}</p>
        </div>
        <div>
          <span>Why use it</span>
          <p>{subtopic.why}</p>
        </div>
        <div className="subtopic-full">
          <span>Syntax</span>
          <CodeBlock code={subtopic.syntax} />
        </div>
        <div className="subtopic-full">
          <span>Real-world example</span>
          <CodeBlock code={subtopic.example} />
        </div>
        <div>
          <span>Expected output</span>
          <p>{subtopic.expectedOutput}</p>
        </div>
        {subtopic.interview && (
          <div className="subtopic-wide">
            <span>Interview Q&amp;A</span>
            <div className="subtopic-interview">
              <strong>{subtopic.interview.question}</strong>
              <p>{subtopic.interview.answer}</p>
            </div>
          </div>
        )}
      </div>
      {subtopic.practice && sqlMode ? (
        <SQLWorkspace
          subtopic={subtopic}
          completed={practiceCompleted}
          onToggleComplete={onTogglePractice}
        />
      ) : subtopic.practice ? (
        <PracticeCard
          subtopic={subtopic}
          completed={practiceCompleted}
          onToggleComplete={onTogglePractice}
          sqlMode={false}
        />
      ) : null}
    </div>
  );
}

// ── Sticky section navigation ──────────────────────────────────────────────────
function TopicNavBar({ sections, topicId }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [hidden, setHidden]       = useState(false);
  const wrapperRef                = useRef(null);

  function handleNavClick(i) {
    setActiveIdx(i);
    const el = document.getElementById(`${topicId}-section-${i}`);
    if (!el) return;

    const trigger = el.querySelector('.accordion-trigger');
    const wasClosed = trigger && trigger.getAttribute('aria-expanded') === 'false';
    if (wasClosed) trigger.click();

    setTimeout(() => {
      const navH = wrapperRef.current ? wrapperRef.current.offsetHeight : 52;
      const rect = el.getBoundingClientRect();
      const targetY = rect.top + window.scrollY - navH - 8;
      window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
    }, wasClosed ? 320 : 0);
  }

  if (hidden) {
    return (
      <div className="sql-nav-wrapper sql-nav-wrapper--hidden" ref={wrapperRef}>
        <button
          type="button"
          className="sql-nav-toggle sql-nav-show-btn"
          onClick={() => setHidden(false)}
        >
          ▾ Show section nav
        </button>
      </div>
    );
  }

  return (
    <div className="sql-nav-wrapper" ref={wrapperRef}>
      <nav className="sql-nav-bar" aria-label="Jump to section">
        {sections.map((section, i) => (
          <button
            key={section.title}
            type="button"
            className={`sql-nav-btn${activeIdx === i ? ' sql-nav-active' : ''}`}
            onClick={() => handleNavClick(i)}
          >
            {section.title}
          </button>
        ))}
      </nav>
      <button
        type="button"
        className="sql-nav-toggle sql-nav-hide-btn"
        onClick={() => setHidden(true)}
        title="Hide navigation"
        aria-label="Hide section navigation"
      >
        ✕ Hide
      </button>
    </div>
  );
}

function subtopicMatchesSearch(st, lc) {
  return (
    st.id?.toLowerCase().includes(lc) ||
    st.title?.toLowerCase().includes(lc) ||
    st.explanation?.toLowerCase().includes(lc) ||
    st.why?.toLowerCase().includes(lc) ||
    st.syntax?.toLowerCase().includes(lc) ||
    st.example?.toLowerCase().includes(lc) ||
    st.expectedOutput?.toLowerCase().includes(lc) ||
    st.practice?.toLowerCase().includes(lc) ||
    st.hint?.toLowerCase().includes(lc) ||
    st.solution?.toLowerCase().includes(lc) ||
    st.interview?.question?.toLowerCase().includes(lc) ||
    st.interview?.answer?.toLowerCase().includes(lc)
  );
}

// ── Topic sections with search-aware accordion ─────────────────────────────────
function TopicSections({ sections, topicId, sqlMode, searchTerm, practiceProgress, onTogglePractice }) {
  const lc = searchTerm?.toLowerCase() ?? '';
  const [openIndex, setOpenIndex] = useState(0);

  const sectionsWithMatch = useMemo(() => {
    if (!lc) return sections.map(s => ({ ...s, hasMatch: false }));
    return sections.map(s => ({
      ...s,
      hasMatch:
        s.title.toLowerCase().includes(lc) ||
        s.subtopics.some(st => subtopicMatchesSearch(st, lc)),
    }));
  }, [sections, lc]);

  const anyMatch = lc && sectionsWithMatch.some(s => s.hasMatch);

  const firstMatchIndex = lc ? sectionsWithMatch.findIndex(s => s.hasMatch) : -1;
  const effectiveOpenIndex = firstMatchIndex >= 0 ? firstMatchIndex : openIndex;

  return (
    <div className="accordion" style={{ marginTop: 8 }}>
      {sectionsWithMatch.map((section, i) => {
        const matchingSubtopics = lc
          ? section.subtopics.filter(st => subtopicMatchesSearch(st, lc))
          : section.subtopics;

        if (anyMatch && matchingSubtopics.length === 0) return null;

        const practiceSubs    = section.subtopics.filter(st => st.practice);
        const practiceTotal   = practiceSubs.length;
        const completedCount  = practiceSubs.filter(st => !!practiceProgress?.[st.id]).length;

        const badge = practiceTotal === 0
          ? `${section.subtopics.length} topics`
          : completedCount === practiceTotal
            ? '✓ Complete'
            : `${completedCount}/${practiceTotal}`;

        const isComplete = practiceTotal > 0 && completedCount === practiceTotal;
        const isOpen = i === effectiveOpenIndex;
        return (
          <AccordionItem
            key={section.title}
            id={`${topicId}-section-${i}`}
            title={section.title}
            badge={badge}
            badgeVariant={isComplete ? 'success' : undefined}
            controlledOpen={isOpen}
            onOpenChange={next => setOpenIndex(next ? i : -1)}
            level="h4"
          >
            <div className="subtopic-grid">
              {matchingSubtopics.map(st => (
                <SubtopicCard
                  key={st.id ?? st.title}
                  subtopic={st}
                  practiceCompleted={!!practiceProgress?.[st.id]}
                  onTogglePractice={onTogglePractice}
                  sqlMode={sqlMode}
                />
              ))}
            </div>
          </AccordionItem>
        );
      })}
    </div>
  );
}

// ── Query examples ─────────────────────────────────────────────────────────────
function QueryExamples({ examples }) {
  return (
    <section className="wide-section">
      <h4>Practice SQL Queries</h4>
      <div className="query-list">
        {examples.map(ex => (
          <div key={ex.title} className="query-example">
            <strong>{ex.title}</strong>
            <CodeBlock code={ex.sql} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Mini project ───────────────────────────────────────────────────────────────
function MiniProject({ project }) {
  return (
    <section className="wide-section mini-project-card">
      <div className="mini-project-header">
        <span className="mini-project-kicker">Hands-on project</span>
        <h4>{project.title}</h4>
      </div>
      <p className="mini-project-goal">{project.goal}</p>
      <ol className="mini-project-steps">
        {project.steps.map((step, i) => <li key={i}>{step}</li>)}
      </ol>
      <p className="mini-project-output"><strong>Expected output:</strong> {project.output}</p>
    </section>
  );
}

function AppliedScenarios({ groups }) {
  const scenarioGroup = groups?.find(group => /real[-\s]?world|scenario/i.test(group.title));
  if (!scenarioGroup?.questions?.length) return null;

  return (
    <section className="wide-section applied-scenarios">
      <div className="applied-scenarios-header">
        <span className="mini-project-kicker">Enterprise scenarios</span>
        <h4>Production Decision Practice</h4>
      </div>
      <div className="applied-scenario-grid">
        {scenarioGroup.questions.slice(0, 3).map((q, i) => (
          <article key={i} className="applied-scenario-card">
            <strong>{q.question}</strong>
            <p>{q.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

// ── Overview boxes ─────────────────────────────────────────────────────────────
function OverviewSection({ overview }) {
  if (!overview?.length) return null;
  return (
    <div className="learning-content">
      {overview.map(item => (
        <section key={item.title}>
          <h4>{item.title}</h4>
          <p>{item.body}</p>
        </section>
      ))}
    </div>
  );
}

// ── Quick Q&A ─────────────────────────────────────────────────────────────────
function QuickQuestions({ questions }) {
  if (!questions?.length) return null;
  return (
    <section>
      <h4>Quick Q&amp;A</h4>
      <ul className="interview-list">
        {questions.map((q, i) => (
          <li key={i} className="check-item iq-item">
            <strong>{q.question}</strong>
            <p>{q.answer}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Interview groups ───────────────────────────────────────────────────────────
const REAL_WORLD_RE = /real[-\s]?world|scenario/i;

function InterviewGroups({ groups }) {
  if (!groups?.length) return null;
  // Real-world scenarios are rendered separately by AppliedScenarios below.
  // Only render the level-based groups here to avoid the 4th-item wrap bug.
  const levelGroups = groups.filter(g => !REAL_WORLD_RE.test(g.title));
  if (!levelGroups.length) return null;
  return (
    <section className="wide-section">
      <h4>Interview Questions by Level</h4>
      <div className="interview-questions-grid">
        {levelGroups.map(group => (
          <div key={group.title} className="interview-group">
            <strong>{group.title}</strong>
            <ul className="interview-list">
              {group.questions.map((q, i) => (
                <li key={i} className="iq-item">
                  <strong>{q.question}</strong>
                  <p>{q.answer}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Notes box with auto-save, copy, timestamp ─────────────────────────────────
function NotesBox({ topicId, notes, onNotesChange }) {
  const [showSaved, setShowSaved] = useState(false);
  const [copyDone,  setCopyDone]  = useState(false);
  const saveTimer = useRef(null);
  const [timestamps, setTimestamps] = useLocalStorage('dem-note-timestamps', {});

  function handleChange(text) {
    onNotesChange(topicId, text);
    clearTimeout(saveTimer.current);
    setShowSaved(false);
    saveTimer.current = setTimeout(() => {
      setTimestamps(prev => ({ ...prev, [topicId]: new Date().toISOString() }));
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }, 700);
  }

  function handleCopy() {
    if (!notes) return;
    navigator.clipboard.writeText(notes).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 1800);
    });
  }

  function formatTs(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return (
      d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    );
  }

  const ts = timestamps[topicId];
  const charCount = (notes ?? '').length;

  return (
    <div className="notes-box">
      <div className="notes-header">
        <span>My Notes</span>
        <div className="notes-toolbar">
          {showSaved && <span className="notes-saved">Saved ✓</span>}
          {ts && !showSaved && <span className="notes-timestamp">Saved {formatTs(ts)}</span>}
          <button
            type="button"
            className="secondary-button notes-copy-btn"
            onClick={handleCopy}
            disabled={!notes}
            title="Copy notes to clipboard"
          >
            {copyDone ? '✓ Copied' : '⎘ Copy'}
          </button>
        </div>
      </div>
      <textarea
        placeholder="Write notes, key takeaways, or questions here…"
        value={notes ?? ''}
        onChange={e => handleChange(e.target.value)}
        aria-label="Topic notes"
      />
      <div className="notes-footer">
        <span className="notes-charcount">{charCount} {charCount === 1 ? 'char' : 'chars'}</span>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
const TopicDetails = memo(function TopicDetails({
  topic,
  completed,
  notes,
  onNotesChange,
  onToggleComplete,
  searchTerm,
  practiceProgress,
  onTogglePractice,
}) {
  const mod = topic.module;

  const totalSubtopics = mod?.sections?.reduce(
    (acc, s) => acc + s.subtopics.length, 0
  ) ?? 0;

  const completedPractice = mod?.sections
    ? mod.sections.reduce(
        (acc, s) => acc + s.subtopics.filter(st => practiceProgress?.[st.id]).length,
        0
      )
    : 0;

  return (
    <article className="topic-details">
      <div className="topic-details-header">
        <div>
          <p className="eyebrow">Topic Details</p>
          <h3>{topic.title}</h3>
          {totalSubtopics > 0 && (
            <p className="topic-stats">
              {completedPractice} / {totalSubtopics} practice tasks completed
            </p>
          )}
        </div>
        <button
          type="button"
          className={`secondary-button${completed ? ' completed' : ''}`}
          onClick={() => onToggleComplete(topic.id)}
        >
          {completed ? '✓ Completed' : 'Mark completed'}
        </button>
      </div>

      <OverviewSection overview={topic.overview} />
      <QuickQuestions questions={topic.questions} />

      {mod?.sections?.length > 0 && (
        <section className="deep-dive-section">
          <div className="deep-dive-heading">
            <div>
              <h4>Deep Dive Sections</h4>
              <p>Open one section at a time to keep the lesson focused.</p>
            </div>
            <span>{mod.sections.length} sections</span>
          </div>
          {mod.sections.length > 4 && (
            <TopicNavBar sections={mod.sections} topicId={topic.id} />
          )}
          <TopicSections
            sections={mod.sections}
            topicId={topic.id}
            sqlMode={topic.id === 'sql'}
            searchTerm={searchTerm}
            practiceProgress={practiceProgress}
            onTogglePractice={onTogglePractice}
          />
        </section>
      )}

      {mod?.queryExamples?.length > 0 && (
        <QueryExamples examples={mod.queryExamples} />
      )}

      {mod?.miniProjects?.length > 0 && mod.miniProjects.map((p, i) => (
        <MiniProject key={i} project={p} />
      ))}
      {!mod?.miniProjects?.length && mod?.miniProject && <MiniProject project={mod.miniProject} />}

      <InterviewGroups groups={mod?.interviewGroups} />
      <AppliedScenarios groups={mod?.interviewGroups} />

      <NotesBox topicId={topic.id} notes={notes} onNotesChange={onNotesChange} />
    </article>
  );
});

export default TopicDetails;
