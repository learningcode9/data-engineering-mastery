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

function normalizeAchievementMap(value) {
  if (!value) return {};
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value
        .filter(entry => entry?.achievement_key)
        .map(entry => [entry.achievement_key, entry.unlocked_at ?? entry.earned_at ?? new Date().toISOString()])
    );
  }
  if (typeof value === 'object') return value;
  return {};
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
      completedTopics: Object.fromEntries(
        Object.entries(safeRead('dem-completed-topics', {})).filter(([, v]) => v === true)
      ),
      completedProjects: safeRead('dem-completed-projects', {}),
      dailyTasks: safeRead('dem-daily-plan', {}),
      achievements: normalizeAchievementMap(safeRead('dem-achievements', {})),
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
        set(s => {
          const next = typeof updater === 'function'
            ? updater(s.completedTopics)
            : updater;
          // Keep legacy key in sync so AILearning / SkillGraph see completions
          try { localStorage.setItem('dem-completed-topics', JSON.stringify(next)); } catch {}
          return { completedTopics: next };
        });
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
        try {
          localStorage.setItem('dem-achievements', JSON.stringify({
            ...get().achievements,
            [id]: now,
          }));
        } catch {}
      },

      unlockAchievements(ids) {
        const nextIds = ids.filter(id => id && !get().achievements[id]);
        if (!nextIds.length) return;
        const now = new Date().toISOString();
        set(s => {
          const achievements = { ...s.achievements };
          nextIds.forEach(id => { achievements[id] = now; });
          try {
            localStorage.setItem('dem-achievements', JSON.stringify(achievements));
          } catch {}
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
      hydrateFromSupabase({
        xp,
        streakCount,
        streakLastDate,
        completedTopics,
        completedProjects,
        achievements,
        incidentsResolved,
        interviewReadiness,
        roleReadiness,
        unlockedTracks,
      } = {}) {
        set(s => ({
          xp:             xp             ?? s.xp,
          streakCount:    streakCount    ?? s.streakCount,
          streakLastDate: streakLastDate ?? s.streakLastDate,
          completedProjects: completedProjects
            ? { ...s.completedProjects, ...completedProjects }
            : s.completedProjects,
          completedTopics: completedTopics
            ? { ...s.completedTopics, ...completedTopics }
            : s.completedTopics,
          achievements:   achievements
            ? { ...s.achievements, ...achievements }
            : s.achievements,
          incidentsResolved: incidentsResolved ?? s.incidentsResolved,
          interviewReadiness: interviewReadiness ?? s.interviewReadiness,
          roleReadiness: roleReadiness
            ? { ...s.roleReadiness, ...roleReadiness }
            : s.roleReadiness,
          unlockedTracks: unlockedTracks
            ? Array.from(new Set([...(s.unlockedTracks ?? []), ...unlockedTracks]))
            : s.unlockedTracks,
        }));
      },
    }),
    {
      name: 'dem-learning-store-v1',
      version: 2,
      // v1 → v2: remove false values written by React StrictMode double-invoke bug
      migrate(persisted, fromVersion) {
        if (fromVersion < 2 && persisted?.completedTopics) {
          persisted.completedTopics = Object.fromEntries(
            Object.entries(persisted.completedTopics).filter(([, v]) => v === true)
          );
        }
        return persisted;
      },
      // Don't persist Supabase user ID — it comes from auth session
      partialize: s => {
        const rest = { ...s };
        delete rest._supabaseUserId;
        return rest;
      },
    }
  )
);

export function levelFromXP(xp) {
  return Math.floor((xp ?? 0) / XP_PER_LEVEL) + 1;
}

export default useLearningStore;
