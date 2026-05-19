import { useState } from 'react';
import { toast } from '../../utils/toast.js';

export function InterviewQuestionCard({ question, answer, scenario, learned, revision, onToggleLearn, onToggleRevision }) {
  const [open, setOpen] = useState(false);

  function handleLearn() {
    onToggleLearn();
    if (!learned) toast('Marked as learned!', 'success');
  }

  function handleRevision() {
    onToggleRevision();
    if (!revision) toast('Added to revision queue.', 'info');
  }

  return (
    <div className={[
      'iq-card',
      open      ? 'iq-open'     : '',
      learned   ? 'iq-learned'  : '',
      revision  ? 'iq-revision' : '',
    ].filter(Boolean).join(' ')}>
      {scenario && <p className="iq-scenario">{scenario}</p>}
      <button
        type="button"
        className="iq-trigger"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <span>{question}</span>
        {learned && <span className="iq-badge iq-badge--learned" aria-label="Learned">✓</span>}
        {revision && !learned && <span className="iq-badge iq-badge--revision" aria-label="In revision">↻</span>}
        <span className="iq-chevron" aria-hidden="true" />
      </button>
      {open && (
        <div className="iq-answer">
          <p>{answer}</p>
          <div className="iq-actions">
            <button
              type="button"
              className={`iq-action-btn${learned ? ' iq-action-btn--learned' : ''}`}
              onClick={handleLearn}
            >
              {learned ? '✓ Learned' : '✓ Mark learned'}
            </button>
            <button
              type="button"
              className={`iq-action-btn${revision ? ' iq-action-btn--revision' : ''}`}
              onClick={handleRevision}
            >
              {revision ? '↻ In revision' : '↻ Revisit later'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
