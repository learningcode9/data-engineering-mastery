import { memo } from 'react';

const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

export const ToastContainer = memo(function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container" aria-live="polite" aria-atomic="false">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast--${t.type}`} role="status">
          <span className="toast-icon" aria-hidden="true">{ICONS[t.type] ?? ICONS.info}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
});
