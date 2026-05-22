/**
 * Notification Center — bell icon in the header.
 * Shows escalations from sim store, recent activity, and achievements.
 */
import { memo, useState, useCallback, useRef, useEffect } from 'react';
import useSimulationStore from '../../store/simulationStore.js';

function timeSince(ts) {
  if (!ts) return '';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function urgencyIcon(urgency) {
  if (urgency === 'critical') return '🔴';
  if (urgency === 'high')     return '🟠';
  if (urgency === 'warning')  return '🟡';
  if (urgency === 'success')  return '✅';
  return '💬';
}

export const NotificationCenter = memo(function NotificationCenter({ activityLog = [] }) {
  const [open, setOpen] = useState(false);
  const panelRef        = useRef(null);

  const teamMessages        = useSimulationStore(s => s.teamMessages);
  const escalations         = useSimulationStore(s => s.escalations);
  const acknowledgeEsc      = useSimulationStore(s => s.acknowledgeEscalation);
  const activeIncidents     = useSimulationStore(s => s.activeIncidents);
  const openInvestigation   = useSimulationStore(s => s.openInvestigation);

  const unreadEsc      = escalations.filter(e => !e.acknowledged).length;
  const unreadMessages = teamMessages.filter(m => m.urgency === 'critical' || m.urgency === 'high').length;
  const totalUnread    = Math.min(unreadEsc + unreadMessages, 99);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (!panelRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleAckEsc = useCallback((id, e) => {
    e.stopPropagation();
    acknowledgeEsc(id);
  }, [acknowledgeEsc]);

  const handleInvestigate = useCallback((incidentId) => {
    const inc = activeIncidents.find(i => i.incidentId === incidentId);
    if (inc) { openInvestigation(inc.uid); setOpen(false); }
  }, [activeIncidents, openInvestigation]);

  // Merge escalations + recent team messages into one feed
  const feedItems = [
    ...escalations.slice(0, 5).map(e => ({
      id:        e.id,
      type:      'escalation',
      urgency:   e.level >= 3 ? 'critical' : e.level >= 2 ? 'high' : 'warning',
      author:    e.author,
      avatar:    e.avatar,
      text:      e.message,
      timestamp: e.timestamp,
      acked:     e.acknowledged,
      incidentId: e.incidentId,
    })),
    ...teamMessages.slice(0, 8).map(m => ({
      id:        m.id,
      type:      'message',
      urgency:   m.urgency || 'info',
      author:    m.author,
      avatar:    m.avatar,
      text:      m.text,
      timestamp: m.timestamp,
      acked:     true,
    })),
  ].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 12);

  // Recent learning activity
  const recentActivity = activityLog.slice(0, 5);

  return (
    <div className="notif-root" ref={panelRef}>
      <button
        type="button"
        className={`notif-bell${open ? ' notif-bell--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications${totalUnread > 0 ? `, ${totalUnread} unread` : ''}`}
      >
        <span className="notif-bell-icon" aria-hidden="true">🔔</span>
        {totalUnread > 0 && (
          <span className="notif-badge" aria-hidden="true">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            {unreadEsc > 0 && (
              <span className="notif-panel-unread">{unreadEsc} escalation{unreadEsc !== 1 ? 's' : ''}</span>
            )}
          </div>

          {feedItems.length === 0 && recentActivity.length === 0 && (
            <div className="notif-empty">
              <span className="notif-empty-icon">🔕</span>
              <p>No notifications yet.</p>
              <p className="notif-empty-sub">Launch a live incident to see escalations here.</p>
            </div>
          )}

          {feedItems.length > 0 && (
            <div className="notif-section">
              <p className="notif-section-label">Team Messages & Escalations</p>
              {feedItems.map(item => (
                <div
                  key={item.id}
                  className={`notif-item notif-item--${item.urgency}${item.acked ? '' : ' notif-item--unread'}`}
                  onClick={item.incidentId ? () => handleInvestigate(item.incidentId) : undefined}
                  style={item.incidentId ? { cursor: 'pointer' } : undefined}
                >
                  <span className="notif-item-avatar">{item.avatar || urgencyIcon(item.urgency)}</span>
                  <div className="notif-item-body">
                    <div className="notif-item-author-row">
                      <span className="notif-item-author">{item.author}</span>
                      {!item.acked && item.type === 'escalation' && (
                        <button
                          type="button"
                          className="notif-ack-btn"
                          onClick={(e) => handleAckEsc(item.id, e)}
                          title="Acknowledge"
                        >
                          ✓
                        </button>
                      )}
                      <span className="notif-item-time">{timeSince(item.timestamp)}</span>
                    </div>
                    <p className="notif-item-text">{item.text}</p>
                    {item.incidentId && !item.acked && (
                      <span className="notif-investigate-hint">Click to investigate →</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {recentActivity.length > 0 && (
            <div className="notif-section">
              <p className="notif-section-label">Recent Activity</p>
              {recentActivity.map((item, i) => (
                <div key={i} className="notif-activity-row">
                  <span className="notif-activity-dot" />
                  <span className="notif-activity-text">{item.text}</span>
                  {item.xp > 0 && <span className="notif-activity-xp">+{item.xp} XP</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default NotificationCenter;
