import { useState, useCallback, useMemo } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { PYTHON_LAB_EXERCISES } from '../../data/pythonLab.js';
import { useLocalStorage } from '../../hooks/useLocalStorage.js';

// ─── Difficulty badge colours ─────────────────────────────────────────────────
const DIFF_COLOR = {
  'Beginner':              '#2f756e',
  'Beginner-Intermediate': '#476b84',
  'Intermediate':          '#d97706',
  'Intermediate-Advanced': '#c2410c',
};

// ─── Empty progress entry ─────────────────────────────────────────────────────
function emptyEntry() {
  return { hintsRevealed: 0, outputRevealed: false, solutionRevealed: false, selfAssessment: null };
}

// ─── Exercise sidebar item ────────────────────────────────────────────────────
function ExerciseItem({ ex, isActive, progress, onClick }) {
  const entry    = progress[ex.id] ?? emptyEntry();
  const assessed = !!entry.selfAssessment;
  const started  = entry.hintsRevealed > 0 || entry.outputRevealed;

  return (
    <button
      type="button"
      className={[
        'pylab-exercise-item',
        isActive       && 'pylab-exercise-item--active',
        assessed       && 'pylab-exercise-item--assessed',
        started && !assessed && 'pylab-exercise-item--started',
      ].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      <span className="pylab-exercise-num">
        {assessed ? '✓' : ex.number}
      </span>
      <span className="pylab-exercise-info">
        <span className="pylab-exercise-title">{ex.title}</span>
        <span
          className="pylab-exercise-diff"
          style={{ color: DIFF_COLOR[ex.difficulty] ?? '#6b7280' }}
        >
          {ex.difficulty} · {ex.estimatedMinutes}min
        </span>
      </span>
    </button>
  );
}

// ─── Tag chip ─────────────────────────────────────────────────────────────────
function Tag({ label }) {
  return <span className="pylab-tag">{label}</span>;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function PythonLab({ addToActivityLog }) {
  const [progress, setProgress] = useLocalStorage('dem-python-lab-progress', {});
  const [activeId, setActiveId] = useState(PYTHON_LAB_EXERCISES[0].id);
  const [editorValue, setEditorValue] = useState({});

  const ex = useMemo(
    () => PYTHON_LAB_EXERCISES.find(e => e.id === activeId) ?? PYTHON_LAB_EXERCISES[0],
    [activeId]
  );

  const entry = useMemo(
    () => progress[ex.id] ?? emptyEntry(),
    [progress, ex.id]
  );

  const updateEntry = useCallback((patch) => {
    setProgress(prev => ({
      ...prev,
      [ex.id]: { ...(prev[ex.id] ?? emptyEntry()), ...patch },
    }));
  }, [ex.id, setProgress]);

  const currentCode = editorValue[ex.id] ?? ex.starterCode;

  function setCode(val) {
    setEditorValue(prev => ({ ...prev, [ex.id]: val }));
  }

  function handleRevealHint() {
    if (entry.hintsRevealed < ex.hints.length) {
      updateEntry({ hintsRevealed: entry.hintsRevealed + 1 });
    }
  }

  function handleRevealOutput() {
    updateEntry({ outputRevealed: true });
  }

  function handleRevealSolution() {
    updateEntry({ solutionRevealed: true });
  }

  function handleSelfAssess(result) {
    const isFirst = !entry.selfAssessment;
    updateEntry({ selfAssessment: result });
    if (isFirst) {
      addToActivityLog?.(`Completed Python Lab: ${ex.title}`, 'practice');
    }
  }

  function handleSelectExercise(id) {
    setActiveId(id);
  }

  const completedCount = PYTHON_LAB_EXERCISES.filter(e => !!(progress[e.id]?.selfAssessment)).length;
  const totalCount     = PYTHON_LAB_EXERCISES.length;

  return (
    <div className="pylab-shell">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="pylab-sidebar">
        <div className="pylab-sidebar-header">
          <h2 className="pylab-sidebar-title">Python Practice Lab</h2>
          <p className="pylab-sidebar-sub">
            {completedCount}/{totalCount} exercises completed
          </p>
          <div className="pylab-sidebar-progress-track">
            <div
              className="pylab-sidebar-progress-fill"
              style={{ width: `${Math.round((completedCount / totalCount) * 100)}%` }}
            />
          </div>
        </div>

        <nav className="pylab-exercise-list" aria-label="Exercise list">
          {PYTHON_LAB_EXERCISES.map(e => (
            <ExerciseItem
              key={e.id}
              ex={e}
              isActive={e.id === activeId}
              progress={progress}
              onClick={() => handleSelectExercise(e.id)}
            />
          ))}
        </nav>

        <div className="pylab-sidebar-footer">
          <p className="pylab-sidebar-note">
            Write your solution, check hints, then reveal the expected output before reviewing the reference answer.
          </p>
        </div>
      </aside>

      {/* ── Workspace ────────────────────────────────────────────────────────── */}
      <div className="pylab-workspace">

        {/* Exercise header */}
        <div className="pylab-ex-header">
          <div className="pylab-ex-meta">
            <span className="pylab-ex-number">Exercise {ex.number}</span>
            <span
              className="pylab-ex-diff"
              style={{ color: DIFF_COLOR[ex.difficulty] ?? '#6b7280' }}
            >
              {ex.difficulty}
            </span>
            <span className="pylab-ex-time">{ex.estimatedMinutes} min</span>
          </div>
          <h1 className="pylab-ex-title">{ex.title}</h1>
          <div className="pylab-tags">
            {ex.tags.map(t => <Tag key={t} label={t} />)}
          </div>
        </div>

        {/* Scenario + Objective */}
        <div className="pylab-scenario-card">
          <p className="pylab-scenario-label">Scenario</p>
          <p className="pylab-scenario-text">{ex.scenario}</p>
          <p className="pylab-objective-label">Objective</p>
          <p className="pylab-objective-text">{ex.objective}</p>
        </div>

        {/* Editor */}
        <div className="pylab-editor-section">
          <div className="pylab-editor-header">
            <span className="pylab-editor-label">Your solution</span>
            <button
              type="button"
              className="pylab-reset-btn"
              onClick={() => setCode(ex.starterCode)}
            >
              Reset
            </button>
          </div>
          <div className="pylab-editor-wrap">
            <MonacoEditor
              height="340px"
              language="python"
              theme="vs-dark"
              value={currentCode}
              onChange={val => setCode(val ?? '')}
              options={{
                fontSize: 13,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                wordWrap: 'on',
                tabSize: 4,
                renderWhitespace: 'boundary',
                automaticLayout: true,
              }}
            />
          </div>
        </div>

        {/* Hints */}
        <div className="pylab-hints-section">
          {entry.hintsRevealed > 0 && (
            <div className="pylab-hints-revealed">
              {ex.hints.slice(0, entry.hintsRevealed).map((hint, i) => (
                <div key={i} className="pylab-hint">
                  <span className="pylab-hint-label">Hint {i + 1}</span>
                  <p className="pylab-hint-text">{hint}</p>
                </div>
              ))}
            </div>
          )}

          {entry.hintsRevealed < ex.hints.length && !entry.outputRevealed && (
            <button
              type="button"
              className="pylab-btn pylab-btn--hint"
              onClick={handleRevealHint}
            >
              {entry.hintsRevealed === 0 ? 'Get a hint' : 'Next hint'}
            </button>
          )}
        </div>

        {/* How did I do? / Output reveal */}
        {!entry.outputRevealed && (
          <div className="pylab-check-section">
            <button
              type="button"
              className="pylab-btn pylab-btn--check"
              onClick={handleRevealOutput}
            >
              How did I do? →
            </button>
          </div>
        )}

        {entry.outputRevealed && (
          <div className="pylab-output-section">
            <div className="pylab-output-card">
              <p className="pylab-output-label">Expected output</p>
              <pre className="pylab-output-pre">{ex.expectedOutput}</pre>
            </div>

            <div className="pylab-mistakes-card">
              <p className="pylab-mistakes-label">Common mistakes</p>
              <ul className="pylab-mistakes-list">
                {ex.commonMistakes.map((m, i) => (
                  <li key={i} className="pylab-mistake-item">{m}</li>
                ))}
              </ul>
            </div>

            <div className="pylab-interview-card">
              <span className="pylab-interview-kicker">Interview connection</span>
              <p className="pylab-interview-text">{ex.interviewConnection}</p>
            </div>

            {/* Reference solution */}
            {!entry.solutionRevealed && (
              <button
                type="button"
                className="pylab-btn pylab-btn--solution"
                onClick={handleRevealSolution}
              >
                View reference solution
              </button>
            )}

            {entry.solutionRevealed && (
              <div className="pylab-solution-section">
                <p className="pylab-solution-label">Reference solution</p>
                <div className="pylab-solution-editor-wrap">
                  <MonacoEditor
                    height="260px"
                    language="python"
                    theme="vs-dark"
                    value={ex.solutionCode}
                    options={{
                      readOnly: true,
                      fontSize: 13,
                      fontFamily: 'JetBrains Mono, Fira Code, monospace',
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      lineNumbers: 'on',
                      wordWrap: 'on',
                      automaticLayout: true,
                    }}
                  />
                </div>

                <div className="pylab-annotations">
                  <p className="pylab-annotations-label">What makes this correct</p>
                  <ol className="pylab-annotation-list">
                    {ex.solutionAnnotations.map((a, i) => (
                      <li key={i} className="pylab-annotation-item">{a}</li>
                    ))}
                  </ol>
                </div>

                {/* Self-assessment */}
                {!entry.selfAssessment ? (
                  <div className="pylab-assess-section">
                    <p className="pylab-assess-prompt">How did your solution compare?</p>
                    <div className="pylab-assess-btns">
                      <button
                        type="button"
                        className="pylab-btn pylab-btn--got-it"
                        onClick={() => handleSelfAssess('got_it')}
                      >
                        I got it ✓
                      </button>
                      <button
                        type="button"
                        className="pylab-btn pylab-btn--missed"
                        onClick={() => handleSelfAssess('missed')}
                      >
                        I missed something
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`pylab-assessed pylab-assessed--${entry.selfAssessment}`}>
                    {entry.selfAssessment === 'got_it' ? (
                      <>
                        <span className="pylab-assessed-icon">✓</span>
                        <span>Marked complete — move to the next exercise.</span>
                      </>
                    ) : (
                      <>
                        <span className="pylab-assessed-icon">↺</span>
                        <span>Logged. Study the annotations above and revisit this exercise.</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
