import { memo } from 'react';
import { cn } from '../../utils/cn.js';
import { EmptyState as BaseEmptyState } from './EmptyState.jsx';
import { ProgressBar as BaseProgressBar } from './ProgressBar.jsx';

export const AppCard = memo(function AppCard({
  as: Component = 'section',
  className,
  interactive = false,
  compact = false,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'ds-card',
        interactive && 'ds-card--interactive',
        compact && 'ds-card--compact',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
});

export const PageContainer = memo(function PageContainer({ className, children, ...props }) {
  return (
    <div className={cn('ds-page-container', className)} {...props}>
      {children}
    </div>
  );
});

export const SectionHeader = memo(function SectionHeader({
  eyebrow,
  title,
  description,
  badge,
  action,
  className,
  headingLevel: Heading = 'h2',
}) {
  return (
    <div className={cn('ds-section-header', className)}>
      <div className="ds-section-header-copy">
        {eyebrow && <p className="eyebrow ds-section-eyebrow">{eyebrow}</p>}
        <Heading>{title}</Heading>
        {description && <p className="ds-section-description">{description}</p>}
      </div>
      {(badge || action) && (
        <div className="ds-section-actions">
          {badge}
          {action}
        </div>
      )}
    </div>
  );
});

export const Badge = memo(function Badge({
  variant = 'muted',
  size = 'md',
  className,
  children,
  ...props
}) {
  return (
    <span className={cn('ds-badge', `ds-badge--${variant}`, `ds-badge--${size}`, className)} {...props}>
      {children}
    </span>
  );
});

export const PrimaryButton = memo(function PrimaryButton({ className, children, ...props }) {
  return (
    <button type="button" className={cn('ds-button ds-button--primary', className)} {...props}>
      {children}
    </button>
  );
});

export const SecondaryButton = memo(function SecondaryButton({ className, children, ...props }) {
  return (
    <button type="button" className={cn('ds-button ds-button--secondary', className)} {...props}>
      {children}
    </button>
  );
});

export const MetricCard = memo(function MetricCard({
  label,
  value,
  description,
  icon,
  variant = 'muted',
  className,
}) {
  return (
    <AppCard as="article" compact className={cn('ds-metric-card', `ds-metric-card--${variant}`, className)}>
      {icon && <span className="ds-metric-icon" aria-hidden="true">{icon}</span>}
      <span className="ds-metric-value">{value}</span>
      <span className="ds-metric-label">{label}</span>
      {description && <p className="ds-metric-description">{description}</p>}
    </AppCard>
  );
});

export const StatPill = memo(function StatPill({
  label,
  value,
  icon,
  variant = 'muted',
  className,
}) {
  return (
    <span className={cn('ds-stat-pill', `ds-stat-pill--${variant}`, className)}>
      {icon && <span aria-hidden="true">{icon}</span>}
      <strong>{value}</strong>
      <span>{label}</span>
    </span>
  );
});

export const SearchInput = memo(function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  inputClassName,
  ...props
}) {
  return (
    <label className={cn('ds-search-input', className)}>
      <span aria-hidden="true">⌕</span>
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={inputClassName}
        {...props}
      />
    </label>
  );
});

export const SidebarItem = memo(function SidebarItem({
  active,
  icon,
  label,
  progress,
  compact,
  href,
  onClick,
}) {
  return (
    <a
      href={href}
      className={cn('ds-sidebar-item', active && 'active')}
      aria-current={active ? 'page' : undefined}
      data-tooltip={label}
      onClick={onClick}
    >
      <span className="nav-icon ds-sidebar-icon" aria-hidden="true">{icon}</span>
      {!compact && <span className="nav-label">{label}</span>}
      {!compact && progress > 0 && (
        <Badge variant="success" size="sm" aria-label={`${progress}% complete`}>
          {progress}%
        </Badge>
      )}
    </a>
  );
});

export const ProgressBar = BaseProgressBar;
export const EmptyState = BaseEmptyState;
