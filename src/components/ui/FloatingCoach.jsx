import { memo, useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { useLearningMemory } from '../../hooks/useLearningMemory.js';
import { getRecommendedNext } from '../../data/skillGraph.js';
import { topics } from '../../data/topics.js';
import useLearningStore from '../../store/learningStore.js';

function computeProgress(practiceProgress) {
  const result = {};
  for (const t of topics) {
    const sections = t.module?.sections ?? [];
    const practisable = sections.filter(s => s.subtopics.some(st => st.practice));
    if (!practisable.length) { result[t.id] = 0; continue; }
    const done = practisable.filter(s =>
      s.subtopics.filter(st => st.practice).every(st => !!practiceProgress?.[st.id])
    ).length;
    result[t.id] = Math.round((done / practisable.length) * 100);
  }
  return result;
}

// Dynamic coaching suggestions based on real learner state
function buildSuggestions({ progress, learnedCount, streak, overdueTopics, strugglingTopics }) {
  const suggestions = [];
  const topic = id => topics.find(t => t.id === id);

  // Spaced repetition overdue
  if (overdueTopics.length) {
    const t = overdueTopics[0];
    const name = topic(t.topicId)?.title ?? t.topicId;
    suggestions.push({
      type: 'revision',
      icon: '↻',
      color: '#f59e0b',
      title: `Revise ${name}`,
      body: `You last studied this ${t.daysAgo}d ago. Spaced repetition says: review now for long-term retention.`,
      prompt: `I studied "${name}" ${t.daysAgo} days ago and need a spaced repetition review session. Quiz me with 5 questions escalating from recall → application → edge cases. Mark my confidence and tell me what to review next.`,
    });
  }

  // Struggling topic help
  if (strugglingTopics.length) {
    const s = strugglingTopics[0];
    const name = topic(s.topicId)?.title ?? s.topicId;
    suggestions.push({
      type: 'weakness',
      icon: '⚠',
      color: '#dc2626',
      title: `Struggling with ${name}`,
      body: `You've skipped or missed ${s.count} tasks here. Let's address the root confusion rather than moving on.`,
      prompt: `I keep struggling with "${name}" — I've missed or skipped ${s.count} practice tasks. Diagnose: (1) what are the most common misconceptions about this topic for someone at my level? (2) Give me the one mental model that makes everything else click. (3) Walk through the hardest concept step-by-step with a production example.`,
    });
  }

  // Recommended next topic (readiness-based)
  const readyTopics = getRecommendedNext(progress);
  if (readyTopics.length) {
    const rt = readyTopics[0];
    suggestions.push({
      type: 'next',
      icon: '→',
      color: '#2f756e',
      title: `Ready for ${rt.label}`,
      body: `Your prerequisites are ${rt.readiness}% complete. This is the optimal time to start ${rt.label}.`,
      prompt: `I've built enough foundation and I'm ready to start "${rt.label}". My SQL is ${progress.sql ?? 0}% and Python is ${progress.python ?? 0}% complete. Give me: (1) the 3 concepts I need to understand first week, (2) a hands-on starter project I can run in a notebook today, (3) the mental model shift from what I already know.`,
    });
  }

  // Interview readiness nudge
  const interviewPct = Math.min(Math.round((learnedCount / 20) * 100), 100);
  if (interviewPct < 50) {
    suggestions.push({
      type: 'interview',
      icon: '◌',
      color: '#6b7cdb',
      title: 'Interview gap detected',
      body: `${learnedCount}/20 target questions mastered. Most data engineering roles require 15+ to pass phone screens.`,
      prompt: `I've mastered ${learnedCount} out of 20 target interview questions for a data engineering role. Identify the 5 most important SQL/PySpark interview questions I likely haven't covered yet. For each: question, ideal answer structure, common wrong answers, and a follow-up the interviewer will ask.`,
    });
  }

  // Streak maintenance
  if (streak === 0) {
    suggestions.push({
      type: 'habit',
      icon: '🔥',
      color: '#e25a1c',
      title: 'Start a learning streak',
      body: `Consistent daily practice compounds faster than weekend cramming. Even 10 minutes counts.`,
      prompt: `I have exactly 10 minutes to study data engineering. Give me the single most high-value concept for someone learning SQL + PySpark, a two-line code snippet I can memorize, and the one interview question most likely to come up this week.`,
    });
  }

  // Default encouragement with advanced challenge
  if (!suggestions.length) {
    suggestions.push({
      type: 'challenge',
      icon: '✦',
      color: '#2f756e',
      title: 'Advanced challenge available',
      body: `Strong overall progress. Time for production-level thinking.`,
      prompt: `I'm at an intermediate-advanced level in data engineering (SQL 70%+, PySpark 50%+). Give me one senior-level challenge: a realistic system design scenario requiring tradeoffs between batch vs streaming, storage costs vs query speed, or schema flexibility vs performance. Walk me through the decision framework a senior engineer uses.`,
    });
  }

  return suggestions.slice(0, 3);
}

function fakeCoachResponse(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('sql')) {
    return `SQL debugging plan:

1. Confirm table and column names from the schema explorer.
2. Write the smallest query that returns the target rows.
3. Compare row count and key values against the expected output.
4. Add joins/CTEs only after the base filter is correct.

For interview practice, explain the business rule first, then the SQL.`;
  }
  if (p.includes('pyspark') || p.includes('spark')) {
    return `PySpark approach:

1. Read with an explicit schema.
2. Filter and select early to reduce shuffle volume.
3. Use explain() before running expensive actions.
4. Check Spark UI for skew, shuffle size, and spill.
5. Write Delta/Parquet partitioned by the most common date filter.`;
  }
  if (p.includes('incident') || p.includes('debug') || p.includes('root')) {
    return `Incident workflow:

1. State impact: severity, affected system, SLA risk.
2. Inspect logs for the first failing component.
3. Verify data symptoms with a small SQL query.
4. Apply the lowest-risk fix.
5. Write an RCA with trigger, blast radius, fix, and prevention.`;
  }
  if (p.includes('architecture') || p.includes('design')) {
    return `Architecture review:

Start with the SLA and data contract. Then choose batch or streaming based on latency, pick storage by query pattern, and define monitoring before coding.

Senior signal: mention tradeoffs, failure modes, and rollback strategy.`;
  }
  return `Recommended next step:

Pick one focused workflow and finish it end-to-end: read the concept, run the practice task, explain the result out loud, and write one note.

That turns passive reading into interview-ready recall.`;
}

