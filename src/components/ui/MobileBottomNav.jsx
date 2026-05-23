import { memo } from 'react';

const TABS = [
  { label: 'Dashboard', icon: '⌂', section: 'dashboard' },
  { label: 'Path',      icon: '▦', section: 'topics'    },
  { label: 'Interview', icon: '◌', section: 'interview-prep' },
  { label: 'Projects',  icon: '▣', section: 'projects'  },
  { label: 'AI Coach',  icon: '✦', section: 'ai-learning' },
];

export const MobileBottomNav = memo(function MobileBottomNav({ activeSection, onNavigate }) {
  function handleTap(tab) {
    const el = document.getElementById(tab.section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onNavigate(tab.section);
    }
  }

  return (
    <nav className="mobile-bottom-nav" aria-label="Main navigation">
      {TABS.map(tab => (
        <button
          key={tab.section}
          type="button"
          className={`mbn-tab${activeSection === tab.section ? ' mbn-tab--active' : ''}`}
          onClick={() => handleTap(tab)}
          aria-label={tab.label}
          aria-current={activeSection === tab.section ? 'page' : undefined}
        >
          <span className="mbn-icon" aria-hidden="true">{tab.icon}</span>
          <span className="mbn-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
});
