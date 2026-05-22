import { memo } from 'react';

// CSS grid 0fr→1fr gives a perfectly proportional height animation
// regardless of content size — unlike max-height which feels instant on short content.
export const CollapsiblePanel = memo(function CollapsiblePanel({ open, children, label }) {
  return (
    <div
      className={`collapsible-body${open ? ' collapsible-body--open' : ''}`}
      aria-hidden={!open}
      role="region"
      aria-label={label}
    >
      <div className="collapsible-inner">
        {children}
      </div>
    </div>
  );
});
