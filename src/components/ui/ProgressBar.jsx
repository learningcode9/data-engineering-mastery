export function ProgressBar({ percent, label }) {
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={parseInt(percent)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div style={{ width: percent }} />
    </div>
  );
}
