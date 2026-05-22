// Reusable loading skeleton components — matches the app's existing skeleton CSS classes

export function SkeletonLine({ width = '100%', height = '1rem' }) {
  return (
    <div
      className="skeleton"
      style={{ width, height, borderRadius: '4px', marginBottom: '0.5rem' }}
    />
  );
}

export function SkeletonCard({ lines = 3, hasTitle = true }) {
  return (
    <div className="skeleton-card" style={{ padding: '1rem', borderRadius: '8px' }}>
      {hasTitle && <SkeletonLine width="60%" height="1.25rem" />}
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={i === lines - 1 ? '75%' : '100%'} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ cols = 3, rows = 2 }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '1rem',
      }}
    >
      {Array.from({ length: cols * rows }).map((_, i) => (
        <SkeletonCard key={i} lines={2} />
      ))}
    </div>
  );
}

export function SkeletonSection() {
  return (
    <section className="section section-loading" aria-label="Loading">
      <SkeletonLine width="40%" height="1.5rem" />
      <SkeletonLine width="70%" />
      <SkeletonGrid cols={3} rows={1} />
    </section>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div style={{ overflow: 'hidden', borderRadius: '6px' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: '1rem', padding: '0.75rem', background: 'var(--bg-secondary, #f5f5f5)' }}>
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} width={`${100 / cols}%`} height="0.875rem" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: 'flex', gap: '1rem', padding: '0.75rem', borderTop: '1px solid var(--border-color, #eee)' }}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} width={`${100 / cols}%`} height="0.875rem" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Full-page loading state
export function PageLoader({ message = 'Loading...' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        gap: '1rem',
        color: 'var(--text-muted, #888)',
        fontSize: '0.9rem',
      }}
    >
      <div className="loading-spinner" style={{ width: '2rem', height: '2rem' }} />
      <span>{message}</span>
    </div>
  );
}
