import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const XP_REWARDS = {
  practiceTask: 10,
  topicComplete: 25,
  incidentResolved: 100,
  projectComplete: 250,
};

export const XP_PER_LEVEL = 500;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function safeRead(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function nextStreak(count, lastDate) {
  const today = todayKey();
  if (lastDate === today) return { count, lastDate };

  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().slice(0, 10);

  return {
    count: lastDate === yesterday ? count + 1 : 1,
    lastDate: today,
  };
}

const useLearningStore = create(
  persist(
    (set, get) => ({
      xp: safeRead('dem-xp-total', 0),
      streakCount: safeRead('dem-streak-count', 0),
      streakLastDate: safeRead('dem-streak-last', ''),
      completedTopics: safeRead('dem-completed-topics', {}),
      completedProjects: safeRead('dem-completed-projects', {}),
      dailyTasks: safeRead('dem-daily-plan', {}),
      achievements: safeRead('dem-achievements', {}),
      achievementQueue: safeRead('dem-achievement-queue', []),
      incidentsResolved: 0,
      interviewReadiness: 0,
      roleReadiness: {},
      unlockedTracks: ['junior-de'],
      lastXpEvent: null,

      addXP(amount, source = 'activity') {
        if (!amount) return;
        set(s => ({
          xp: Math.max(0, s.xp + amount),
          lastXpEvent: {
            amount,
            source,
            at: new Date().toISOString(),
          },
        }));
      },

      recordActivity() {
        const { streakCount, streakLastDate } = get();
        const next = nextStreak(streakCount, streakLastDate);
        set({ streakCount: next.count, streakLastDate: next.lastDate });
        return next.count;
      },

      setCompletedTopics(updater) {
        set(s => ({
          completedTopics: typeof updater === 'function'
            ? updater(s.completedTopics)
            : updater,
        }));
      },

      setDailyTasks(updater) {
        set(s => ({
          dailyTasks: typeof updater === 'function'
            ? updater(s.dailyTasks)
            : updater,
        }));
      },

      completeProject(projectId) {
        if (!projectId) return;
        const alreadyDone = !!get().completedProjects[projectId];
        if (alreadyDone) return;
        set(s => ({
          completedProjects: { ...s.completedProjects, [projectId]: new Date().toISOString() },
        }));
        get().addXP(XP_REWARDS.projectComplete, 'project');
        get().recordActivity();
      },

      recordIncidentResolved() {
        set(s => ({ incidentsResolved: s.incidentsResolved + 1 }));
        get().addXP(XP_REWARDS.incidentResolved, 'incident');
        get().recordActivity();
      },

      unlockAchievement(id) {
        if (!id || get().achievements[id]) return;
        const now = new Date().toISOString();
        set(s => ({
          achievements: { ...s.achievements, [id]: now },
          achievementQueue: [...s.achievementQueue, id],
        }));
      },

      unlockAchievements(ids) {
        const nextIds = ids.filter(id => id && !get().achievements[id]);
        if (!nextIds.length) return;
        const now = new Date().toISOString();
        set(s => {
          const achievements = { ...s.achievements };
          nextIds.forEach(id => { achievements[id] = now; });
          return {
            achievements,
            achievementQueue: [...s.achievementQueue, ...nextIds],
          };
        });
      },

      shiftAchievementQueue() {
        set(s => ({ achievementQueue: s.achievementQueue.slice(1) }));
      },

      setInterviewReadiness(score) {
        set({ interviewReadiness: Math.max(0, Math.min(100, Math.round(score || 0))) });
      },

      setRoleReadiness(roleId, score) {
        set(s => ({
          roleReadiness: {
            ...s.roleReadiness,
            [roleId]: Math.max(0, Math.min(100, Math.round(score || 0))),
          },
        }));
      },

      unlockTrack(trackId) {
        if (!trackId || get().unlockedTracks.includes(trackId)) return;
        set(s => ({ unlockedTracks: [...s.unlockedTracks, trackId] }));
      },

      // ─── Supabase sync actions ──────────────────────────────────────────────
      // These extend the store without modifying existing localStorage behavior.
      // Call these from useSyncXP / useSyncProgress hooks when backend is enabled.

      setSupabaseUserId(userId) {
        set({ _supabaseUserId: userId ?? null });
      },

      // Merge hydrated Supabase state (called once on auth + backend enabled)
      hydrateFromSupabase({ xp, streakCount, completedTopics, achievements } = {}) {
        set(s => ({
          xp:             xp             ?? s.xp,
          streakCount:    streakCount    ?? s.streakCount,
          completedTopics: completedTopics
            ? { ...s.completedTopics, ...completedTopics }
            : s.completedTopics,
          achievements:   achievements
            ? { ...s.achievements, ...achievements }
            : s.achievements,
        }));
      },
    }),
    {
      name: 'dem-learning-store-v1',
      version: 1,
      // Don't persist Supabase user ID — it comes from auth session
      partialize: s => {
        const { _supabaseUserId, ...rest } = s;
        return rest;
      },
    }
  )
);

export function levelFromXP(xp) {
  return Math.floor((xp ?? 0) / XP_PER_LEVEL) + 1;
}

export default useLearningStore;
