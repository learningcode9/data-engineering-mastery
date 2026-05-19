import { memo } from 'react';
import { navItems } from '../../data/appData.js';

const Sidebar = memo(function Sidebar({ isOpen, activeSection, onClose, onNavigate }) {
  return (
    <>
      <button
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        type="button"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`} aria-label="Main navigation">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">DE</div>
          <div>
            <strong>Data Eng</strong>
            <span>Mastery Platform</span>
          </div>
        </div>
        <nav aria-label="Sections">
          <ul className="nav-list" role="list">
            {navItems.map(({ label, icon }) => {
              const id = label.toLowerCase().replace(/\s+/g, '-');
              const active = activeSection === id;
              return (
                <li key={label}>
                  <a
                    href={`#${id}`}
                    className={active ? 'active' : ''}
                    aria-current={active ? 'page' : undefined}
                    onClick={e => {
                      e.preventDefault();
                      onNavigate(id);
                      onClose();
                    }}
                  >
                    <span className="nav-icon" aria-hidden="true">{icon}</span>
                    {label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
});

export default Sidebar;
