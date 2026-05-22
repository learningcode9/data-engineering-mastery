import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage.js';

// Spaced repetition intervals by study count
const REVIEW_INTERVALS = { 1: 3, 2: 7, 3: 14, default: 21 }; // days

function daysAgo(isoString) {
  if (!isoString) return Infinity;
  return (Date.now() - new Date(isoString).getTime()) / (1000 * 60 * 60 * 24);
}

export function useLearningMemory() {
  // { [topicId]: { lastStudied: ISO, count: number, totalMinutes: number } }
  const [studyLog, setStudyLog] = useLocalStorage('dem-topic-study-log', {});

  // { [subtopicId]: number } — how many times skipped without completing
  const [skippedTasks, setSkippedTasks] = useLocalStorage('dem-skipped-tasks', {});

  // { [topicId]: { missCount: number, lastFlagged: ISO } } — from interview scoring
  const [weakSignals, setWeakSignals] = useLocalStorage('dem-weak-signals', {});

  // { [topicId]: ISO } — topics explicitly flagged for revision by user
  const [revisionQueue, setRevisionQueue] = useLocalStorage('dem-revision-queue', {});

  const recordStudy = useCallback((topicId) => {
    setStudyLog(prev => ({
      ...prev,
      [topicId]: {
        lastStudied: new Date().toISOString(),
        count: (prev[topicId]?.count ?? 0) + 1,
      },
    }));
  }, [setStudyLog]);

  const recordSkip = useCallback((subtopicId) => {
    setSkippedTasks(prev => ({
      ...prev,
      [subtopicId]: (prev[subtopicId] ?? 0) + 1,
    }));
  }, [setSkippedTasks]);

  const recordWeakSignal = useCallback((topicId) => {
    setWeakSignals(prev => ({
      ...prev,
      [topicId]: {
        missCount: (prev[topicId]?.missCount ?? 0) + 1,
        lastFlagged: new Date().toISOString(),
      },
    }));
  }, [setWeakSignals]);

  const addToRevisionQueue = useCallback((topicId) => {
    setRevisionQueue(prev => ({ ...prev, [topicId]: new Date().toISOString() }));
  }, [setRevisionQueue]);

  const removeFromRevisionQueue = useCallback((topicId) => {
    setRevisionQueue(prev => {
      const next = { ...prev };
      delete next[topicId];
      return next;
    });
  }, [setRevisionQueue]);

  // Compute spaced-repetition overdue topics from study log
  const overdueTopics = useMemo(() => {
    return Object.entries(studyLog)
      .map(([topicId, log]) => {
        const count = log.count ?? 1;
        const interval = REVIEW_INTERVALS[count] ?? REVIEW_INTERVALS.default;
        const days = daysAgo(log.lastStudied);
        return { topicId, daysAgo: Math.round(days), interval, count, overdueDays: Math.round(days - interval) };
      })
      .filter(t => t.overdueDays > 0)
      .sort((a, b) => b.overdueDays - a.overdueDays);
  }, [studyLog]);

  // Topics that are struggling: either high miss count or many skipped tasks
  const strugglingTopics = useMemo(() => {
    const fromWeak = Object.entries(weakSignals)
      .filter(([, v]) => v.missCount >= 2)
      .map(([topicId, v]) => ({ topicId, reason: 'interview misses', count: v.missCount }));

    const skipsByTopic = {};
    for (const [stId, n] of Object.entries(skippedTasks)) {
      if (n < 2) continue;
      // subtopicId prefix is the topicId (e.g. 'sql-window-func' → 'sql')
      const tid = stId.split('-')[0];
      skipsByTopic[tid] = (skipsByTopic[tid] ?? 0) + n;
    }
    const fromSkips = Object.entries(skipsByTopic)
      .map(([topicId, n]) => ({ topicId, reason: 'skipped tasks', count: n }));

    const merged = {};
    for (const s of [...fromWeak, ...fromSkips]) {
      if (!merged[s.topicId] || merged[s.topicId].count < s.count) {
        merged[s.topicId] = s;
      }
    }
    return Object.values(merged).sort((a, b) => b.count - a.count);
  }, [weakSignals, skippedTasks]);

  // Last studied topic
  const lastStudiedTopic = useMemo(() => {
    const entries = Object.entries(studyLog);
    if (!entries.length) return null;
    return entries.sort((a, b) => new Date(b[1].lastStudied) - new Date(a[1].lastStudied))[0];
  }, [studyLog]);

  // How many unique topics studied
  const uniqueTopicsStudied = useMemo(() => Object.keys(studyLog).length, [studyLog]);

  return {
    studyLog,
    skippedTasks,
    weakSignals,
    revisionQueue,
    overdueTopics,
    strugglingTopics,
    lastStudiedTopic,
    uniqueTopicsStudied,
    recordStudy,
    recordSkip,
    recordWeakSignal,
    addToRevisionQueue,
    removeFromRevisionQueue,
  };
}
