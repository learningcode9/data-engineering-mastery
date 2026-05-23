/**
 * useSyncXP — mirrors XP events to Supabase when VITE_ENABLE_BACKEND=true.
 *
 * Subscribes to learningStore's lastXpEvent. Whenever the store records a new XP
 * event, this hook writes it to the xp_history table. No-op when backend is off.
 */

import { useEffect, useRef } from 'react';
import { isBackendEnabled } from '../config/env';
import { createLogger } from '../utils/logger';
import useLearningStore from '../store/learningStore';
import * as xpService from '../services/supabase/xp';

const logger = createLogger('SyncXP');

const SOURCE_TYPE_MAP = {
  practice:    'practice_task',
  topic:       'topic_complete',
  project:     'topic_complete',
  incident:    'incident_resolve',
  interview:   'interview',
  streak:      'streak_bonus',
  achievement: 'achievement',
  activity:    'section_complete',
};

function toSourceType(source) {
  return SOURCE_TYPE_MAP[source] ?? 'section_complete';
}

async function getCurrentUserId() {
  if (!isBackendEnabled()) return null;
  try {
    const { requireSupabase } = await import('../lib/supabase');
    const sb = requireSupabase();
    const { data: { user } } = await sb.auth.getUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export function useSyncXP() {
  const lastXpEvent = useLearningStore(s => s.lastXpEvent);
  const prevEvent   = useRef(null);

  useEffect(() => {
    if (!isBackendEnabled()) return;
    if (!lastXpEvent) return;
    if (lastXpEvent === prevEvent.current) return;
    prevEvent.current = lastXpEvent;

    getCurrentUserId().then(userId => {
      if (!userId) return;
      xpService.awardXP(
        userId,
        lastXpEvent.amount,
        toSourceType(lastXpEvent.source),
        `XP earned (${lastXpEvent.source})`,
      ).then(() => {
        logger.debug('XP synced to Supabase', { amount: lastXpEvent.amount });
      }).catch(err => {
        logger.warn('XP sync failed', err?.message);
      });
    });
  }, [lastXpEvent]);
}

export async function syncAchievementToSupabase(userId, achievementKey, title) {
  if (!isBackendEnabled() || !userId) return;
  try {
    await xpService.grantAchievement(userId, achievementKey, title);
    logger.debug('Achievement synced', { achievementKey });
  } catch (err) {
    logger.warn('Achievement sync failed', err?.message);
  }
}
