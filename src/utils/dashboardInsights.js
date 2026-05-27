export function getDashboardNextLessonAction({ topics = [], topicStates = {} } = {}) {
  const inProgress = topics.find(t => topicStates?.[t.id]?.state === 'in-progress');
  if (inProgress) {
    const pct = topicStates?.[inProgress.id]?.masteryPct ?? 0;
    return {
      type: 'continue',
      topicId: inProgress.id,
      title: inProgress.title,
      step: inProgress.step,
      action: `Continue ${inProgress.title}`,
      detail: `${pct}% mastered — keep completing practice tasks to progress`,
    };
  }

  const available = topics.find(t => topicStates?.[t.id]?.state === 'available');
  if (available) {
    return {
      type: 'start',
      topicId: available.id,
      title: available.title,
      step: available.step,
      action: `Start ${available.title}`,
      detail: (available.prerequisites ?? []).length
        ? 'Prerequisites complete — you are ready for this'
        : 'Your first step on the Data Engineering path',
    };
  }

  const needsMastery = topics.find(t => topicStates?.[t.id]?.state === 'completed');
  if (needsMastery) {
    return {
      type: 'master',
      topicId: needsMastery.id,
      title: needsMastery.title,
      step: needsMastery.step,
      action: `Deepen ${needsMastery.title}`,
      detail: 'Complete practice tasks to reach Mastered status (60%+)',
    };
  }

  return {
    type: 'complete',
    topicId: null,
    title: 'Review the roadmap',
    action: 'Review for interviews',
    detail: 'You have completed the path — now prepare for interviews',
  };
}
