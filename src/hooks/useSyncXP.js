/**
 * useSyncXP — syncs XP events and streaks to Supabase when backend is enabled.
 *
 * The existing useXP/useStreak hooks are untouched. This hook subscribes to
 * the learningStore's lastXpEvent and mirrors new events to the XP ledger.
 */

import { useEffect, useRef } from 'react';
import { isBackendEnabled } from '../config/env';
import { createLogger } from '../utils/logger';
import useLearningStore from '../store/learningStore';

const logger = createLogger('SyncXP');

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

async function syncXPToSupabase(userId, amount, source, label) {
  try {
    const { requireSupabase } = await import('../lib/supabase');
    const sb = requireSupabase();
    await sb.from('xp_ledger').insert({
      user_id: userId,
      amount,
      source,
      label: label ?? null,
    });
    logger.debug('XP synced', { amount, source });
  } catch (err) {
    logger.warn('XP sync failed', err?.message);
  }
}

async function syncStreakToSupabase(userId, currentStreak, longestStreak) {
  try {
    const { requireSupabase } = await import('../lib/supabase');
    const sb = requireSupabase();
    await sb.from('streaks').upsert({
      user_id: userId,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_activity_date: new Date().toISOString().slice(0, 10),
    }, { onConflict: 'user_id' });
    logger.debug('Streak synced', { currentStreak });
  } catch (err) {
    logger.warn('Streak sync failed', err?.message);
  }
}

/**
 * Watches for new XP events from learningStore and mirrors them to Supabase.
 * Call once at the top level of the app (e.g. in App.jsx or AppProvider).
 */
export function useSyncXP() {
  const lastXpEvent  = useLearningStore(s => s.lastXpEvent);
  const streakCount  = useLearningStore(s => s.streakCount);
  const prevEvent    = useRef(null);
  const prevStreak   = useRef(null);

  useEffect(() => {
    if (!isBackendEnabled()) return;
    if (!lastXpEvent) return;
    // Only sync if it's a new event (not the same one rerendering)
    if (lastXpEvent === prevEvent.current) return;
    prevEvent.current = lastXpEvent;

    getCurrentUserId().then(userId => {
      if (!userId) return;
      syncXPToSupabase(userId, lastXpEvent.amount, lastXpEvent.source, null);
    });
  }, [lastXpEvent]);

  useEffect(() => {
    if (!isBackendEnabled()) return;
    if (streakCount === prevStreak.current) return;
    prevStreak.current = streakCount;

    getCurrentUserId().then(userId => {
      if (!userId) return;
      syncStreakToSupabase(userId, streakCount, streakCount); // longest will be updated by DB trigger
    });
  }, [streakCount]);
}

/**
 * Syncs achievements to Supabase.
 * Pass the achievement object from learningStore.
 */
export async function syncAchievementToSupabase(userId, badgeId, badgeName, badgeIcon) {
  if (!isBackendEnabled() || !userId) return;
  try {
    const { requireSupabase } = await import('../lib/supabase');
    const sb = requireSupabase();
    await sb.from('achievements').insert({
      user_id: userId,
      badge_id: badgeId,
      badge_name: badgeName,
      badge_icon: badgeIcon ?? null,
    });
    logger.debug('Achievement synced', { badgeId });
  } catch (err) {
    // Ignore duplicate constraint errors (already earned)
    if (!String(err?.message).includes('duplicate')) {
      logger.warn('Achievement sync failed', err?.message);
    }
  }
}
