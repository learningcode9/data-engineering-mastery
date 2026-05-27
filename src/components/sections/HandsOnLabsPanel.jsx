import { memo, useMemo, useState } from 'react';
import { AppCard, Badge, SectionHeader, StatPill } from '../ui/design-system.jsx';
import { buildLabs, debuggingDrills, productionChecklists } from '../../data/handsOnLabs.js';

const LAB_CATEGORIES = [
  {
    id: 'build',
    label: 'Build Labs',
    description: 'Real implementation work: pipelines, transformations, merges, tables, Spark, and CI/CD.',
    count: buildLabs.length,
    variant: 'success',
  },
  {
    id: 'debug',
    label: 'Debugging Drills',
    description: 'Practice the incident-response work Azure Data Engineers do when production breaks.',
    count: debuggingDrills.length,
    variant: 'warning',
  },
  {
    id: 'checklist',
    label: 'Production Checklists',
    description: 'Reusable release, validation, performance, and cost controls for go-live readiness.',
    count: productionChecklists.length,
    variant: 'info',
  },
];

const LAB_SETS = {
  build: buildLabs,
  debug: debuggingDrills,
  checklist: productionChecklists,
};

function countLabel(categoryId) {
  return `${LAB_SETS[categoryId]?.length ?? 0} items`;
}

function ServiceGrid({ services }) {
  if (!services?.length) return null;
  return (
    <div className="hol-service-grid">
      {services.map(service => (
        <div key={service.name} className="hol-service-card">
          <strong>{service.name}</strong>
          <p>{service.why}</p>
        </div>
      ))}
    </div>
  );
}

