export function getInterviewPrepAnalytics(questions = [], learnedSet = {}, categories = []) {
  const reviewedSet = learnedSet ?? {};
  const totalCount = questions.length;
  const reviewedCount = questions.reduce((sum, q) => sum + (reviewedSet[q.id] ? 1 : 0), 0);
  const reviewedPct = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;

  const categoryStats = categories.map(cat => {
    const items = questions.filter(q => q.categoryId === cat.id);
    const reviewed = items.reduce((sum, q) => sum + (reviewedSet[q.id] ? 1 : 0), 0);
    const pct = items.length > 0 ? Math.round((reviewed / items.length) * 100) : 0;
    return { ...cat, reviewed, total: items.length, pct };
  });

  const strongestCategory = categoryStats.length
    ? categoryStats.reduce((best, cat) => (cat.pct > (best?.pct ?? -1) ? cat : best), categoryStats[0])
    : null;

  const seniorReviewed = questions.reduce(
    (sum, q) => sum + ((['advanced', 'realWorld'].includes(q.level) && reviewedSet[q.id]) ? 1 : 0),
    0
  );

  const azureReviewed = questions.reduce(
    (sum, q) => sum + ((['cloud', 'databricks', 'fabric', 'orchestration'].includes(q.categoryId) && reviewedSet[q.id]) ? 1 : 0),
    0
  );

  return {
    reviewedCount,
    totalCount,
    reviewedPct,
    categoryStats,
    strongestCategory,
    seniorReviewed,
    azureReviewed,
  };
}

