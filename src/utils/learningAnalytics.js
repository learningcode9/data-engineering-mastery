import { learningPathPhases } from '../data/learningPath.js';

const LESSON_TITLE_BY_ID = new Map();

for (const phase of learningPathPhases) {
  for (const module of phase.modules ?? []) {
    for (const lesson of module.lessons ?? []) {
      if (lesson?.id && lesson?.title) {
        LESSON_TITLE_BY_ID.set(lesson.id, lesson.title);
      }
    }
  }
}

function activityDayKeys(days = 7) {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - index));
    return d.toISOString().slice(0, 10);
  });
}

export function getWeeklyActivitySummary(activityLog = []) {
  const days = activityDayKeys(7);
  const byDay = {};

  for (const entry of activityLog ?? []) {
    const day = entry?.date?.slice(0, 10);
    if (!day) continue;
    byDay[day] = (byDay[day] ?? 0) + 1;
  }

  const activeDays = days.filter(day => (byDay[day] ?? 0) > 0).length;
  const totalEvents = Object.values(byDay).reduce((sum, count) => sum + count, 0);
  const peakDay = days.reduce((best, day) => (byDay[day] ?? 0) > (byDay[best] ?? 0) ? day : best, days[0]);

  return {
    activeDays,
    totalEvents,
    peakDay,
    todayEvents: byDay[new Date().toISOString().slice(0, 10)] ?? 0,
  };
}

export function getRecentCompletedLessons(activityLog = [], limit = 3) {
  const recent = [];
  const seen = new Set();

  for (const entry of (activityLog ?? [])) {
    const text = entry?.text ?? '';
    let title = null;

    const topicMatch = text.match(/^Finished topic:\s*(.+)$/i);
    if (topicMatch) {
      title = topicMatch[1].trim();
    } else {
      const lessonMatch = text.match(/^Finished lesson:\s*(.+)$/i);
      if (lessonMatch) {
        const raw = lessonMatch[1].trim();
        title = LESSON_TITLE_BY_ID.get(raw) ?? raw;
      }
    }

    if (!title || seen.has(title)) continue;
    seen.add(title);
    recent.push({
      title,
      type: entry?.type ?? 'lesson',
      date: entry?.date ?? null,
    });

    if (recent.length >= limit) break;
  }

  return recent;
}

export function estimateRemainingLearningTime({ topics = [], topicStates = {}, activityLog = [] } = {}) {
  const totalTopics = topics.length || 1;
  const masteredCount = topics.filter(t => ['mastered', 'completed'].includes(topicStates?.[t.id]?.state)).length;
  const remaining = Math.max(0, totalTopics - masteredCount);
  const weekly = getWeeklyActivitySummary(activityLog);
  const pace = weekly.activeDays > 0 ? weekly.totalEvents / weekly.activeDays : 1.5;
  const hours = Math.max(2, Math.round(remaining * Math.max(0.75, Math.min(pace, 3))));

  return {
    hours,
    text: hours <= 8 ? `~${hours}h of focused study left` : `~${Math.round(hours / 8)} weeks at a steady pace`,
    remainingTopics: remaining,
  };
}

export function getInactiveTopics(topics = [], topicStates = {}, activityLog = []) {
  const recent = new Set(getRecentCompletedLessons(activityLog, 6).map(item => item.title));
  return topics
    .filter(t => {
      const state = topicStates?.[t.id]?.state;
      return !recent.has(t.title) && (state === 'available' || state === 'in-progress');
    })
    .slice(0, 3);
}