const FloatingCoach = memo(function FloatingCoach({ activeSection, engineeringMode }) {
  const [open, setOpen]           = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [input, setInput]         = useState('');
  const [messages, setMessages]   = useState([
    {
      role: 'assistant',
      text: 'Ask me to explain a concept, debug SQL or PySpark, review architecture, or summarize an incident.',
    },
  ]);
  const [practiceProgress]        = useLocalStorage('dem-practice-progress', {});
  const [learnedSet]              = useLocalStorage('dem-interview-learned', {});
  const streak                    = useLearningStore(s => s.streakCount);

  const { overdueTopics, strugglingTopics } = useLearningMemory();

  const progress     = useMemo(() => computeProgress(practiceProgress), [practiceProgress]);
  const learnedCount = Object.values(learnedSet).filter(Boolean).length;

  const suggestions = useMemo(() =>
    buildSuggestions({ progress, learnedCount, streak, overdueTopics, strugglingTopics }),
    [progress, learnedCount, streak, overdueTopics, strugglingTopics]
  );

  const urgentCount = (overdueTopics.length > 0 ? 1 : 0) + (strugglingTopics.length > 0 ? 1 : 0);

  const copy = useCallback((prompt, idx) => {
    navigator.clipboard.writeText(prompt).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2200);
    });
  }, []);

  const sendPrompt = useCallback((prompt) => {
    const clean = prompt.trim();
    if (!clean) return;
    setMessages(prev => [
      ...prev,
      { role: 'user', text: clean },
      { role: 'assistant', text: fakeCoachResponse(clean) },
    ].slice(-8));
    setInput('');
  }, []);

  const sectionLabels = {
    topics: 'Learning Topics', roadmap: 'Roadmap', projects: 'Projects',
    analytics: 'Analytics', 'interview-prep': 'Interview Prep',
    'ai-learning': 'AI Coach', architecture: 'Architecture', databricks: 'Databricks',
  };
  const currentSection = sectionLabels[activeSection] ?? 'Dashboard';

  return (
    <>
      {/* Floating trigger */}
      <button
        type="button"
        className={`coach-fab${open ? ' coach-fab--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI mentor"
        title="AI Mentor"
      >
        <span className="coach-fab-icon" aria-hidden="true">
          {open ? '✕' : '◈'}
        </span>
        {!open && urgentCount > 0 && (
          <span className="coach-fab-badge" aria-label={`${urgentCount} coaching alerts`}>{urgentCount}</span>
        )}
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="coach-panel" role="complementary" aria-label="AI mentor panel">
          <div className="coach-panel-header">
            <div className="coach-panel-title">
              <span className="coach-panel-icon" aria-hidden="true">◈</span>
              <div>
                <strong>AI Mentor</strong>
                <span className="coach-panel-context">↳ {currentSection}</span>
              </div>
            </div>
            {engineeringMode && (
              <span className="coach-eng-badge">Engineering Mode</span>
            )}
          </div>

          <div className="coach-suggestions">
            {suggestions.map((s, i) => (
              <div key={i} className="coach-suggestion" style={{ '--sg-color': s.color }}>
                <div className="coach-sg-top">
                  <span className="coach-sg-icon" aria-hidden="true">{s.icon}</span>
                  <span className="coach-sg-type">{s.type}</span>
                </div>
                <p className="coach-sg-title">{s.title}</p>
                <p className="coach-sg-body">{s.body}</p>
                <button
                  type="button"
                  className={`coach-sg-copy${copiedIdx === i ? ' coach-sg-copy--done' : ''}`}
                  onClick={() => copy(s.prompt, i)}
                >
                  {copiedIdx === i ? '✓ Copied to clipboard' : '⎘ Copy AI prompt'}
                </button>
                <button
                  type="button"
                  className="coach-sg-ask"
                  onClick={() => sendPrompt(s.prompt)}
                >
                  Ask Copilot
                </button>
              </div>
            ))}
          </div>

          <div className="coach-chat">
            <div className="coach-chat-log" aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={`coach-msg coach-msg--${m.role}`}>
                  <span>{m.role === 'assistant' ? 'AI' : 'You'}</span>
                  <p>{m.text}</p>
                </div>
              ))}
            </div>
            <form
              className="coach-chat-form"
              onSubmit={e => {
                e.preventDefault();
                sendPrompt(input);
              }}
            >
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about SQL, Spark, incidents..."
                aria-label="Ask AI mentor"
              />
              <button type="submit" disabled={!input.trim()}>Send</button>
            </form>
          </div>

          <div className="coach-panel-footer">
            <span className="coach-footer-hint">Mock copilot responses for local practice. No external API calls.</span>
          </div>
        </div>
      )}
    </>
  );
});

export default FloatingCoach;
