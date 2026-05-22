import { memo } from 'react';
import { cn } from '../../utils/cn.js';

export const EmptyState = memo(function EmptyState({
  icon,
  title,
  body,
  action,
  onAction,
  variant = 'default', // default | compact
  className,
}) {
  return (
    <div className={cn('empty-state', `empty-state--${variant}`, 'ds-empty-state', className)} role="status">
      <div className="empty-state-icon" aria-hidden="true">{icon}</div>
      <p className="empty-state-title">{title}</p>
      {body && <p className="empty-state-body">{body}</p>}
      {action && onAction && (
        <button type="button" className="empty-state-action ds-button ds-button--secondary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
});
