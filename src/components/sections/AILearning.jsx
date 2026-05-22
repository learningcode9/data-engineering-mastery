import { memo, useState, useMemo } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { topics as ALL_TOPICS } from '../../data/topics.js';
import { useLearningMemory } from '../../hooks/useLearningMemory.js';

// ─── helpers ────────────────────────────────────────────────────────────────

function computeTopicProgress(practiceProgress) {
  return ALL_TOPICS.map(t => {
    const sections = t.module?.sections ?? [];
    const practisable = sections.filter(s => s.subtopics.some(st => st.practice));
    if (!practisable.length) return { id: t.id, title: t.title, pct: 0 };
    const done = practisable.filter(s =>
      s.subtopics.filter(st => st.practice).every(st => !!practiceProgress?.[st.id])
    ).length;
    return { id: t.id, title: t.title, pct: Math.round((done / practisable.length) * 100) };
  });
}

// ─── Smart Insights ──────────────────────────────────────────────────────────

function InsightCard({ insight, index }) {
  const [copied, setCopied] = useState(false);

  function handle() {
    navigator.clipboard.writeText(insight.prompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <div className="ai-insight-card" style={{ '--ins-color': insight.color, animationDelay: `${index * 0.07}s` }}>
      <div className="ai-insight-top">
        <span className="ai-insight-icon" aria-hidden="true">{insight.icon}</span>
        <span className="ai-insight-tag">{insight.tag}</span>
      </div>
      <p className="ai-insight-body">{insight.body}</p>
      <p className="ai-insight-sub">{insight.sub}</p>
      <button type="button" className={`ai-insight-cta${copied ? ' ai-insight-cta--done' : ''}`} onClick={handle}>
        {copied ? '✓ Copied' : insight.cta}
      </button>
    </div>
  );
}

function SmartInsights() {
  const [practiceProgress] = useLocalStorage('dem-practice-progress', {});
  const [learnedSet]       = useLocalStorage('dem-interview-learned', {});
  const [completedTopics]  = useLocalStorage('dem-completed-topics', {});
  const [streak]           = useLocalStorage('dem-streak-count', 0);

  const topicProg = useMemo(() => computeTopicProgress(practiceProgress), [practiceProgress]);
  const learnedCount = Object.values(learnedSet).filter(Boolean).length;
  const totalTasks   = Object.values(practiceProgress).filter(Boolean).length;

  const inProgress = topicProg.filter(t => t.pct > 0 && t.pct < 100).sort((a, b) => b.pct - a.pct);
  const notStarted = topicProg.filter(t => t.pct === 0 && !completedTopics[t.id]);
  const weakest    = [...topicProg].filter(t => t.pct < 25).sort((a, b) => a.pct - b.pct)[0];
  const nextTopic  = inProgress[0] ?? notStarted[0];
  const interviewPct = Math.min(Math.round((learnedCount / 20) * 100), 100);

  const insights = [];

  if (nextTopic) {
    const resuming = inProgress.length > 0;
    insights.push({
      icon: resuming ? '▶' : '→',
      tag: resuming ? 'Continue learning' : 'Suggested next',
      body: `${resuming ? 'Resume' : 'Start'} ${nextTopic.title}`,
      sub: resuming
        ? `${nextTopic.pct}% done — finish this to unlock the next phase`
        : 'Not started yet — this topic is high-value for interviews',
      cta: `Get a study plan →`,
      color: '#2f756e',
      prompt: `Create a focused 30-minute study plan for "${nextTopic.title}" in data engineering. Include: 3 key concepts to understand, 2 hands-on exercises I can do right now, and 2 likely interview questions on this topic.`,
    });
  }

  if (weakest && weakest.pct < 20 && weakest.id !== nextTopic?.id) {
    insights.push({
      icon: '⚠',
      tag: 'Skill gap',
      body: `${weakest.title} is behind`,
      sub: `${weakest.pct}% complete — gaps here will show in technical screens`,
      cta: `Bridge this gap →`,
      color: '#f59e0b',
      prompt: `I'm weak on "${weakest.title}" as a data engineer. Give me: (1) the 5 most important concepts I need to know, (2) common interview questions and ideal answers, (3) a beginner code example I can learn from. Be concise and practical.`,
    });
  }

  if (interviewPct < 60) {
    insights.push({
      icon: '◌',
      tag: 'Interview readiness',
      body: `${interviewPct}% ready — room to grow`,
      sub: `${learnedCount} of 20 target questions mastered`,
      cta: `Practice interview Q&A →`,
      color: '#6b7cdb',
      prompt: `I'm preparing for a data engineering interview and scored ${interviewPct}% readiness. Quiz me on: SQL window functions, Delta Lake merge patterns, and Spark partitioning strategies. One question at a time, assess my answer, then move to the next.`,
    });
  }

  if (streak === 0 || streak < 3) {
    insights.push({
      icon: '🔥',
      tag: streak === 0 ? 'Start a streak' : `${streak}-day streak`,
      body: streak === 0 ? 'No active streak yet' : `Keep it going!`,
      sub: streak === 0
        ? 'Daily practice compounds — start with just 10 minutes'
        : 'Consistent learners are 3× more likely to land the role',
      cta: `10-minute session →`,
      color: '#e25a1c',
      prompt: `I have exactly 10 minutes to study data engineering. Give me one key concept, one short code snippet, and one interview question — bite-sized and high-value. Focus on topics I'd be asked about in a SQL + Python data engineering role.`,
    });
  }

  if (!insights.length) {
    insights.push({
      icon: '✦',
      tag: 'Great progress',
      body: `You're making strong progress`,
      sub: `${totalTasks} tasks done · ${learnedCount} interview Q mastered`,
      cta: `Get advanced challenges →`,
      color: '#2f756e',
      prompt: `I'm an intermediate data engineer and have covered SQL, Python, and PySpark basics. Give me 3 advanced data engineering challenges: one SQL performance problem, one Spark optimization task, and one system design scenario. Include expected outputs.`,
    });
  }

  return (
    <div className="ai-insights-section">
      <div className="ai-section-label">
        <span className="ai-label-badge">◈ AI Insights</span>
        <span className="ai-label-sub">Personalized to your real progress</span>
      </div>
      <div className="ai-insights-grid">
        {insights.slice(0, 4).map((ins, i) => (
          <InsightCard key={i} insight={ins} index={i} />
        ))}
      </div>
    </div>
  );
}

// ─── Revision Queue ──────────────────────────────────────────────────────────

function RevisionQueue() {
  const { overdueTopics } = useLearningMemory();
  if (!overdueTopics.length) return null;

  const topicTitle = id => ALL_TOPICS.find(t => t.id === id)?.title ?? id;

  return (
    <div className="revision-queue-section">
      <div className="ai-section-label">
        <span className="ai-label-badge" style={{ '--badge-color': '#f59e0b' }}>↻ Revision Queue</span>
        <span className="ai-label-sub">Spaced repetition — review before forgetting</span>
      </div>
      <div className="revision-queue-list">
        {overdueTopics.slice(0, 4).map(t => (
          <div key={t.topicId} className="revision-item">
            <div className="revision-item-info">
              <span className="revision-item-name">{topicTitle(t.topicId)}</span>
              <span className="revision-item-due">
                {t.overdueDays}d overdue · studied {t.count}× total
              </span>
            </div>
            <span className={`revision-urgency${t.overdueDays > 7 ? ' high' : ''}`}>
              {t.overdueDays > 7 ? 'Urgent' : 'Due'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Adaptive Study Path ──────────────────────────────────────────────────────

function AdaptivePath() {
  const [practiceProgress] = useLocalStorage('dem-practice-progress', {});
  const [completedTopics]  = useLocalStorage('dem-completed-topics', {});

  const topicProg = useMemo(() => computeTopicProgress(practiceProgress), [practiceProgress]);

  const ordered = useMemo(() => {
    const inProg    = topicProg.filter(t => t.pct > 0 && t.pct < 100 && !completedTopics[t.id]).sort((a, b) => b.pct - a.pct);
    const notStart  = topicProg.filter(t => t.pct === 0 && !completedTopics[t.id]);
    const done      = topicProg.filter(t => completedTopics[t.id] || t.pct === 100);
    return [...inProg, ...notStart, ...done].slice(0, 5);
  }, [topicProg, completedTopics]);

  return (
    <div className="ai-path-section">
      <div className="ai-section-label">
        <span className="ai-label-badge">◎ Study Path</span>
        <span className="ai-label-sub">Auto-adjusted to your progress</span>
      </div>
      <div className="ai-path-list">
        {ordered.map((t, i) => {
          const isDone = completedTopics[t.id] || t.pct === 100;
          const isActive = !isDone && t.pct > 0;
          const color = isDone ? '#2f756e' : isActive ? '#f59e0b' : i === 0 ? '#6b7cdb' : '#9ca3af';
          const statusLabel = isDone ? 'Complete' : isActive ? 'In progress' : i === 0 ? 'Up next' : 'Pending';

          return (
            <div key={t.id} className={`ai-path-row${isDone ? ' ai-path-row--done' : isActive ? ' ai-path-row--active' : ''}`}>
              <div className="ai-path-dot" style={{ background: `${color}22`, color }}>
                {isDone ? '✓' : isActive ? '◑' : i === 0 ? '→' : '○'}
              </div>
              <div className="ai-path-info">
                <span className="ai-path-name">{t.title}</span>
                <span className="ai-path-status" style={{ color }}>{statusLabel}</span>
              </div>
              <div className="ai-path-track">
                <div className="ai-path-fill"
                  style={{ width: `${isDone ? 100 : t.pct}%`, background: color }} />
              </div>
              <span className="ai-path-pct">{isDone ? 100 : t.pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Prompt Library ───────────────────────────────────────────────────────────

const PROMPT_CATEGORIES = [
  {
    label: 'Explain',
    icon: '💡',
    prompts: [
      { title: 'Explain simply', template: t => `Explain "${t || '[topic]'}" for a data engineer learning it for the first time. Use: (1) a plain-English definition, (2) a real-world analogy, (3) how it's used in a data pipeline, (4) one gotcha to watch out for.` },
      { title: 'Compare concepts', template: (a) => `Compare "${a || '[concept A]'}" vs "${a || '[concept B]'}" for a data engineer. Show: what each does, when to choose each, a concrete code comparison, and key performance differences.` },
      { title: 'Explain an error', template: () => `I'm a data engineer and got this error: [paste error here]. Explain: what it means in plain English, the root cause, and 3 ways to fix it — from quick workaround to proper solution.` },
    ],
  },
  {
    label: 'Quiz me',
    icon: '🧠',
    prompts: [
      { title: 'Practice quiz', template: t => `Quiz me on "${t || '[topic]'}". Give 5 questions — one at a time, wait for my answer, start easy and progress to advanced. At the end: give a score and highlight any knowledge gaps.` },
      { title: 'Interview simulation', template: t => `Simulate a data engineering interview for "${t || '[topic]'}". Ask 4 questions: one conceptual, one SQL/code, one system design, one production scenario. Evaluate my answers with detailed feedback.` },
      { title: 'Fill-in-the-blank', template: t => `Create 5 fill-in-the-blank code exercises for "${t || '[topic]'}". Show partial code with _____ blanks. After my answer, show the solution with an explanation of why it's correct.` },
    ],
  },
  {
    label: 'Generate',
    icon: '⚡',
    prompts: [
      { title: 'Mini project', template: t => `Design a hands-on mini project for learning "${t || '[topic]'}". Include: goal, realistic dataset, 5 implementation steps, expected output, and 2 stretch challenges. Should be completable in 1–2 hours.` },
      { title: 'Revision notes', template: t => `Create concise revision notes for "${t || '[topic]'}" for a data engineering interview. Format: key concepts (bullets), common pitfalls, 3 interview Q&As, and a cheat-sheet reference.` },
      { title: 'Test data', template: () => `Generate 10 rows of realistic test data for this schema: [paste column names and types here]. Use believable values — not "test1", "foo", "abc". Output as Python list of dicts and SQL INSERT statements.` },
    ],
  },
  {
    label: 'Code help',
    icon: '⌨',
    prompts: [
      { title: 'Code review', template: () => `Review this data engineering code as a senior engineer: [paste code]. Check for: correctness, performance issues, missing error handling, and style. Give specific improvements with example rewrites.` },
      { title: 'SQL → PySpark', template: () => `Convert this SQL to PySpark DataFrame API: [paste SQL]. Maintain identical logic. Add a comment per step. Highlight any gotchas in the translation.` },
      { title: 'Debug pipeline', template: () => `Help me debug a pipeline issue. Expected: [describe expected output]. Actual: [describe what happened]. Code: [paste relevant code]. What's wrong and how do I fix it properly?` },
    ],
  },
];

function PromptCard({ prompt, copiedId, onCopy }) {
  const [topic, setTopic] = useState('');
  const copied = copiedId === prompt.title;

  function handleCopy() {
    const text = prompt.template(topic || undefined);
    navigator.clipboard.writeText(text).then(() => onCopy(prompt.title));
  }

  return (
    <div className="ai-prompt-card">
      <div className="ai-prompt-header">
        <span className="ai-prompt-title">{prompt.title}</span>
        <button type="button"
          className={`ai-copy-btn${copied ? ' ai-copy-btn--done' : ''}`}
          onClick={handleCopy}>
          {copied ? '✓ Copied' : '⎘ Copy'}
        </button>
      </div>
      <p className="ai-prompt-preview">
        {prompt.template('[topic]').slice(0, 110)}…
      </p>
      <input type="text" className="ai-topic-input"
        placeholder='Topic — e.g. "window functions", "Delta MERGE"'
        value={topic} onChange={e => setTopic(e.target.value)}
        aria-label="Topic to insert into prompt" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AILearning = memo(function AILearning() {
  const [activeTab, setActiveTab] = useState(0);
  const [copiedId, setCopiedId]   = useState(null);

  function handleCopy(id) {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  }

  const cat = PROMPT_CATEGORIES[activeTab];

  return (
    <section className="section ai-coach-section" id="ai-learning">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">AI-Powered</p>
          <h2>Study Coach</h2>
        </div>
        <span className="section-badge">Personalized</span>
      </div>

      <SmartInsights />
      <RevisionQueue />
      <AdaptivePath />

      <div className="ai-prompts-header">
        <div className="ai-section-label" style={{ marginBottom: 0 }}>
          <span className="ai-label-badge">⌨ Prompt Library</span>
          <span className="ai-label-sub">Copy → paste into Claude or ChatGPT</span>
        </div>
        <div className="ai-tabs" role="tablist" aria-label="Prompt categories">
          {PROMPT_CATEGORIES.map((c, i) => (
            <button key={c.label} type="button" role="tab"
              aria-selected={i === activeTab}
              className={`ai-tab${i === activeTab ? ' ai-tab--active' : ''}`}
              onClick={() => setActiveTab(i)}>
              <span aria-hidden="true">{c.icon}</span> {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ai-prompts-grid">
        {cat.prompts.map(p => (
          <PromptCard key={p.title} prompt={p} copiedId={copiedId} onCopy={handleCopy} />
        ))}
      </div>
    </section>
  );
});

export default AILearning;
