const VARIANTS = {
  Beginner:     'badge-beginner',
  Intermediate: 'badge-intermediate',
  Advanced:     'badge-advanced',
};

export function DifficultyBadge({ level }) {
  const cls = VARIANTS[level] ?? 'badge-beginner';
  return <span className={`difficulty-badge ${cls}`}>{level}</span>;
}
