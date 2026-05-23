/**
 * useSyncProgress — bridges the existing localStorage-backed Zustand learningStore
 * with Supabase persistence when VITE_ENABLE_BACKEND=true.
 *
 * Runs silently in the background. The UI continues reading from Zustand (instant).
 * This hook mirrors writes to Supabase and hydrates on first load.
 */

import { useEffect, useRef, useCallback } from 'react';
import { isBackendEnabled } from '../config/env';
import * as progressService from '../services/supabase/progress';
import * as notesService from '../services/supabase/notes';
import { createLogger } from '../utils/logger';

const logger = createLogger('SyncProgress');

// ─── Hydration (once on load) ─────────────────────────────────────────────────

export function useHydrateFromSupabase(userId, setCompletedTopics) {
  const hydrated = useRef(false);

  useEffect(() => {
    if (!isBackendEnabled() || !userId || hydrated.current) return;

    async function hydrate() {
      try {
        const completions = await progressService.getTopicCompletions(userId);
        if (completions.length > 0) {
          // Build a { topicId: true } map from completion records
          const topicMap = {};
          for (const c of completions) {
            // Only count topic-level completions (section_id = '__topic_complete__')
            if (c.section_id === '__topic_complete__') {
              topicMap[c.topic_id] = true;
            }
          }
          if (Object.keys(topicMap).length > 0) {
            setCompletedTopics(prev => ({ ...prev, ...topicMap }));
            logger.info('Hydrated completed topics from Supabase', { count: Object.keys(topicMap).length });
          }
        }
      } catch (err) {
        logger.warn('Hydration failed, using localStorage', err?.message);
      }
      hydrated.current = true;
    }

    hydrate();
  }, [userId, setCompletedTopics]);
}

// ─── Practice task sync ───────────────────────────────────────────────────────

export function useSupabaseSyncedToggle(userId, originalToggle) {
  const syncToggle = useCallback(async (topicId) => {
    // Run original immediately (localStorage stays snappy)
    originalToggle(topicId);

    if (!isBackendEnabled() || !userId) return;

    try {
      await progressService.markTopicSectionComplete(userId, topicId, '__topic_complete__');
    } catch (err) {
      logger.warn('Failed to sync topic toggle to Supabase', err?.message);
    }
  }, [userId, originalToggle]);

  return syncToggle;
}

// ─── Practice task section sync ───────────────────────────────────────────────

export async function syncPracticeTask(userId, taskId) {
  if (!isBackendEnabled() || !userId) return;
  try {
    // Store practice completions under topic_id='practice', section_id=taskId
    await progressService.markTopicSectionComplete(userId, 'practice', taskId);
  } catch (err) {
    logger.warn('Failed to sync practice task', err?.message);
  }
}

// ─── Notes sync ───────────────────────────────────────────────────────────────

export function useSupabaseSyncedNotes(userId, topicId, sectionId) {
  const timer = useRef(null);

  const save = useCallback((content) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await notesService.saveNote(userId, topicId, sectionId, content);
      } catch (err) {
        logger.warn('Note sync failed', err?.message);
      }
    }, 800);
  }, [userId, topicId, sectionId]);

  useEffect(() => () => clearTimeout(timer.current), []);

  return save;
}
