import { memo, useMemo } from 'react';
import useSimulationStore from '../../store/simulationStore.js';

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatDollar(amount) {
  if (Math.abs(amount) >= 1000) {
    return `$${(Math.abs(amount) / 1000).toFixed(1)}K`;
  }
  return `$${Math.abs(amount).toFixed(0)}`;
}

function trustColor(pct) {
  if (pct > 70) return '#4ade80';
  if (pct >= 50) return '#f59e0b';
  return '#f87171';
}

function healthColor(status) {
  if (status === 'ok') return '#4ade80';
  if (status === 'warning') return '#f59e0b';
  return '#f87171';
}

// ─── sub-components ───────────────────────────────────────────────────────────

function Dot({ variant }) {
  return <span className={`sim-hud-dot sim-hud-dot--${variant}`} />;
}

function Segment({ label, children, clickable, onClick, pulse }) {
  return (
    <div
      className={`sim-hud-segment${clickable ? ' sim-hud-segment--clickable' : ''}${pulse ? ' sim-hud-pulse' : ''}`}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => e.key === 'Enter' && onClick?.() : undefined}
    >
      {label && <span className="sim-hud-label">{label}</span>}
      {children}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export const SimulationHUD = memo(function SimulationHUD({ onOpenIncidents, onOpenInvestigation }) {
  const activeIncidents    = useSimulationStore(s => s.activeIncidents);
  const resolvedCount      = useSimulationStore(s => s.resolvedCount);
  const p1ResolvedCount    = useSimulationStore(s => s.p1ResolvedCount);
  const stakeholderTrust   = useSimulationStore(s => s.stakeholderTrust);
  const cloudCostDelta     = useSimulationStore(s => s.cloudCostDelta);
  const simXP              = useSimulationStore(s => s.simXP);
  const simLevel           = useSimulationStore(s => s.simLevel);
  const pipelineHealth     = useSimulationStore(s => s.pipelineHealth);
  const escalations        = useSimulationStore(s => s.escalations);

  const p1Count = useMemo(
    () => activeIncidents.filter(i => i.severity === 'P1').length,
    [activeIncidents]
  );

  const healthSummary = useMemo(() => {
    const all = Object.values(pipelineHealth);
    const failed = all.filter(v => v === 'failed').length;
    const degraded = all.filter(v => v === 'degraded').length;
    const total = all.length;
    if (total === 0) return { status: 'ok', pct: 100 };
    const healthyPct = Math.round(((total - failed - degraded) / total) * 100);
    if (failed > 0) return { status: 'critical', pct: healthyPct };
    if (degraded > 0) return { status: 'warning', pct: healthyPct };
    return { status: 'ok', pct: 100 };
  }, [pipelineHealth]);

  const businessImpact = useMemo(() => {
    const hourlyImpact = {
      P1: { dollar: 15000 },
      P2: { dollar: 5000 },
      P3: { dollar: 1000 },
    };
    return activeIncidents.reduce((total, inc) => (
      total + (hourlyImpact[inc.severity]?.dollar ?? 0)
    ), 0);
  }, [activeIncidents]);

  const careerRole = useMemo(() => {
    if (p1ResolvedCount >= 10 || simLevel >= 5) return 'Principal Engineer';
    if (resolvedCount >= 15 || simLevel >= 3) return 'Senior Engineer';
    if (resolvedCount >= 5 || simLevel >= 2) return 'Mid-Level Engineer';
    return 'Junior Engineer';
  }, [p1ResolvedCount, resolvedCount, simLevel]);

  const unackEscalations = useMemo(
    () => escalations.filter(e => !e.acknowledged),
    [escalations]
  );

  // only render once simulation has started
  if (activeIncidents.length === 0 && resolvedCount === 0) return null;

  const activeCount = activeIncidents.length;
  const hasP1       = p1Count > 0;
  const hasActive   = activeCount > 0;

  // ── incident status ──────────────────────────────────────────────────────────
  let incidentDot, incidentText;
  if (hasP1) {
    incidentDot  = 'red';
    incidentText = `${p1Count} P1 ACTIVE`;
  } else if (hasActive) {
    incidentDot  = 'amber';
    incidentText = `${activeCount} ACTIVE`;
  } else {
    incidentDot  = 'green';
    incidentText = 'ALL CLEAR';
  }

  // ── pipeline health ──────────────────────────────────────────────────────────
  const pipelineColor = healthColor(healthSummary.status);

  // ── trust score ──────────────────────────────────────────────────────────────
  const trust = Math.round(stakeholderTrust ?? 85);

  // ── business impact ──────────────────────────────────────────────────────────
  const impactPerHour = businessImpact;

  // ── cloud cost ───────────────────────────────────────────────────────────────
  const costPositive = cloudCostDelta >= 0;

  // ── escalation alert ─────────────────────────────────────────────────────────
  const hasUnackEscalations = unackEscalations.length > 0;

  return (
    <div className="sim-hud">

      {/* 1. Production Status label */}
      <Segment>
        <span className="sim-hud-label" style={{ letterSpacing: '0.08em' }}>
          PRODUCTION STATUS
        </span>
      </Segment>

      {/* 2. Active Incidents */}
      <Segment
        clickable
        onClick={onOpenIncidents}
        pulse={hasP1}
      >
        <Dot variant={incidentDot} />
        <span className="sim-hud-value">{incidentText}</span>
      </Segment>

      {/* 3. Pipeline Health */}
      <Segment>
        <span className="sim-hud-label">Pipelines:&nbsp;</span>
        <span className="sim-hud-value" style={{ color: pipelineColor }}>
          {healthSummary.pct}% healthy
        </span>
      </Segment>

      {/* 4. Trust Score */}
      <Segment>
        <span className="sim-hud-label">Trust:&nbsp;</span>
        <span className="sim-hud-value" style={{ color: trustColor(trust) }}>
          {trust}%
        </span>
      </Segment>

      {/* 5. Business Impact */}
      <Segment>
        <span className="sim-hud-label">Impact:&nbsp;</span>
        {impactPerHour > 0 ? (
          <span className="sim-hud-value" style={{ color: '#f87171' }}>
            ~{formatDollar(impactPerHour)}/hr
          </span>
        ) : (
          <span className="sim-hud-value" style={{ color: '#4ade80' }}>
            $0 impact
          </span>
        )}
      </Segment>

      {/* 6. Cloud Cost */}
      <Segment>
        <span className="sim-hud-label">Cloud:&nbsp;</span>
        {costPositive ? (
          <span className="sim-hud-value" style={{ color: '#f87171' }}>
            +{formatDollar(cloudCostDelta)}
          </span>
        ) : (
          <span className="sim-hud-value" style={{ color: '#4ade80' }}>
            -{formatDollar(cloudCostDelta)} saved
          </span>
        )}
      </Segment>

      {/* 7. Career Role */}
      <Segment>
        <span className="sim-hud-badge">{careerRole}</span>
      </Segment>

      {/* 8. Sim XP */}
      <Segment>
        <span className="sim-hud-label">XP:&nbsp;</span>
        <span className="sim-hud-value">{simXP}</span>
      </Segment>

      {/* Escalation alert (conditional) */}
      {hasUnackEscalations && (
        <Segment
          clickable
          onClick={onOpenInvestigation}
          pulse
        >
          <Dot variant="red" />
          <span className="sim-hud-value" style={{ color: '#f87171' }}>
            {unackEscalations.length} ESCALATION{unackEscalations.length > 1 ? 'S' : ''}
          </span>
        </Segment>
      )}

    </div>
  );
});

export default SimulationHUD;
