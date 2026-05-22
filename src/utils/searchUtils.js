import { sqlInterviewQuestions } from '../data/interviewQuestions.js';

export const RESULT_TYPES = { topic: '▦', section: '§', interview: '◌', project: '▣' };

// Returns 0 (no match) or a positive score (higher = better match)
function scoreText(text, query) {
  if (!text || !query) return 0;
  const t = text.toLowerCase();
  const q = query.toLowerCase();

  if (t === q) return 100;
  if (t.startsWith(q)) return 80;

  // Word boundary match
  const words = t.split(/[\s\-_/]+/);
  if (words.some(w => w.startsWith(q))) return 60;
  if (t.includes(q)) return 40;

  // Fuzzy: all chars of query appear in order in text
  if (q.length >= 2) {
    let ti = 0;
    let matches = 0;
    for (const ch of q) {
      const found = t.indexOf(ch, ti);
      if (found === -1) break;
      ti = found + 1;
      matches++;
    }
    if (matches === q.length) return Math.round(10 + (matches / t.length) * 20);
  }

  return 0;
}

function bestScore(fields, query) {
  return Math.max(...fields.map(f => scoreText(f ?? '', query)));
}

export function computeSearchResults(query, { topics, projects }) {
  if (!query?.trim()) return [];
  const q = query.trim();
  const results = [];

  // Topics
  for (const t of topics) {
    const score = bestScore([t.title, t.label, t.category, t.body], q);
    if (score > 0) {
      results.push({ id: `topic-${t.id}`, title: t.title, subtitle: t.label, type: 'topic', topicId: t.id, score: score + 5 });
    }
  }

  // Topic sections
  for (const t of topics) {
    if (!t.module?.sections) continue;
    for (const [i, s] of t.module.sections.entries()) {
      const fieldScore = bestScore([
        s.title,
        ...s.subtopics.map(st => st.title),
        ...s.subtopics.map(st => st.explanation),
        ...s.subtopics.map(st => st.practice),
      ], q);
      if (fieldScore > 0) {
        results.push({
          id: `section-${t.id}-${i}`,
          title: s.title,
          subtitle: `${t.title} · Section`,
          type: 'section',
          topicId: t.id,
          sectionIdx: i,
          score: fieldScore,
        });
      }
    }
  }

  // Interview questions
  for (const qs of Object.values(sqlInterviewQuestions)) {
    for (const item of qs) {
      const score = bestScore([item.q, item.a, item.scenario], q);
      if (score > 0) {
        results.push({ id: `iq-${(item.q ?? '').slice(0, 40)}`, title: item.q, subtitle: 'Interview Q', type: 'interview', score });
      }
    }
  }

  // Projects
  for (const p of projects) {
    const score = bestScore([p.title, p.overview, p.meta, ...(p.tools ?? [])], q);
    if (score > 0) {
      const subtitle = p.tools?.slice(0, 2).join(' · ') ?? p.meta ?? '';
      results.push({ id: `proj-${p.title}`, title: p.title, subtitle, type: 'project', score });
    }
  }

  // Sort by score desc, then group order: topic > section > project > interview
  const GROUP_ORDER = { topic: 0, section: 1, project: 2, interview: 3 };
  results.sort((a, b) => {
    const scoreDiff = b.score - a.score;
    if (scoreDiff !== 0) return scoreDiff;
    return (GROUP_ORDER[a.type] ?? 9) - (GROUP_ORDER[b.type] ?? 9);
  });

  // De-dupe by id, cap at 10
  const seen = new Set();
  const deduped = [];
  for (const r of results) {
    if (!seen.has(r.id)) { seen.add(r.id); deduped.push(r); }
    if (deduped.length >= 10) break;
  }

  return deduped;
}

// Group results by type for display
export function groupResults(results) {
  const groups = {};
  const ORDER = ['topic', 'section', 'project', 'interview'];
  const LABELS = { topic: 'Topics', section: 'Sections', project: 'Projects', interview: 'Interview' };

  for (const r of results) {
    if (!groups[r.type]) groups[r.type] = { label: LABELS[r.type], items: [] };
    groups[r.type].items.push(r);
  }

  return ORDER.filter(k => groups[k]).map(k => groups[k]);
}
