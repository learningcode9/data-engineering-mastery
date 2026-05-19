import { memo } from 'react';
import { quickLinks } from '../../data/appData.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';

const RightRail = memo(function RightRail({ onNavigate }) {
  const [collapsed, setCollapsed] = useLocalStorage('dem-rightrail-collapsed', false);

  return (
    <aside
      className={`right-rail${collapsed ? ' right-rail--collapsed' : ''}`}
      aria-label="Quick links and learning focus"
    >
      {/* Always-visible header with toggle */}
      <div className="right-rail-header">
        {!collapsed && <span className="right-rail-label eyebrow">Resources</span>}
        <button
          type="button"
          className="right-rail-toggle"
          onClick={() => setCollapsed(c => !c)}
          aria-label={collapsed ? 'Expand resource panel' : 'Collapse resource panel'}
          title={collapsed ? 'Open Resources panel' : 'Close panel'}
        >
          {collapsed ? '≡' : '✕'}
        </button>
      </div>

      {/* Animated body — collapses with CSS grid-row trick */}
      <div className="right-rail-body" aria-hidden={collapsed ? 'true' : undefined}>
        <div className="right-rail-body-inner">
          <section className="card focus-card">
            <p className="eyebrow">This Week</p>
            <h2>Cloud pipeline sprint</h2>
            <p>Finish a small Azure ingestion flow and document the tradeoffs.</p>
          </section>

          <section className="card quick-links">
            <div className="section-title-row">
              <div>
                <p className="eyebrow">Quick Links</p>
                <h2>Jump back in</h2>
              </div>
            </div>
            {quickLinks.map(link => (
              <a
                key={link}
                href="#topics"
                onClick={e => { e.preventDefault(); onNavigate('topics'); }}
              >
                <span>{link}</span>
                <strong>→</strong>
              </a>
            ))}
          </section>
        </div>
      </div>
    </aside>
  );
});

export default RightRail;
