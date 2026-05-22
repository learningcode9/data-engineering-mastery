import { memo, useEffect } from 'react';
import { RARITY } from '../../hooks/useAchievements.js';

const AchievementToast = memo(function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500);
    return () => clearTimeout(t);
  }, [achievement, onDismiss]);

  const rarity = RARITY[achievement.rarity];

  return (
    <div className="achievement-toast" role="status" aria-live="polite">
      <div className="achievement-toast-glow" style={{ '--ach-color': rarity.color }} />
      <div className="achievement-toast-icon" style={{ '--ach-color': rarity.color }}>
        {achievement.icon}
      </div>
      <div className="achievement-toast-body">
        <div className="achievement-toast-top">
          <span className="achievement-toast-label">Achievement unlocked</span>
          <span className="achievement-toast-rarity" style={{ color: rarity.color }}>
            {rarity.label}
          </span>
        </div>
        <p className="achievement-toast-name">{achievement.name}</p>
        <p className="achievement-toast-desc">{achievement.desc}</p>
      </div>
      <button
        type="button"
        className="achievement-toast-close"
        onClick={onDismiss}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
});

export default AchievementToast;
