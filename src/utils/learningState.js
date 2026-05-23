// ─── Learning State Engine ─────────────────────────────────────────────────────
// Computes topic states (locked → available → in-progress → completed → mastered)
// and overall readiness from practice progress + completed topics.

export const TOPIC_STATES = {
  LOCKED:      'locked',
  AVAILABLE:   'available',
  IN_PROGRESS: 'in-progress',
  COMPLETED:   'completed',
  MASTERED:    'mastered',
};

export const STATE_CONFIG = {
  'locked':      { label: 'Locked',      cls: 'ts-locked',      icon: '🔒' },
  'available':   { label: 'Ready',        cls: 'ts-available',   icon: '◎'  },
  'in-progress': { label: 'In Progress',  cls: 'ts-in-progress', icon: '▶'  },
  'completed':   { label: 'Completed',    cls: 'ts-completed',   icon: '✓'  },
  'mastered':    { label: 'Mastered',     cls: 'ts-mastered',    icon: '⭐'  },
};

// Mastery = fraction of individual practice subtopics completed (finer than section-level).
export function computeMasteryPct(topic, practiceProgress) {
  const sections = topic.module?.sections ?? [];
  const all = sections.flatMap(s => s.subtopics.filter(st => st.practice));
  if (all.length === 0) return 0;
  const done = all.filter(st => !!(practiceProgress ?? {})[st.id]).length;
  return Math.round((done / all.length) * 100);
}

export function computeTopicState(topic, completedTopics, practiceProgress) {
  const comp       = completedTopics ?? {};
  const prereqsMet = (topic.prerequisites ?? []).every(id => !!comp[id]);
  const masteryPct = computeMasteryPct(topic, practiceProgress);

  if (!prereqsMet) return { state: 'locked',      masteryPct, prereqsMet: false };

  const isCompleted = !!comp[topic.id];
  if (isCompleted && masteryPct >= 60) return { state: 'mastered',     masteryPct, prereqsMet: true };
  if (isCompleted)                     return { state: 'completed',    masteryPct, prereqsMet: true };
  if (masteryPct > 0)                  return { state: 'in-progress',  masteryPct, prereqsMet: true };
  return                                      { state: 'available',    masteryPct, prereqsMet: true };
}

export function computeAllTopicStates(topics, completedTopics, practiceProgress) {
  const out = {};
  for (const t of topics) out[t.id] = computeTopicState(t, completedTopics, practiceProgress);
  return out;
}

// Single most important action the learner should take right now.
export function getNextRecommendedAction(topics, topicStates) {
  const inProg = topics.find(t => topicStates[t.id]?.state === 'in-progress');
  if (inProg) {
    const pct = topicStates[inProg.id].masteryPct;
    return {
      type: 'continue', topicId: inProg.id, title: inProg.title, step: inProg.step,
      action: `Continue ${inProg.title}`,
      detail: `${pct}% mastered — keep completing practice tasks to progress`,
    };
  }

  const avail = topics.find(t => topicStates[t.id]?.state === 'available');
  if (avail) {
    return {
      type: 'start', topicId: avail.id, title: avail.title, step: avail.step,
      action: `Start ${avail.title}`,
      detail: (avail.prerequisites ?? []).length
        ? 'Prerequisites complete — you\'re ready for this'
        : 'Your first step on the Data Engineering path',
    };
  }

  const needsMastery = topics.find(t => topicStates[t.id]?.state === 'completed');
  if (needsMastery) {
    return {
      type: 'master', topicId: needsMastery.id, title: needsMastery.title, step: needsMastery.step,
      action: `Deepen ${needsMastery.title}`,
      detail: 'Complete practice tasks to reach Mastered status (60%+)',
    };
  }

  return {
    type: 'complete', topicId: null, action: 'Review for interviews',
    detail: 'You\'ve completed the path — now prepare for interviews',
  };
}

// Weighted readiness: mastered = 100, completed = 70, in-progress = 30, available = 5, locked = 0.
export function computeOverallReadiness(topics, topicStates) {
  if (!topics.length) return 0;
  const W = { mastered: 100, completed: 70, 'in-progress': 30, available: 5, locked: 0 };
  const total = topics.reduce((s, t) => s + (W[topicStates[t.id]?.state] ?? 0), 0);
  return Math.round(total / topics.length);
}

// Sorted list of topics that need attention (in-progress or available, ordered by step).
export function getWeakAreas(topics, topicStates) {
  return topics
    .filter(t => ['in-progress', 'available'].includes(topicStates[t.id]?.state))
    .sort((a, b) => (a.step ?? 99) - (b.step ?? 99))
    .slice(0, 3);
}

// Topics with mastered state, sorted by mastery %.
export function getStrengths(topics, topicStates) {
  return topics
    .filter(t => ['mastered', 'completed'].includes(topicStates[t.id]?.state))
    .sort((a, b) => (topicStates[b.id]?.masteryPct ?? 0) - (topicStates[a.id]?.masteryPct ?? 0))
    .slice(0, 3);
}
