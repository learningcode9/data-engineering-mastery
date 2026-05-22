import { forwardRef, useCallback, useImperativeHandle, useRef, useState, useMemo } from 'react';
import { TABLE_SCHEMAS } from '../../utils/sqlEngine.js';

// ── SQL tokenizer for syntax highlighting ──────────────────────────────────────

const KW = new Set([
  'SELECT','FROM','WHERE','GROUP','BY','ORDER','HAVING','LIMIT','DISTINCT','AS',
  'AND','OR','NOT','IN','IS','NULL','LIKE','ILIKE','BETWEEN','EXISTS',
  'JOIN','INNER','LEFT','RIGHT','FULL','OUTER','CROSS','ON','USING',
  'UNION','ALL','INTERSECT','EXCEPT','WITH','RECURSIVE',
  'INSERT','INTO','UPDATE','SET','DELETE','CREATE','DROP','ALTER','TABLE',
  'CASE','WHEN','THEN','ELSE','END','OVER','PARTITION','ROWS','RANGE',
  'PRECEDING','FOLLOWING','UNBOUNDED','CURRENT','ROW',
  'ASC','DESC','NULLS','FIRST','LAST','TRUE','FALSE',
]);

const FN = new Set([
  'COUNT','SUM','AVG','MAX','MIN','COALESCE','NULLIF','IFNULL','IIF',
  'CAST','TYPEOF','LENGTH','UPPER','LOWER','TRIM','LTRIM','RTRIM',
  'SUBSTR','SUBSTRING','REPLACE','INSTR','PRINTF','FORMAT',
  'ROUND','ABS','CEIL','FLOOR','MOD','RANDOM',
  'DATE','TIME','DATETIME','STRFTIME','JULIANDAY','NOW',
  'ROW_NUMBER','RANK','DENSE_RANK','NTILE','LAG','LEAD',
  'FIRST_VALUE','LAST_VALUE','NTH_VALUE',
]);

function tokenize(sql) {
  const tokens = [];
  let i = 0;
  while (i < sql.length) {
    // Line comment
    if (sql[i] === '-' && sql[i + 1] === '-') {
      const end = sql.indexOf('\n', i);
      const text = end === -1 ? sql.slice(i) : sql.slice(i, end);
      tokens.push({ t: 'cmt', v: text });
      i += text.length;
      continue;
    }
    // String literal
    if (sql[i] === "'") {
      let j = i + 1;
      while (j < sql.length && !(sql[j] === "'" && sql[j - 1] !== '\\')) j++;
      tokens.push({ t: 'str', v: sql.slice(i, j + 1) });
      i = j + 1;
      continue;
    }
    // Number
    if (/\d/.test(sql[i]) && (i === 0 || !/\w/.test(sql[i - 1]))) {
      let j = i;
      while (j < sql.length && /[\d.]/.test(sql[j])) j++;
      tokens.push({ t: 'num', v: sql.slice(i, j) });
      i = j;
      continue;
    }
    // Word (keyword, function, or identifier)
    if (/[a-zA-Z_]/.test(sql[i])) {
      let j = i;
      while (j < sql.length && /[\w]/.test(sql[j])) j++;
      const word = sql.slice(i, j);
      const upper = word.toUpperCase();
      const t = KW.has(upper) ? 'kw' : FN.has(upper) ? 'fn' : 'id';
      tokens.push({ t, v: word, upper });
      i = j;
      continue;
    }
    // Operator
    if (/[=<>!+\-*/]/.test(sql[i])) {
      let j = i + 1;
      while (j < sql.length && /[=<>!]/.test(sql[j])) j++;
      tokens.push({ t: 'op', v: sql.slice(i, j) });
      i = j;
      continue;
    }
    // Punctuation / whitespace
    tokens.push({ t: sql[i] === '\n' ? 'nl' : 'plain', v: sql[i] });
    i++;
  }
  return tokens;
}

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function highlight(sql) {
  return tokenize(sql)
    .map(({ t, v, upper }) => {
      const e = esc(v);
      switch (t) {
        case 'kw':  return `<span class="sq-kw">${upper ?? e}</span>`;
        case 'fn':  return `<span class="sq-fn">${upper ?? e}</span>`;
        case 'str': return `<span class="sq-str">${e}</span>`;
        case 'num': return `<span class="sq-num">${e}</span>`;
        case 'cmt': return `<span class="sq-cmt">${e}</span>`;
        case 'op':  return `<span class="sq-op">${e}</span>`;
        default:    return e;
      }
    })
    .join('');
}

// ── Autocomplete suggestions ───────────────────────────────────────────────────

const ALL_KW = [...KW].sort();
const ALL_FN = [...FN].sort();
const ALL_TABLES = Object.keys(TABLE_SCHEMAS);
const ALL_COLUMNS = [...new Set(Object.values(TABLE_SCHEMAS).flatMap(s => s.columns))].sort();

