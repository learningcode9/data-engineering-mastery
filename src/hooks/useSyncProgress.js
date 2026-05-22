/**
 * useSyncProgress — bridges the existing localStorage-backed Zustand learningStore
 * with Supabase persistence when VITE_ENABLE_BACKEND=true.
 *
 * Usage: Drop into App.jsx once — runs silently in the background.
 * The UI continues reading from the Zustand store (instant, unchanged).
 * This hook asynchronously syncs writes to Supabase and hydrates on first load.
 */

import { useEffect, useRef, useCallback } from 'react';
import { isBackendEnabled } from '../config/env';
import * as progressService from '../services/supabase/progress';
import * as xpService from '../services/supabase/xp';
import { createLogger } from '../utils/logger';

const logger = createLogger('SyncProgress');

// Get current auth user ID — checks Supabase only if backend is enabled
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

/**
 * Hydrates learningStore from Supabase on app load.
 * Only runs if backend is enabled and user is authenticated.
 */
export function useHydrateFromSupabase(setCompletedTopics) {
  const hydrated = useRef(false);

  useEffect(() => {
    if (!isBackendEnabled() || hydrated.current) return;

    async function hydrate() {
      const userId = await getCurrentUserId();
      if (!userId) return;

      try {
        // Get all completed sections from Supabase
        const progress = await progressService.getAllProgress(userId);
        if (Object.keys(progress).length > 0) {
          // Merge Supabase state into local store (Supabase wins on conflicts)
          const topicProgress = {};
          for (const [key, completed] of Object.entries(progress)) {
            const [topicId] = key.split('-');
            if (completed) topicProgress[topicId] = true;
          }
          setCompletedTopics(prev => ({ ...prev, ...topicProgress }));
          logger.info('Hydrated from Supabase', { keys: Object.keys(progress).length });
        }
      } catch (err) {
        logger.warn('Hydration failed, using localStorage', err?.message);
      }

      hydrated.current = true;
    }

    hydrate();
  }, [setCompletedTopics]);
}

/**
 * Returns a wrapped toggleComplete that also syncs to Supabase.
 * Drop-in replacement for the existing toggleComplete in App.jsx.
 */
export function useSupabaseSyncedToggle(originalToggle) {
  const syncToggle = useCallback(async (topicId) => {
    // Run original immediately (localStorage stays snappy)
    originalToggle(topicId);

    if (!isBackendEnabled()) return;

    try {
      const userId = await getCurrentUserId();
      if (!userId) return;
      await progressService.markSectionComplete(userId, topicId, '__topic_complete__', 0);
    } catch (err) {
      logger.warn('Failed to sync toggle to Supabase', err?.message);
    }
  }, [originalToggle]);

  return syncToggle;
}

/**
 * Autosaves notes to Supabase with debounce.
 * Falls back to localStorage-only behavior when backend is disabled.
 */
export function useSupabaseSyncedNotes(userId, topicId, sectionId) {
  const timer = useRef(null);

  const save = useCallback((content) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await progressService.saveNote(userId, topicId, sectionId, content);
      } catch (err) {
        logger.warn('Note sync failed', err?.message);
      }
    }, 800);
  }, [userId, topicId, sectionId]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return save;
}
