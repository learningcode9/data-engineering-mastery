import { memo, useState } from 'react';
import { navItems } from '../../data/appData.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { topics } from '../../data/topics.js';
import { ACHIEVEMENTS, RARITY } from '../../hooks/useAchievements.js';
import useLearningStore from '../../store/learningStore.js';
import { ProgressBar, SidebarItem } from '../ui/design-system.jsx';

function computeOverallPct(practiceProgress) {
  let total = 0, done = 0;
  for (const t of topics) {
    const sections = t.module?.sections ?? [];
    const practisable = sections.filter(s => s.subtopics.some(st => st.practice));
    total += practisable.length;
    done  += practisable.filter(s =>
      s.subtopics.filter(st => st.practice).every(st => !!practiceProgress?.[st.id])
    ).length;
  }
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

const Sidebar = memo(function Sidebar({ isOpen, activeSection, onClose, onNavigate, compact, onToggleCompact }) {
  const [practiceProgress] = useLocalStorage('dem-practice-progress', {});
  const [learnedSet]       = useLocalStorage('dem-interview-learned', {});
  const completedTopics    = useLearningStore(s => s.completedTopics);
  const unlockedAch        = useLearningStore(s => s.achievements);
  const [showAch, setShowAch] = useState(false);

  const overallPct   = computeOverallPct(practiceProgress);
  const completedCnt = Object.values(completedTopics).filter(Boolean).length;
  const interviewPct = Math.min(Math.round((Object.values(learnedSet).filter(Boolean).length / 20) * 100), 100);
  const achCount     = Object.keys(unlockedAch).length;

  const navProgress = {
    topics:           overallPct,
    'interview-prep': interviewPct,
  };

  const recentAch = ACHIEVEMENTS
    .filter(a => unlockedAch[a.id])
    .sort((a, b) => new Date(unlockedAch[b.id]) - new Date(unlockedAch[a.id]))
    .slice(0, 6);

  return (
    <>
      <button
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        type="button"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside
        className={`sidebar${isOpen ? ' open' : ''}${compact ? ' sidebar--compact' : ''}`}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">DE</div>
          {!compact && (
            <div>
              <strong>Data Eng</strong>
              <span>Mastery Platform</span>
            </div>
          )}
        </div>

        {/* Overall progress strip (full mode only) */}
        {!compact && (
          <div className="sidebar-overall">
            <div className="sidebar-overall-label">
              <span>Overall progress</span>
              <span>{overallPct}%</span>
            </div>
            <ProgressBar percent={overallPct} label="Overall learning progress" size="sm" className="sidebar-overall-progress" />
            <span className="sidebar-overall-sub">{completedCnt}/{topics.length} topics complete</span>
          </div>
        )}

        {/* Nav list */}
        <nav aria-label="Sections">
          <ul className="nav-list" role="list">
            {navItems.map(({ label, icon }) => {
              const id     = label.toLowerCase().replace(/\s+/g, '-');
              const active = activeSection === id;
              const pct    = navProgress[id];
              return (
                <li key={label}>
                  <SidebarItem
                    href={`#${id}`}
                    active={active}
                    icon={icon}
                    label={label}
                    progress={pct}
                    compact={compact}
                    onClick={e => {
                      e.preventDefault();
                      onNavigate(id);
                      onClose();
                    }}
                  />
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Achievements strip (full mode only) */}
        {!compact && achCount > 0 && (
          <div className="sidebar-achievements">
            <button
              type="button"
              className="sidebar-ach-toggle"
              onClick={() => setShowAch(s => !s)}
            >
              <span>Achievements</span>
              <span className="sidebar-ach-count">{achCount}/{ACHIEVEMENTS.length}</span>
            </button>
            {showAch && (
              <div className="sidebar-ach-grid">
                {recentAch.map(a => (
                  <div
                    key={a.id}
                    className="sidebar-ach-chip"
                    title={`${a.name} — ${a.desc}`}
                    style={{ '--ach-color': RARITY[a.rarity].color }}
                  >
                    <span>{a.icon}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Bottom: compact toggle */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-compact-toggle"
            onClick={onToggleCompact}
            title={compact ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={compact ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span aria-hidden="true">{compact ? '›' : '‹'}</span>
            {!compact && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
});

export default Sidebar;