function BulletList({ items, className = '' }) {
  if (!items?.length) return null;
  return (
    <ul className={`hol-bullet-list ${className}`.trim()} role="list">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`}>
          <span className="hol-bullet-mark" aria-hidden="true">•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }) {
  if (!items?.length) return null;
  return (
    <ol className="hol-step-list">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`}>
          <span className="hol-step-index">{idx + 1}</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

function ChecklistList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="hol-checklist-list" role="list">
      {items.map((item, idx) => (
        <li key={`${item}-${idx}`}>
          <span className="hol-checkmark" aria-hidden="true">✓</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function BuildDetail({ item }) {
  return (
    <>
      <div className="hol-detail-hero">
        <div>
          <p className="hol-section-label">Business scenario</p>
          <p className="hol-detail-copy">{item.scenario}</p>
        </div>
        <div>
          <p className="hol-section-label">Task objective</p>
          <p className="hol-detail-copy">{item.objective}</p>
        </div>
      </div>

      <div className="hol-detail-section">
        <p className="hol-section-label">Azure service mapping</p>
        <ServiceGrid services={item.services} />
      </div>

      <div className="hol-detail-section">
        <p className="hol-section-label">Step-by-step execution</p>
        <NumberedList items={item.steps} />
      </div>

      <div className="hol-detail-columns">
        <div className="hol-detail-section">
          <p className="hol-section-label">Validation</p>
          <ChecklistList items={item.validation} />
        </div>
        <div className="hol-detail-section">
          <p className="hol-section-label">Production checklist</p>
          <ChecklistList items={item.productionChecklist} />
        </div>
      </div>

      <div className="hol-detail-columns">
        <div className="hol-detail-section">
          <p className="hol-section-label">Common mistakes</p>
          <BulletList items={item.commonMistakes} />
        </div>
        <div className="hol-detail-section">
          <p className="hol-section-label">Optimization tips</p>
          <BulletList items={item.optimizationTips} />
        </div>
      </div>

      <div className="hol-detail-section">
        <p className="hol-section-label">Interview angle</p>
        <p className="hol-detail-copy">{item.interviewAngle}</p>
      </div>
    </>
  );
}

function DebugDetail({ item }) {
  return (
    <>
      <div className="hol-detail-columns">
        <div className="hol-detail-section">
          <p className="hol-section-label">Symptoms</p>
          <BulletList items={item.symptoms} />
        </div>
        <div className="hol-detail-section">
          <p className="hol-section-label">Logs / errors</p>
          <BulletList items={item.logs} />
        </div>
      </div>

      <div className="hol-detail-section">
        <p className="hol-section-label">Investigation path</p>
        <NumberedList items={item.investigation} />
      </div>

      <div className="hol-detail-columns">
        <div className="hol-detail-section">
          <p className="hol-section-label">Root cause</p>
          <p className="hol-detail-copy">{item.rootCause}</p>
        </div>
        <div className="hol-detail-section">
          <p className="hol-section-label">Fix</p>
          <p className="hol-detail-copy">{item.fix}</p>
        </div>
      </div>

      <div className="hol-detail-section">
        <p className="hol-section-label">Prevention strategy</p>
        <p className="hol-detail-copy">{item.prevention}</p>
      </div>
    </>
  );
}

function ChecklistDetail({ item }) {
  return (
    <>
      <div className="hol-detail-section">
        <p className="hol-section-label">Why it matters</p>
        <p className="hol-detail-copy">Use this checklist before releases, production cutovers, or when a pipeline is close to go-live.</p>
      </div>
      <div className="hol-detail-section">
        <p className="hol-section-label">Checklist items</p>
        <ChecklistList items={item.items} />
      </div>
      <div className="hol-detail-section">
        <p className="hol-section-label">Interview angle</p>
        <p className="hol-detail-copy">Interviewers want to hear how you prevent incidents, validate releases, and keep the platform stable after deployment.</p>
      </div>
    </>
  );
}

function CategoryDetail({ categoryId, item }) {
  if (!item) return null;
  if (categoryId === 'debug') return <DebugDetail item={item} />;
  if (categoryId === 'checklist') return <ChecklistDetail item={item} />;
  return <BuildDetail item={item} />;
}

const HandsOnLabsPanel = memo(function HandsOnLabsPanel() {
  const [activeCategory, setActiveCategory] = useState('build');
  const items = LAB_SETS[activeCategory] ?? buildLabs;
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');

  const activeItem = useMemo(
    () => items.find(item => item.id === activeId) ?? items[0] ?? null,
    [items, activeId]
  );

  const activeMeta = LAB_CATEGORIES.find(cat => cat.id === activeCategory);

  return (
    <section className="hands-on-labs-section section" id="hands-on-labs">
      <SectionHeader
        eyebrow="Practice simulator"
        title="Hands-On Labs & Real Tasks"
        description="Work through the kinds of tasks Azure Data Engineers handle every week: build, debug, release, and validate."
        badge={<Badge variant="success">Inline practice</Badge>}
      />

      <div className="hol-summary-row">
        <StatPill label="Build labs" value={buildLabs.length} icon="▣" variant="success" />
        <StatPill label="Debug drills" value={debuggingDrills.length} icon="⚠" variant="warning" />
        <StatPill label="Checklists" value={productionChecklists.length} icon="✓" variant="info" />
      </div>

      <div className="hol-tabs" role="tablist" aria-label="Hands-on lab categories">
        {LAB_CATEGORIES.map(category => {
          const active = category.id === activeCategory;
          return (
            <button
              key={category.id}
              type="button"
              className={`hol-tab${active ? ' hol-tab--active' : ''}`}
              onClick={() => {
                setActiveCategory(category.id);
                setActiveId(LAB_SETS[category.id]?.[0]?.id ?? '');
              }}
              aria-pressed={active}
            >
              <span>{category.label}</span>
              <Badge variant={category.variant}>{category.count}</Badge>
            </button>
          );
        })}
      </div>

      <div className="hol-intro-copy">
        <p>{activeMeta?.description}</p>
        <span>{countLabel(activeCategory)}</span>
      </div>

      <div className="hol-layout">
        <div className="hol-list-column">
          {items.map(item => {
            const active = item.id === activeItem?.id;
            const subtitle = activeCategory === 'build'
              ? item.scenario
              : activeCategory === 'debug'
                ? item.symptoms?.[0] ?? ''
                : item.items?.[0] ?? '';

            return (
              <AppCard
                key={item.id}
                as="button"
                type="button"
                interactive
                compact
                className={`hol-list-item${active ? ' hol-list-item--active' : ''}`}
                onClick={() => setActiveId(item.id)}
                aria-pressed={active}
              >
                <div className="hol-list-item-header">
                  <div>
                    <p className="hol-list-item-title">{item.title}</p>
                    <p className="hol-list-item-subtitle">{subtitle}</p>
                  </div>
                  <Badge variant={activeCategory === 'debug' ? 'warning' : activeCategory === 'checklist' ? 'info' : 'success'}>
                    {item.badge ?? 'Task'}
                  </Badge>
                </div>
                <div className="hol-list-item-footer">
                  <span>{activeCategory === 'build' ? `${item.steps.length} steps` : activeCategory === 'debug' ? `${item.investigation.length} investigation steps` : `${item.items.length} checks`}</span>
                  <span>Open detail →</span>
                </div>
              </AppCard>
            );
          })}
        </div>

        <AppCard className="hol-detail-card">
          <div className="hol-detail-header">
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>
                {activeCategory === 'build' ? 'Build task' : activeCategory === 'debug' ? 'Debugging drill' : 'Production checklist'}
              </p>
              <h3>{activeItem?.title}</h3>
            </div>
            <Badge variant={activeCategory === 'debug' ? 'warning' : activeCategory === 'checklist' ? 'info' : 'success'}>
              {activeItem?.badge ?? 'Hands-on'}
            </Badge>
          </div>

          <CategoryDetail categoryId={activeCategory} item={activeItem} />
        </AppCard>
      </div>
    </section>
  );
});

export default HandsOnLabsPanel;
