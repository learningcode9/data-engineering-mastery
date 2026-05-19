import { useMemo } from 'react';

/**
 * Derives SQL learning progress from practiceProgress localStorage state.
 * A section is "complete" when every subtopic that has a practice task is marked done.
 */
export function useSqlProgress(sqlSections, practiceProgress) {
  return useMemo(() => {
    const sections = sqlSections ?? [];
    const practisableSections = sections.filter(s => s.subtopics.some(st => st.practice));
    const total = practisableSections.length;

    if (total === 0) {
      return { percent: 0, nextSection: null, nextSectionIndex: 0, total: sections.length, completed: 0 };
    }

    let completed = 0;
    let nextSection = null;
    let nextSectionIndex = 0;

    sections.forEach((section, i) => {
      const practiceSubtopics = section.subtopics.filter(st => st.practice);
      if (practiceSubtopics.length === 0) return; // skip non-practice sections

      const allDone = practiceSubtopics.every(st => !!practiceProgress?.[st.id]);
      if (allDone) {
        completed++;
      } else if (nextSection === null) {
        nextSection = section;
        nextSectionIndex = i;
      }
    });

    const percent = Math.round((completed / total) * 100);
    return { percent, nextSection, nextSectionIndex, total: sections.length, completed };
  }, [sqlSections, practiceProgress]);
}
