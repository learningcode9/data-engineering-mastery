import { useMemo, useCallback } from 'react';
import useLearningStore, { levelFromXP, XP_PER_LEVEL, XP_REWARDS } from '../store/learningStore.js';

export const XP_PER_TASK = XP_REWARDS.practiceTask;
export const XP_PER_TOPIC = XP_REWARDS.topicComplete;
export { XP_PER_LEVEL, levelFromXP };

export function useXP() {
  const xp = useLearningStore(s => s.xp);
  const addStoreXP = useLearningStore(s => s.addXP);

  const level     = useMemo(() => levelFromXP(xp), [xp]);
  const xpInLevel = useMemo(() => xp % XP_PER_LEVEL, [xp]);
  const levelPct  = useMemo(() => Math.round((xpInLevel / XP_PER_LEVEL) * 100), [xpInLevel]);

  const addXP = useCallback((amount, source) => {
    addStoreXP(amount, source);
  }, [addStoreXP]);

  return { xp, level, xpInLevel, levelPct, addXP };
}
