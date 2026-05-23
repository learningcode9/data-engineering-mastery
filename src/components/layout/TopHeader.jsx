import { memo, useState, useRef, useEffect, useCallback } from 'react';
import { RESULT_TYPES, groupResults } from '../../utils/searchUtils.js';
import { navItems } from '../../data/appData.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';
import { NotificationCenter } from '../ui/NotificationCenter.jsx';
import { useUser } from '../../providers/UserProvider';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

function highlight(text, query) {
  if (!query || !text) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="search-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

function buildCommandItems({ onNavigate, onToggleDark, onToggleEngMode, isDark, engineeringMode, onClose }) {
  const navSections = navItems.map(({ label, icon }) => ({
    kind: 'nav',
    icon,
    label,
    sub: 'Jump to section',
    id: label.toLowerCase().replace(/\s+/g, '-'),
    action: () => { onNavigate(label.toLowerCase().replace(/\s+/g, '-')); onClose(); },
  }));

  const actions = [
    {
      kind: 'action',
      icon: isDark ? '☀' : '☾',
      label: isDark ? 'Switch to light mode' : 'Switch to dark mode',
      sub: 'Toggle',
      action: () => { onToggleDark(); onClose(); },
    },
    {
      kind: 'action',
      icon: engineeringMode ? '⌥' : '⚡',
      label: engineeringMode ? 'Switch to Guided Mode' : 'Switch to Engineering Mode',
      sub: 'Toggle',
      action: () => { onToggleEngMode(); onClose(); },
    },
    {
      kind: 'action',
      icon: '◌',
      label: 'Start Timed Interview',
      sub: 'Practice',
      action: () => { onNavigate('interview-prep'); onClose(); },
    },
    {
      kind: 'action',
      icon: '⚡',
      label: 'Open Databricks Simulator',
      sub: 'Practice',
      action: () => { onNavigate('databricks'); onClose(); },
    },
    {
      kind: 'action',
      icon: '◈',
      label: 'Open AI Coach',
      sub: 'Learning',
      action: () => { onNavigate('ai-learning'); onClose(); },
    },
  ];

  return { navSections, actions };
}

function CommandPalette({ onNavigate, onToggleDark, onToggleEngMode, isDark, engineeringMode, onClose, focusedIndex, setFocusedIndex, recentSearches, onRecentSearch, onClearRecent }) {
  const { navSections, actions } = buildCommandItems({ onNavigate, onToggleDark, onToggleEngMode, isDark, engineeringMode, onClose });

  const groups = [
    { label: 'Navigate', items: navSections },
    { label: 'Actions', items: actions },
  ];

  const flat = [...navSections, ...actions];

  return (
    <div className="search-dropdown cmd-palette" role="listbox" aria-label="Command palette">
      {recentSearches?.length > 0 && (
        <div className="cmd-group">
          <div className="cmd-palette-heading-row">
            <p className="cmd-palette-heading">Recent Searches</p>
            <button type="button" className="cmd-clear-recent" onClick={onClearRecent}>Clear</button>
          </div>
          {recentSearches.map(term => (
            <button
              key={term}
              type="button"
              className="search-result-item search-result-item--recent"
              onClick={() => onRecentSearch(term)}
            >
              <span className="search-result-icon" aria-hidden="true">↗</span>
              <div className="search-result-text">
                <span className="search-result-title">{term}</span>
              </div>
            </button>
          ))}
        </div>
      )}
      {groups.map(g => (
        <div key={g.label} className="cmd-group">
          <p className="cmd-palette-heading">{g.label}</p>
          {g.items.map((item) => {
            const idx = flat.indexOf(item);
            const focused = focusedIndex === idx;
            return (
              <button
                key={item.label}
                type="button"
                className={`search-result-item${focused ? ' search-result-item--focused' : ''}`}
                role="option"
                aria-selected={focused}
                onMouseEnter={() => setFocusedIndex(idx)}
                onClick={item.action}
              >
                <span className="search-result-icon" aria-hidden="true">{item.icon}</span>
                <div className="search-result-text">
                  <span className="search-result-title">{item.label}</span>
                  <span className="search-result-subtitle">{item.sub}</span>
                </div>
                <kbd className="cmd-kbd">↵</kbd>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function SearchDropdown({ results, query, onSelect, focusedIndex, setFocusedIndex }) {
  if (!results.length) return (
    <div className="search-dropdown search-dropdown--empty" role="status">
      <span className="search-no-results">No results for "{query}"</span>
    </div>
  );

  const groups = groupResults(results);
  let globalIdx = 0;

  return (
    <div className="search-dropdown" role="listbox" aria-label="Search results">
      {groups.map(g => (
        <div key={g.label} className="search-result-group">
          <p className="search-result-group-label">{g.label}</p>
          {g.items.map(r => {
            const idx = globalIdx++;
            return (
              <button
                key={r.id}
                type="button"
                className={`search-result-item${focusedIndex === idx ? ' search-result-item--focused' : ''}`}
                role="option"
                aria-selected={focusedIndex === idx}
                onMouseEnter={() => setFocusedIndex(idx)}
                onClick={() => onSelect(r)}
              >
                <span className="search-result-icon" aria-hidden="true">{RESULT_TYPES[r.type]}</span>
                <div className="search-result-text">
                  <span className="search-result-title">{highlight(r.title, query)}</span>
                  <span className="search-result-subtitle">{r.subtitle}</span>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function getInitials(user) {
  if (!user || user.id === 'local-guest') return 'DE';
  if (user.fullName) {
    return user.fullName.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'DE';
  }
  return user.email?.[0]?.toUpperCase() ?? 'DE';
}

function UserMenu() {
  const { currentUser, isMockUser, openAuthPage, signOut, openOnboardingPage } = useUser();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onMouseDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const initials    = getInitials(currentUser);
  const displayName = isMockUser ? 'Demo Learner' : (currentUser?.fullName ?? currentUser?.email ?? 'User');
  const displayEmail = isMockUser ? 'demo mode — not signed in' : (currentUser?.email ?? '');

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu-btn"
        onClick={() => setOpen(o => !o)}
        aria-label="User profile menu"
        aria-expanded={open}
        aria-haspopup="true"
        title={displayName}
      >
        {initials}
      </button>

      {open && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-identity">
            <p className="user-menu-name">{displayName}</p>
            {displayEmail && <p className="user-menu-email">{displayEmail}</p>}
            {isMockUser && <span className="user-menu-badge">Demo Mode</span>}
          </div>
          <div className="user-menu-actions">
            <button
              type="button"
              className="user-menu-action"
              role="menuitem"
              onClick={() => { setOpen(false); openOnboardingPage(); }}
            >
              ◎ Learning Preferences
            </button>
            {isMockUser ? (
              <button
                type="button"
                className="user-menu-action user-menu-action--signin"
                role="menuitem"
                onClick={() => { setOpen(false); openAuthPage(); }}
              >
                ↗ Sign In / Create Account
              </button>
            ) : (
              <button
                type="button"
                className="user-menu-action user-menu-action--signout"
                role="menuitem"
                onClick={() => { setOpen(false); signOut(); }}
              >
                ← Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const TopHeader = memo(function TopHeader({
  isDark, onMenuClick, onSearchChange, onThemeToggle, searchTerm,
  searchResults, onResultClick, xp, level, streak, onNavigate,
  engineeringMode, onToggleEngineeringMode, unlockedAchCount,
  onOpenCmdPalette, activityLog,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useLocalStorage('dem-recent-searches', []);
  const wrapRef  = useRef(null);
  const inputRef = useRef(null);

  const showResults  = dropdownOpen && searchTerm.length > 0;
  const showPalette  = dropdownOpen && searchTerm.length === 0;
  const totalResults = showResults ? (searchResults?.length ?? 0) : showPalette ? 14 : 0;

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 24); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    function onKey(e) {
      const tag = document.activeElement?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === '/' && !inInput) {
        e.preventDefault();
        inputRef.current?.focus();
        setDropdownOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (onOpenCmdPalette) { onOpenCmdPalette(); return; }
        inputRef.current?.focus();
        setDropdownOpen(true);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onOpenCmdPalette]);

  useEffect(() => {
    function onMouseDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setDropdownOpen(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const closePalette = useCallback(() => {
    setDropdownOpen(false);
    setFocusedIndex(-1);
  }, []);

  function handleInput(e) {
    onSearchChange(e.target.value);
    setDropdownOpen(true);
    setFocusedIndex(-1);
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(i => Math.min(i + 1, totalResults - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedIndex >= 0) {
        if (showResults && searchResults[focusedIndex]) {
          handleResultClick(searchResults[focusedIndex]);
        } else if (showPalette) {
          const { navSections, actions } = buildCommandItems({
            onNavigate, onToggleDark: onThemeToggle, onToggleEngMode: onToggleEngineeringMode,
            isDark, engineeringMode, onClose: closePalette,
          });
          const flat = [...navSections, ...actions];
          flat[focusedIndex]?.action();
        }
      } else if (showResults && searchResults.length > 0) {
        handleResultClick(searchResults[0]);
      }
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
      setFocusedIndex(-1);
      inputRef.current?.blur();
    }
  }

  function handleResultClick(result) {
    if (searchTerm.trim().length > 1) {
      setRecentSearches(prev => {
        const filtered = prev.filter(s => s !== searchTerm.trim());
        return [searchTerm.trim(), ...filtered].slice(0, 5);
      });
    }
    setDropdownOpen(false);
    setFocusedIndex(-1);
    onResultClick(result);
  }

  function handleClear() {
    onSearchChange('');
    setDropdownOpen(false);
    setFocusedIndex(-1);
  }

  const kbdHint = isMac ? '⌘K' : 'Ctrl+K';

  return (
    <header className={`top-header${scrolled ? ' top-header--scrolled' : ''}`}>
      <div className="header-title">
        <p className="eyebrow">Learning Platform</p>
        <h1>Data Engineering Mastery</h1>
        <p className="header-copy">
          Build real pipeline skills — SQL, Python, Spark, and cloud tools.
        </p>
      </div>

      <div className="header-actions">
        {(level > 1 || xp > 0 || streak > 0) && (
          <div className="header-stats" aria-label="Learning stats">
            {streak > 0 && (
              <span className="header-streak" title={`${streak}-day streak`}>🔥 {streak}</span>
            )}
            <span className="header-level" title={`Level ${level} · ${xp} XP total`}>Lv {level}</span>
            {unlockedAchCount > 0 && (
              <span className="header-ach" title={`${unlockedAchCount} achievements`}>
                ✦ {unlockedAchCount}
              </span>
            )}
          </div>
        )}

        <div className="search-wrap" ref={wrapRef} role="search">
          <div className={`search${showResults || showPalette ? ' search--open' : ''}`}>
            <span aria-hidden="true">⌕</span>
            <input
              ref={inputRef}
              type="search"
              placeholder={`Search or ${kbdHint} for commands…`}
              value={searchTerm}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setDropdownOpen(true)}
              aria-label="Global search"
              aria-expanded={showResults || showPalette}
              aria-haspopup="listbox"
              autoComplete="off"
            />
            {searchTerm
              ? <button type="button" className="search-clear" onClick={handleClear} aria-label="Clear">×</button>
              : <kbd className="search-kbd-hint" aria-hidden="true">{kbdHint}</kbd>
            }
          </div>

          {showResults && (
            <SearchDropdown
              results={searchResults ?? []}
              query={searchTerm}
              onSelect={handleResultClick}
              focusedIndex={focusedIndex}
              setFocusedIndex={setFocusedIndex}
            />
          )}
          {showPalette && onNavigate && (
            <CommandPalette
              query={searchTerm}
              onNavigate={onNavigate}
              onToggleDark={onThemeToggle}
              onToggleEngMode={onToggleEngineeringMode}
              isDark={isDark}
              engineeringMode={engineeringMode}
              onClose={closePalette}
              focusedIndex={focusedIndex}
              setFocusedIndex={setFocusedIndex}
              recentSearches={recentSearches}
              onRecentSearch={term => { onSearchChange(term); setDropdownOpen(true); }}
              onClearRecent={() => setRecentSearches([])}
            />
          )}
        </div>

        <button
          type="button"
          className={`eng-mode-toggle${engineeringMode ? ' eng-mode-toggle--active' : ''}`}
          onClick={onToggleEngineeringMode}
          title={engineeringMode ? 'Switch to Guided Mode' : 'Switch to Engineering Mode'}
          aria-pressed={engineeringMode}
        >
          <span aria-hidden="true">{engineeringMode ? '⚡' : '⌥'}</span>
          <span className="eng-mode-label">{engineeringMode ? 'Eng Mode' : 'Guided'}</span>
        </button>

        <button
          type="button"
          className="icon-button"
          onClick={onThemeToggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? '☀' : '☾'}
        </button>

        <NotificationCenter activityLog={activityLog} />

        <UserMenu />

        <button
          type="button"
          className="icon-button menu-button"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>
    </header>
  );
});

export default TopHeader;
