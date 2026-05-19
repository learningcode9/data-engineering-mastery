import { memo, useState, useRef, useEffect } from 'react';
import { RESULT_TYPES } from '../../utils/searchUtils.js';

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

function SearchDropdown({ results, query, onSelect }) {
  if (!results.length) return null;
  return (
    <div className="search-dropdown" role="listbox" aria-label="Search results">
      {results.map(r => (
        <button
          key={r.id}
          type="button"
          className="search-result-item"
          role="option"
          onClick={() => onSelect(r)}
        >
          <span className="search-result-icon" aria-hidden="true">{RESULT_TYPES[r.type]}</span>
          <div className="search-result-text">
            <span className="search-result-title">{highlight(r.title, query)}</span>
            <span className="search-result-subtitle">{r.subtitle}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

const TopHeader = memo(function TopHeader({
  isDark, onMenuClick, onSearchChange, onThemeToggle, searchTerm,
  searchResults, onResultClick,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapRef = useRef(null);

  const showDropdown = dropdownOpen && searchTerm.length > 0 && searchResults?.length > 0;

  // Close dropdown when clicking outside the search wrapper
  useEffect(() => {
    function onMouseDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  function handleInput(e) {
    onSearchChange(e.target.value);
    setDropdownOpen(true);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && searchResults?.length > 0) {
      handleResultClick(searchResults[0]);
    } else if (e.key === 'Escape') {
      setDropdownOpen(false);
    }
  }

  function handleResultClick(result) {
    setDropdownOpen(false);
    onResultClick(result);
  }

  function handleClear() {
    onSearchChange('');
    setDropdownOpen(false);
  }

  return (
    <header className="top-header">
      <div className="header-title">
        <p className="eyebrow">Learning Platform</p>
        <h1>Data Engineering Mastery</h1>
        <p className="header-copy">
          Build real pipeline skills — SQL, Python, Spark, and cloud tools.
        </p>
      </div>

      <div className="header-actions">
        <div className="search-wrap" ref={wrapRef} role="search">
          <div className={`search${showDropdown ? ' search--open' : ''}`}>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              placeholder="Search topics, questions…"
              value={searchTerm}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setDropdownOpen(true)}
              aria-label="Global search"
              aria-expanded={showDropdown}
              aria-haspopup="listbox"
              autoComplete="off"
            />
            {searchTerm && (
              <button
                type="button"
                className="search-clear"
                onClick={handleClear}
                aria-label="Clear search"
                title="Clear"
              >
                ×
              </button>
            )}
          </div>
          {showDropdown && (
            <SearchDropdown
              results={searchResults}
              query={searchTerm}
              onSelect={handleResultClick}
            />
          )}
        </div>

        <button
          type="button"
          className="icon-button"
          onClick={onThemeToggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? '☀' : '☾'}
        </button>

        <div className="avatar" aria-label="User profile" title="Profile">DE</div>

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
