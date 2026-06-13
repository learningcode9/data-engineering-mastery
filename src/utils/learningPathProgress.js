import {
  aiLearningPathPhases,
  learningPathPhases,
  optionalTechnologyPhases,
} from '../data/learningPath.js';

export function getLearningPathLessonStatus(lesson, completedMap = {}, topicStates = {}) {
  if (!lesson) return 'available';

  if (lesson.type === 'guide') {
    return completedMap[lesson.id] ? 'completed' : 'available';
  }

  if (lesson.topicId) {
    const topicState = topicStates?.[lesson.topicId]?.state;
    if (completedMap[lesson.topicId] || topicState === 'completed' || topicState === 'mastered') {
      return 'completed';
    }
    if (topicState === 'in-progress') return 'in-progress';
    return topicState ?? 'available';
  }

  if (lesson.section) return completedMap[lesson.id] ? 'completed' : 'available';
  return completedMap[lesson.id] ? 'completed' : 'available';
}

export function computeLearningPathProgress({
  phases = learningPathPhases,
  completedMap = {},
  topicStates = {},
} = {}) {
  const modules = phases.flatMap(phase =>
    phase.modules.map(module => {
      const lessons = module.lessons ?? [];
      const done = lessons.filter(lesson =>
        getLearningPathLessonStatus(lesson, completedMap, topicStates) === 'completed'
      ).length;
      const inProgress = lessons.filter(lesson =>
        getLearningPathLessonStatus(lesson, completedMap, topicStates) === 'in-progress'
      ).length;
      const total = lessons.length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      return {
        phaseId: phase.id,
        moduleId: module.id,
        title: module.title,
        done,
        inProgress,
        total,
        pct,
        completed: total > 0 && done === total,
      };
    })
  );

  const totalModules = modules.length;
  const completedModules = modules.filter(module => module.completed).length;
  const totalLessons = modules.reduce((sum, module) => sum + module.total, 0);
  const completedLessons = modules.reduce((sum, module) => sum + module.done, 0);
  const inProgressLessons = modules.reduce((sum, module) => sum + module.inProgress, 0);
  const overallPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return {
    modules,
    totalModules,
    completedModules,
    totalLessons,
    completedLessons,
    inProgressLessons,
    overallPct,
  };
}

export function computeTrackProgress(trackPhases, { completedMap = {}, topicStates = {} } = {}) {
  return computeLearningPathProgress({
    phases: trackPhases ?? [],
    completedMap,
    topicStates,
  });
}

export function computeCurriculumProgress({
  completedMap = {},
  topicStates = {},
} = {}) {
  const core = computeTrackProgress(learningPathPhases, { completedMap, topicStates });
  const ai = computeTrackProgress(aiLearningPathPhases, { completedMap, topicStates });
  const optional = computeTrackProgress(optionalTechnologyPhases, { completedMap, topicStates });

  return {
    core,
    ai,
    optional,
    overallPct: core.overallPct,
    totalLessons: core.totalLessons + ai.totalLessons + optional.totalLessons,
    completedLessons: core.completedLessons + ai.completedLessons + optional.completedLessons,
  };
}
