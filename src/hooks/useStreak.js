import { useCallback } from 'react';
import useLearningStore from '../store/learningStore.js';

export function useStreak() {
  const count = useLearningStore(s => s.streakCount);
  const recordStoreActivity = useLearningStore(s => s.recordActivity);

  const recordActivity = useCallback(() => {
    return recordStoreActivity();
  }, [recordStoreActivity]);

  return { streak: count, recordActivity };
}
