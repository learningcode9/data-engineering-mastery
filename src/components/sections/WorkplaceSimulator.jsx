import { memo, useState } from 'react';
import { AppCard, Badge, StatPill } from '../ui/design-system.jsx';
import { workplaceSimulators } from '../../data/workplaceSimulators.js';
import { AdfPipelineSimulator } from './AdfPipelineSimulator.jsx';

const ADF_ITEM = { id: 'adf-api-ingestion', title: 'Customer Events API Ingestion' };

function SimulatorCard({ sim, active, onSelect }) {
  const isAvailable = sim.status === 'available';
  const variant = isAvailable ? 'success' : sim.status === 'next' ? 'info' : 'muted';
  return (
    <AppCard
      as="button"
      type="button"
      interactive={isAvailable}
      compact
      className={`workplace-sim-card${active ? ' workplace-sim-card--active' : ''}${!isAvailable ? ' workplace-sim-card--locked' : ''}`}
      onClick={() => isAvailable && onSelect(sim.id)}
      aria-pressed={active}
      aria-disabled={!isAvailable}
    >
      <div className="workplace-sim-card-top">
        <span className="workplace-sim-card-icon" aria-hidden="true">{sim.icon}</span>
        <Badge variant={variant} size="sm">{sim.statusLabel}</Badge>
      </div>
      <strong>{sim.title}</strong>
      <p>{sim.summary}</p>
      <div className="workplace-sim-card-chips" aria-hidden="true">
        {sim.tools.map(tool => (
          <span key={tool} className="workplace-sim-chip">{tool}</span>
        ))}
      </div>
      <span className="workplace-sim-card-cta">
        {isAvailable ? (active ? 'Selected — open it in your inbox below →' : 'Open in your inbox below →') : 'Not yet available'}
      </span>
    </AppCard>
  );
}

const WorkplaceSimulator = memo(function WorkplaceSimulator() {
  const [activeSim, setActiveSim] = useState('adf');

  return (
    <section className="workplace-section section" id="workplace">
      <div className="workplace-shell">
        <div className="workplace-header">
          <div className="workplace-heading">
            <p className="eyebrow">Virtual workplace</p>
            <h2>Workplace Simulator</h2>
            <p>Open your virtual office laptop and practice real Azure Data Engineering work — ticket in, working pipeline out.</p>
          </div>
          <div className="workplace-stats">
            <StatPill label="Live simulators" value={String(workplaceSimulators.filter(s => s.status === 'available').length)} icon="▣" variant="success" />
          </div>
        </div>

        <div className="workplace-sim-grid" role="list" aria-label="Workplace simulators">
          {workplaceSimulators.map(sim => (
            <SimulatorCard
              key={sim.id}
              sim={sim}
              active={activeSim === sim.id}
              onSelect={setActiveSim}
            />
          ))}
        </div>

        {/* hands-on-labs-section class activates the scoped .adf-sim-* styles here too */}
        <div className="workplace-active-sim hands-on-labs-section">
          <AdfPipelineSimulator item={ADF_ITEM} />
        </div>
      </div>
    </section>
  );
});

export default WorkplaceSimulator;
