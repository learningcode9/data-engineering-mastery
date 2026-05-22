import { useCallback, useMemo } from 'react';
import useLearningStore from '../store/learningStore.js';

export const RARITY = {
  common:   { label: 'Common',   color: '#6b7c76' },
  uncommon: { label: 'Uncommon', color: '#2f756e' },
  rare:     { label: 'Rare',     color: '#6b7cdb' },
  epic:     { label: 'Epic',     color: '#d4a800' },
};

export const ACHIEVEMENTS = [
  {
    id: 'first-step',
    icon: '◎',
    name: 'First Step',
    desc: 'Completed your first practice task',
    rarity: 'common',
    check: ({ totalTasks }) => totalTasks >= 1,
  },
  {
    id: 'building-momentum',
    icon: '▦',
    name: 'Building Momentum',
    desc: 'Completed 10 practice tasks',
    rarity: 'common',
    check: ({ totalTasks }) => totalTasks >= 10,
  },
  {
    id: 'deep-learner',
    icon: '◆',
    name: 'Deep Learner',
    desc: 'Completed 50 practice tasks',
    rarity: 'rare',
    check: ({ totalTasks }) => totalTasks >= 50,
  },
  {
    id: 'consistent-learner',
    icon: '◈',
    name: 'Consistent Learner',
    desc: 'Maintained a 3-day learning streak',
    rarity: 'uncommon',
    check: ({ streak }) => streak >= 3,
  },
  {
    id: 'week-warrior',
    icon: '◉',
    name: 'Week Warrior',
    desc: 'Maintained a 7-day streak — consistency compounds',
    rarity: 'rare',
    check: ({ streak }) => streak >= 7,
  },
  {
    id: 'sql-foundations',
    icon: '▧',
    name: 'SQL Foundations',
    desc: 'Reached 80% SQL mastery',
    rarity: 'uncommon',
    check: ({ progress }) => (progress['sql'] ?? 0) >= 80,
  },
  {
    id: 'sql-master',
    icon: '✦',
    name: 'SQL Master',
    desc: 'Achieved 100% SQL completion — the most demanded skill in data engineering',
    rarity: 'epic',
    check: ({ progress }) => (progress['sql'] ?? 0) >= 100,
  },
  {
    id: 'topic-complete',
    icon: '◑',
    name: 'Topic Complete',
    desc: 'Completed your first full topic',
    rarity: 'uncommon',
    check: ({ completedTopicsCount }) => completedTopicsCount >= 1,
  },
  {
    id: 'spark-initiated',
    icon: '⚡',
    name: 'Spark Initiated',
    desc: 'Reached 30% PySpark mastery — distributed thinking unlocked',
    rarity: 'uncommon',
    check: ({ progress }) => (progress['pyspark'] ?? 0) >= 30,
  },
  {
    id: 'interview-ready',
    icon: '◌',
    name: 'Interview Ready',
    desc: 'Mastered 15+ interview questions — phone screen confidence unlocked',
    rarity: 'rare',
    check: ({ learnedCount }) => learnedCount >= 15,
  },
  {
    id: 'cloud-explorer',
    icon: '◫',
    name: 'Cloud Explorer',
    desc: 'Started learning a cloud data platform',
    rarity: 'common',
    check: ({ progress }) =>
      (progress['azure-databricks'] ?? 0) > 0 ||
      (progress['azure-data-factory'] ?? 0) > 0 ||
      (progress['aws-glue'] ?? 0) > 0,
  },
  {
    id: 'engineering-mode',
    icon: '⌥',
    name: 'Engineering Mode',
    desc: 'Activated Engineering Mode — production focus, reduced hand-holding',
    rarity: 'uncommon',
    check: ({ engineeringMode }) => !!engineeringMode,
  },
  {
    id: 'night-shift',
    icon: '☾',
    name: 'Night Shift',
    desc: 'Switched to dark mode — a true engineer move',
    rarity: 'common',
    check: ({ isDark }) => !!isDark,
  },
  {
    id: 'all-rounder',
    icon: '◐',
    name: 'All-Rounder',
    desc: 'Started 5 or more topics — breadth and depth',
    rarity: 'rare',
    check: ({ progress }) => Object.values(progress).filter(p => p > 0).length >= 5,
  },
];

export function useAchievements() {
  const unlocked = useLearningStore(s => s.achievements);
  const queue = useLearningStore(s => s.achievementQueue);
  const unlockAchievements = useLearningStore(s => s.unlockAchievements);
  const shiftAchievementQueue = useLearningStore(s => s.shiftAchievementQueue);

  // Returns newly unlocked achievements (for triggering notifications)
  const check = useCallback((state) => {
    const newlyUnlocked = ACHIEVEMENTS.filter(a => !unlocked[a.id] && a.check(state));
    if (newlyUnlocked.length) {
      unlockAchievements(newlyUnlocked.map(a => a.id));
    }
    return newlyUnlocked;
  }, [unlocked, unlockAchievements]);

  const shiftQueue = useCallback(() => {
    shiftAchievementQueue();
  }, [shiftAchievementQueue]);

  const unlockedList = useMemo(() =>
    ACHIEVEMENTS
      .filter(a => unlocked[a.id])
      .map(a => ({ ...a, unlockedAt: unlocked[a.id] }))
      .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt)),
    [unlocked]
  );

  const pendingAchievement = useMemo(() => {
    if (!queue.length) return null;
    return ACHIEVEMENTS.find(a => a.id === queue[0]) ?? null;
  }, [queue]);

  return {
    check,
    unlocked,
    unlockedList,
    unlockedCount: unlockedList.length,
    totalCount: ACHIEVEMENTS.length,
    pendingAchievement,
    shiftQueue,
  };
}