function getSuggestions(value, cursorPos) {
  const before = value.slice(0, cursorPos);
  const wordMatch = before.match(/(\w+)$/);
  const prefix = wordMatch ? wordMatch[1].toLowerCase() : '';

  if (!prefix || prefix.length < 2) return [];

  const matches = [];
  const addIf = (candidates, type) => {
    for (const c of candidates) {
      if (c.toLowerCase().startsWith(prefix)) matches.push({ text: c, type });
      if (matches.length >= 8) return;
    }
  };

  // Context detection: what comes just before the word?
  const contextBefore = before.slice(0, before.length - (wordMatch?.[0].length ?? 0)).trimEnd().toUpperCase();
  const lastKw = contextBefore.match(/\b(FROM|JOIN|SELECT|WHERE|ORDER BY|GROUP BY|HAVING|ON)\s*$/)?.[1];

  if (lastKw === 'FROM' || lastKw === 'JOIN') {
    addIf(ALL_TABLES, 'table');
    addIf(ALL_KW, 'keyword');
  } else if (lastKw === 'SELECT') {
    addIf(ALL_COLUMNS, 'column');
    addIf(ALL_FN, 'function');
    addIf(ALL_KW, 'keyword');
  } else if (lastKw === 'WHERE' || lastKw === 'ON' || lastKw === 'HAVING') {
    addIf(ALL_COLUMNS, 'column');
    addIf(ALL_KW, 'keyword');
  } else {
    addIf(ALL_KW, 'keyword');
    addIf(ALL_FN, 'function');
    addIf(ALL_TABLES, 'table');
    addIf(ALL_COLUMNS, 'column');
  }

  return matches;
}

// ── SqlEditor component ────────────────────────────────────────────────────────

export const SqlEditor = forwardRef(function SqlEditor(
  { value, onChange, onRun, disabled, placeholder = 'Write your SQL query here…' },
  ref
) {
  const taRef = useRef(null);
  const [cursor, setCursor] = useState(0);
  const [acOpen, setAcOpen] = useState(false);
  const [acIndex, setAcIndex] = useState(0);

  const suggestions = useMemo(
    () => (acOpen ? getSuggestions(value, cursor) : []),
    [acOpen, value, cursor]
  );

  // Expose imperativeHandle for click-to-insert from schema panel
  useImperativeHandle(ref, () => ({
    insertAtCursor(text) {
      const ta = taRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      const next  = value.slice(0, start) + text + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        ta.setSelectionRange(start + text.length, start + text.length);
        ta.focus();
      });
    },
    focus() { taRef.current?.focus(); },
  }));

  const applySuggestion = useCallback((sug) => {
    const ta = taRef.current;
    if (!ta) return;
    const before = value.slice(0, cursor);
    const after  = value.slice(cursor);
    const wordLen = (before.match(/(\w+)$/) ?? ['', ''])[1].length;
    const insertText = sug.type === 'keyword' ? sug.text : sug.text;
    const next = before.slice(0, cursor - wordLen) + insertText + after;
    onChange(next);
    setAcOpen(false);
    requestAnimationFrame(() => {
      const newPos = cursor - wordLen + insertText.length;
      ta.setSelectionRange(newPos, newPos);
      ta.focus();
    });
  }, [value, cursor, onChange]);

  function handleKeyDown(e) {
    // Autocomplete navigation
    if (acOpen && suggestions.length) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setAcIndex(i => Math.min(i + 1, suggestions.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setAcIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        applySuggestion(suggestions[acIndex]);
        return;
      }
      if (e.key === 'Escape') { setAcOpen(false); return; }
    }

    // Tab → 2 spaces
    if (e.key === 'Tab' && !acOpen) {
      e.preventDefault();
      const ta = taRef.current;
      const start = ta.selectionStart;
      const next  = value.slice(0, start) + '  ' + value.slice(ta.selectionEnd);
      onChange(next);
      requestAnimationFrame(() => ta.setSelectionRange(start + 2, start + 2));
      return;
    }

    // Cmd/Ctrl+Enter → run
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      setAcOpen(false);
      onRun?.();
    }
  }

  function handleChange(e) {
    const next = e.target.value;
    const pos  = e.target.selectionStart;
    onChange(next);
    setCursor(pos);
    setAcOpen(next.length > 0);
    setAcIndex(0);
  }

  function handleSelect(e) {
    setCursor(e.target.selectionStart);
  }

  const lines = value.split('\n');
  const highlighted = highlight(value) + '\n';

  return (
    <div className="sql-editor-root">
      <div className="sql-editor-wrap">
        {/* Line numbers */}
        <div className="sql-editor-gutter" aria-hidden="true">
          {lines.map((_, i) => <span key={i}>{i + 1}</span>)}
        </div>

        {/* Highlight layer + textarea */}
        <div className="sql-editor-inner">
          <pre
            className="sql-pre"
            aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
          <textarea
            ref={taRef}
            className="sql-textarea"
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSelect={handleSelect}
            onBlur={() => setTimeout(() => setAcOpen(false), 150)}
            onFocus={() => value.length > 0 && setAcOpen(true)}
            placeholder={placeholder}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            disabled={disabled}
            aria-label="SQL query editor"
            aria-multiline="true"
          />
        </div>
      </div>

      {/* Autocomplete dropdown */}
      {acOpen && suggestions.length > 0 && (
        <ul className="sql-autocomplete" role="listbox" aria-label="Suggestions">
          {suggestions.map((s, i) => (
            <li
              key={s.text}
              role="option"
              aria-selected={i === acIndex}
              className={`sql-suggestion sql-suggestion--${s.type}${i === acIndex ? ' sql-suggestion--active' : ''}`}
              onMouseDown={e => { e.preventDefault(); applySuggestion(s); }}
            >
              <span className="sql-sug-type">{s.type[0].toUpperCase()}</span>
              <span className="sql-sug-text">{s.text}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="sql-editor-footer">
        <span className="sql-shortcut-hint">
          <kbd>⌘</kbd><kbd>↵</kbd> run · <kbd>Tab</kbd> complete · <kbd>↑↓</kbd> navigate
        </span>
        <span className="sql-editor-lines">{lines.length} line{lines.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
});
