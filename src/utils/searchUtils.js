import { sqlInterviewQuestions } from '../data/interviewQuestions.js';

const RESULT_TYPES = { topic: '▦', section: '§', interview: '◌', project: '▣' };
export { RESULT_TYPES };

export function computeSearchResults(query, { topics, projects }) {
  if (!query?.trim()) return [];
  const lc = query.trim().toLowerCase();
  const results = [];

  // Topics
  for (const t of topics) {
    if (results.length >= 5) break;
    if (
      t.title.toLowerCase().includes(lc) ||
      t.label?.toLowerCase().includes(lc) ||
      t.category?.toLowerCase().includes(lc) ||
      t.body?.toLowerCase().includes(lc)
    ) {
      results.push({ id: `topic-${t.id}`, title: t.title, subtitle: t.label, type: 'topic', topicId: t.id });
    }
  }

  // SQL sections and subtopics
  const sqlTopic = topics.find(t => t.id === 'sql');
  if (sqlTopic?.module?.sections) {
    for (const [i, s] of sqlTopic.module.sections.entries()) {
      if (results.length >= 5) break;
      const hit =
        s.title.toLowerCase().includes(lc) ||
        s.subtopics.some(st =>
          st.title?.toLowerCase().includes(lc) ||
          st.explanation?.toLowerCase().includes(lc) ||
          st.practice?.toLowerCase().includes(lc)
        );
      if (hit) {
        results.push({ id: `section-${i}`, title: s.title, subtitle: 'SQL Section', type: 'section', sectionIdx: i });
      }
    }
  }

  // Interview questions
  outer: for (const qs of Object.values(sqlInterviewQuestions)) {
    for (const q of qs) {
      if (results.length >= 5) break outer;
      if (q.q?.toLowerCase().includes(lc) || q.a?.toLowerCase().includes(lc)) {
        results.push({ id: `iq-${q.q?.slice(0, 40)}`, title: q.q, subtitle: 'Interview Q', type: 'interview' });
      }
    }
  }

  // Projects
  for (const p of projects) {
    if (results.length >= 5) break;
    if (p.title.toLowerCase().includes(lc) || p.meta?.toLowerCase().includes(lc)) {
      results.push({ id: `proj-${p.title}`, title: p.title, subtitle: p.meta, type: 'project' });
    }
  }

  return results.slice(0, 5);
}
