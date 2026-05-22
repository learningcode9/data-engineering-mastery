import { cn } from '../../utils/cn.js';

export function ProgressBar({ percent, label, className, size = 'md', showValue = false }) {
  const numeric = typeof percent === 'number' ? percent : parseInt(percent) || 0;
  const width = typeof percent === 'number' ? `${Math.max(0, Math.min(100, percent))}%` : percent;

  return (
    <div className={cn('ds-progress-wrap', showValue && 'ds-progress-wrap--with-value', className)}>
      <div
        className={cn('progress-track ds-progress', `ds-progress--${size}`)}
        role="progressbar"
        aria-valuenow={numeric}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="ds-progress-fill" style={{ width }} />
      </div>
      {showValue && <span className="ds-progress-value">{numeric}%</span>}
    </div>
  );
}
