import { memo, useState } from 'react';

// ── Existing diagram data (kept for backward compatibility) ────────────────────

const DIAGRAMS = [
  {
    id: 'medallion',
    title: 'Medallion Architecture',
    subtitle: 'Bronze → Silver → Gold',
    description: 'Industry-standard lakehouse pattern. Raw data lands in Bronze, cleansed in Silver, aggregated in Gold for BI.',
    layers: [
      { name: 'Bronze', color: '#cd7f32', bg: '#cd7f3218', icon: '📥', desc: 'Raw ingestion · Schema-on-read · Append-only · Auto Loader' },
      { name: 'Silver', color: '#9aa5a8', bg: '#9aa5a818', icon: '🔧', desc: 'Cleansed · Deduplicated · Type-cast · SCD Type 2' },
      { name: 'Gold', color: '#d4a800', bg: '#d4a80018', icon: '📊', desc: 'Aggregated · Star schema · BI-ready · Z-ORDERed' },
    ],
    flow: ['ADLS Raw Files', '→', 'Bronze Delta', '→', 'Silver Delta', '→', 'Gold Delta', '→', 'Power BI'],
    tools: ['Delta Lake', 'Databricks', 'Auto Loader', 'ADF'],
  },
  {
    id: 'adf-pipeline',
    title: 'ADF Pipeline Pattern',
    subtitle: 'Parameterised orchestration',
    description: 'Azure Data Factory pipeline with Copy Activity, ForEach for multi-table ingestion, and error handling.',
    nodes: [
      { id: 'trigger', label: 'Schedule Trigger', type: 'trigger', icon: '⏱' },
      { id: 'lookup', label: 'Lookup Tables', type: 'activity', icon: '🔍' },
      { id: 'foreach', label: 'ForEach Table', type: 'container', icon: '🔁' },
      { id: 'copy', label: 'Copy Activity', type: 'activity', icon: '📋' },
      { id: 'notebook', label: 'Databricks Notebook', type: 'activity', icon: '📓' },
      { id: 'alert', label: 'On Failure Alert', type: 'error', icon: '🔔' },
    ],
    tools: ['Azure Data Factory', 'ADLS Gen2', 'Databricks', 'Azure Monitor'],
  },
  {
    id: 'etl-flow',
    title: 'ETL Data Flow',
    subtitle: 'Extract → Transform → Load',
    description: 'Classic ETL pattern with staging, transformation logic, data quality checks, and load to target.',
    stages: [
      { label: 'Extract', color: '#3776ab', items: ['Source DB', 'REST API', 'File System', 'Event Stream'] },
      { label: 'Staging', color: '#7c3aed', items: ['Raw landing zone', 'Schema validation', 'Deduplication'] },
      { label: 'Transform', color: '#f59e0b', items: ['Business rules', 'Lookups/Joins', 'Aggregations', 'DQ checks'] },
      { label: 'Load', color: '#2f756e', items: ['Data Warehouse', 'Data Lake', 'Delta Lake', 'Reporting DB'] },
    ],
    tools: ['Python', 'SQL', 'PySpark', 'ADF'],
  },
  {
    id: 'streaming',
    title: 'Streaming Architecture',
    subtitle: 'Event-driven real-time pipeline',
    description: 'Kafka-based streaming pipeline with Spark Structured Streaming, windowed aggregations, and Delta Lake sink.',
    flow: [
      { label: 'Producers', items: ['Web App', 'Mobile', 'IoT Sensors'], color: '#0ea5e9' },
      { label: 'Message Bus', items: ['Kafka Topic A', 'Kafka Topic B', 'Event Hubs'], color: '#231f20' },
      { label: 'Stream Processing', items: ['Spark Streaming', 'Window Aggregation', 'Watermarking'], color: '#e25a1c' },
      { label: 'Sink', items: ['Delta Silver', 'Delta Gold', 'Redis Cache', 'API Response'], color: '#2f756e' },
    ],
    tools: ['Apache Kafka', 'Spark Streaming', 'Delta Lake', 'Azure Event Hubs'],
  },
  {
    id: 'batch-vs-streaming',
    title: 'Batch vs Streaming',
    subtitle: 'Choosing the right pattern',
    description: 'Comparison guide for choosing between batch processing and streaming based on latency, complexity, and use case.',
    comparison: [
      { aspect: 'Latency', batch: 'Hours → Daily', streaming: 'Seconds → Minutes' },
      { aspect: 'Complexity', batch: 'Lower', streaming: 'Higher' },
      { aspect: 'Cost', batch: 'Lower (off-peak)', streaming: 'Higher (always-on)' },
      { aspect: 'Use case', batch: 'Reporting, DW loads', streaming: 'Fraud detection, alerts' },
      { aspect: 'Tools', batch: 'ADF, Spark batch', streaming: 'Kafka, Spark Streaming' },
      { aspect: 'Error handling', batch: 'Rerun job', streaming: 'Checkpoint/replay' },
    ],
    tools: ['PySpark', 'Kafka', 'ADF', 'Databricks'],
  },
  {
    id: 'databricks-workflow',
    title: 'Databricks Workflow',
    subtitle: 'Multi-task job orchestration',
    description: 'Databricks Jobs with task dependencies, cluster policies, and email/Slack alerting on failure.',
    tasks: [
      { id: 'ingest', label: 'Ingest', icon: '📥', status: 'success', duration: '4m 12s', cluster: 'Job Cluster (4 nodes)' },
      { id: 'bronze', label: 'Bronze DLT', icon: '🔶', status: 'success', duration: '8m 44s', cluster: 'DLT Cluster' },
      { id: 'silver', label: 'Silver DLT', icon: '⚙️', status: 'success', duration: '12m 01s', cluster: 'DLT Cluster' },
      { id: 'gold', label: 'Gold Agg', icon: '🥇', status: 'running', duration: '3m 22s...', cluster: 'Job Cluster (8 nodes)' },
      { id: 'notify', label: 'Notify', icon: '📧', status: 'pending', duration: '—', cluster: 'Serverless' },
    ],
    tools: ['Databricks Jobs', 'DLT', 'Delta Lake', 'Databricks Workflows'],
  },
];

// ── New architecture patterns data ─────────────────────────────────────────────

const ARCH_PATTERNS = [
  {
    id: 'batch',
    title: 'Batch Processing Pipeline',
    description: 'Process large volumes of data in scheduled intervals',
    flow: 'Source → Ingest → Transform → Load → Serve',
    whenToUse: 'Daily reporting, ML training datasets, historical analysis',
    keyComponents: [
      'Schedulers: Airflow / ADF',
      'Storage: S3 / ADLS',
      'Transform: Spark / dbt',
      'DW: Snowflake / Synapse',
    ],
    tools: ['Apache Spark', 'dbt', 'Airflow', 'Azure Data Factory'],
    accentColor: '#3776ab',
  },
  {
    id: 'lambda',
    title: 'Lambda Architecture',
    description: 'Combines batch and speed layers for both accuracy and low latency',
    flow: 'Batch Layer (accuracy)\n+ Speed Layer (low latency)\n→ Serving Layer',
    whenToUse: 'Systems requiring historical accuracy AND real-time views simultaneously',
    keyInsight: 'Batch layer reprocesses all data; speed layer handles recent events',
    tools: ['Apache Spark', 'Kafka + Flink', 'Cassandra / HBase'],
    accentColor: '#7c3aed',
  },
  {
    id: 'kappa',
    title: 'Kappa Architecture',
    description: 'Stream-first approach — reprocess historical data through the same streaming pipeline',
    flow: 'All data → Kafka → Stream Processor → Storage → Serving',
    whenToUse: 'When you want to simplify Lambda complexity with a single code path',
    tools: ['Apache Kafka', 'Apache Flink', 'Apache Spark Streaming'],
    accentColor: '#0ea5e9',
  },
  {
    id: 'medallion-full',
    title: 'Medallion Architecture (Bronze/Silver/Gold)',
    description: 'Multi-hop data refinement pattern popularised by Databricks',
    flow: 'Bronze (raw) → Silver (cleaned) → Gold (business aggregates)',
    layers: [
      { name: 'Bronze', desc: 'Raw data as-is — append-only, full fidelity' },
      { name: 'Silver', desc: 'Cleaned, deduplicated, filtered data' },
      { name: 'Gold', desc: 'Business-level aggregates, ready for reporting' },
    ],
    whenToUse: 'Lakehouse platforms where both ML and BI workloads run on the same data',
    tools: ['Delta Lake', 'Databricks', 'Apache Spark'],
    accentColor: '#d4a800',
  },
  {
    id: 'lakehouse',
    title: 'Data Lakehouse',
    description: 'Combines data lake flexibility with data warehouse performance',
    flow: 'Raw Storage → Open Table Format → Query Engine → BI / ML',
    keyFeatures: [
      'ACID transactions on object storage',
      'Schema enforcement and evolution',
      'BI DirectQuery support on raw data',
      'Time travel and versioning',
    ],
    whenToUse: 'When you need both ML workloads and BI reporting on the same data',
    tools: ['Delta Lake', 'Apache Iceberg', 'Apache Hudi'],
    accentColor: '#2f756e',
  },
  {
    id: 'event-driven',
    title: 'Event-Driven Architecture',
    description: 'Systems react to events in real-time, enabling loose coupling between producers and consumers',
    flow: 'Producer → Event Bus (Topics) → Consumers (multiple)',
    keyConcepts: [
      'Topics and partitions for parallelism',
      'Consumer groups for scalable reads',
      'At-least-once delivery semantics',
      'Offset management for replay',
    ],
    whenToUse: 'Microservices integration, real-time notifications, audit trails',
    tools: ['Apache Kafka', 'Azure Event Hubs', 'AWS Kinesis'],
    accentColor: '#e25a1c',
  },
  {
    id: 'cdc',
    title: 'CDC (Change Data Capture)',
    description: 'Capture row-level changes from operational databases and stream them downstream',
    flow: 'Source DB (WAL) → CDC Tool → Message Bus → Target Store',
    methods: [
      'Log-based CDC (Debezium) — reads transaction log, minimal DB load',
      'Trigger-based — DB triggers fire on INSERT/UPDATE/DELETE',
      'Timestamp-based — poll rows WHERE updated_at > last_run',
    ],
    useCases: 'Real-time replication, audit trails, incremental ingestion',
    tools: ['Debezium', 'Striim', 'AWS DMS', 'Kafka Connect'],
    accentColor: '#dc2626',
  },
  {
    id: 'data-mesh',
    title: 'Data Mesh Architecture',
    description: 'Decentralised, domain-oriented data ownership at enterprise scale',
    flow: 'Domain Team A + Domain Team B → Federated Governance → Data Marketplace',
    principles: [
      'Domain ownership — each team owns its data product',
      'Data as product — discoverable, trustworthy, addressable',
      'Self-serve platform — shared infra teams don\'t gate access',
      'Federated governance — global policies, local execution',
    ],
    whenToUse: 'Large enterprises with multiple independent product or business teams',
    tools: ['DataHub', 'Apache Atlas', 'dbt', 'Collibra'],
    accentColor: '#6366f1',
  },
];

// ── Cloud reference architectures ─────────────────────────────────────────────

const CLOUD_ARCHS = {
  Azure: {
    label: 'Azure Modern Data Platform',
    steps: [
      { label: 'ADLS Gen2', role: 'Storage', icon: '🗄' },
      { label: 'Azure Data Factory', role: 'Orchestration', icon: '🏭' },
      { label: 'Azure Databricks', role: 'Transform', icon: '🧱' },
      { label: 'Azure Synapse', role: 'Warehouse', icon: '📦' },
      { label: 'Power BI', role: 'Serve', icon: '📊' },
    ],
    flow: 'ADLS Gen2 → ADF (orchestration) → Databricks (transform) → Synapse (warehouse) → Power BI (serve)',
  },
  AWS: {
    label: 'AWS Data Lake',
    steps: [
      { label: 'S3', role: 'Storage', icon: '🗄' },
      { label: 'Glue', role: 'ETL', icon: '🔗' },
      { label: 'EMR / Databricks', role: 'Spark', icon: '⚡' },
      { label: 'Redshift', role: 'Warehouse', icon: '📦' },
      { label: 'QuickSight', role: 'Serve', icon: '📊' },
    ],
    flow: 'S3 → Glue (ETL) → EMR/Databricks (Spark) → Redshift (warehouse) → QuickSight (serve)',
  },
  GCP: {
    label: 'GCP Analytics',
    steps: [
      { label: 'Cloud Storage', role: 'Storage', icon: '🗄' },
      { label: 'Dataflow / Dataproc', role: 'Transform', icon: '🔄' },
      { label: 'BigQuery', role: 'Warehouse', icon: '📦' },
      { label: 'Looker', role: 'Serve', icon: '📊' },
    ],
    flow: 'Cloud Storage → Dataflow/Dataproc (transform) → BigQuery (warehouse) → Looker (serve)',
  },
};

// ── Design principles ──────────────────────────────────────────────────────────

const DESIGN_PRINCIPLES = [
  {
    icon: '🛡',
    title: 'Design for failure',
    desc: 'Build retry logic, dead letter queues, and circuit breakers. Every external call can fail — plan for it.',
  },
  {
    icon: '♻',
    title: 'Idempotency first',
    desc: 'Running a pipeline twice should produce the same result. Use MERGE over INSERT, partition-swap over append.',
  },
  {
    icon: '📐',
    title: 'Schema evolution',
    desc: 'Use formats like Parquet / Delta that handle schema changes gracefully. Never break downstream readers.',
  },
  {
    icon: '📡',
    title: 'Monitoring is not optional',
    desc: 'Every pipeline needs observability — row counts, latency, error rates, and SLA breach alerts from day one.',
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function ArchPatternCard({ pattern }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="arch-pattern-card"
      style={{ borderLeftColor: pattern.accentColor }}
    >
      <button
        type="button"
        className="arch-pattern-card-header"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div>
          <div className="arch-pattern-title">{pattern.title}</div>
          <div className="arch-pattern-subtitle">{pattern.description}</div>
        </div>
        <span className="arch-expand-icon">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="arch-pattern-body">
          <div className="arch-flow-diagram">
            <strong>Flow:</strong>{' '}
            {pattern.flow}
          </div>

          {pattern.layers && (
            <div className="arch-pattern-section">
              <strong>Layers:</strong>
              <ul className="arch-pattern-list">
                {pattern.layers.map(l => (
                  <li key={l.name}><strong>{l.name}:</strong> {l.desc}</li>
                ))}
              </ul>
            </div>
          )}

          {pattern.keyComponents && (
            <div className="arch-pattern-section">
              <strong>Key Components:</strong>
              <ul className="arch-pattern-list">
                {pattern.keyComponents.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {pattern.keyFeatures && (
            <div className="arch-pattern-section">
              <strong>Key Features:</strong>
              <ul className="arch-pattern-list">
                {pattern.keyFeatures.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}

          {pattern.keyConcepts && (
            <div className="arch-pattern-section">
              <strong>Key Concepts:</strong>
              <ul className="arch-pattern-list">
                {pattern.keyConcepts.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {pattern.methods && (
            <div className="arch-pattern-section">
              <strong>CDC Methods:</strong>
              <ul className="arch-pattern-list">
                {pattern.methods.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}

          {pattern.principles && (
            <div className="arch-pattern-section">
              <strong>Core Principles:</strong>
              <ul className="arch-pattern-list">
                {pattern.principles.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>
          )}

          {pattern.keyInsight && (
            <div className="arch-pattern-insight">
              <strong>Key Insight:</strong> {pattern.keyInsight}
            </div>
          )}

          {pattern.useCases && (
            <div className="arch-pattern-insight">
              <strong>Use Cases:</strong> {pattern.useCases}
            </div>
          )}

          {pattern.whenToUse && (
            <div className="arch-pattern-when">
              <strong>When to use:</strong> {pattern.whenToUse}
            </div>
          )}

          <div className="arch-tools-row">
            {pattern.tools.map(t => (
              <span key={t} className="arch-tool-badge">{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CloudArchTab({ cloud }) {
  const arch = CLOUD_ARCHS[cloud];
  return (
    <div className="arch-cloud-content">
      <div className="arch-flow-diagram" style={{ marginBottom: 16 }}>
        {arch.flow}
      </div>
      <div className="arch-cloud-steps">
        {arch.steps.map((step, i) => (
          <div key={step.label} className="arch-cloud-step-wrap">
            <div className="arch-cloud-step">
              <span className="arch-cloud-step-icon">{step.icon}</span>
              <span className="arch-cloud-step-label">{step.label}</span>
              <span className="arch-cloud-step-role">{step.role}</span>
            </div>
            {i < arch.steps.length - 1 && (
              <span className="arch-cloud-step-arrow">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Existing diagram sub-components (unchanged) ────────────────────────────────

function MedallionDiagram({ diagram }) {
  return (
    <div className="arch-medallion">
      <div className="arch-flow-row">
        {diagram.flow.map((item, i) => (
          <span key={i} className={item === '→' ? 'arch-arrow' : 'arch-flow-node'}>{item}</span>
        ))}
      </div>
      <div className="arch-layers">
        {diagram.layers.map(l => (
          <div key={l.name} className="arch-layer" style={{ borderColor: l.color, background: l.bg }}>
            <span className="arch-layer-icon">{l.icon}</span>
            <strong className="arch-layer-name" style={{ color: l.color }}>{l.name}</strong>
            <span className="arch-layer-desc">{l.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ADFDiagram({ diagram }) {
  return (
    <div className="arch-adf">
      <div className="arch-pipeline-nodes">
        {diagram.nodes.map((n, i) => (
          <div key={n.id} className={`arch-pipeline-node arch-node--${n.type}`}>
            <span className="arch-node-icon">{n.icon}</span>
            <span className="arch-node-label">{n.label}</span>
            {i < diagram.nodes.length - 1 && n.type !== 'error' && (
              <span className="arch-node-connector">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ETLFlowDiagram({ diagram }) {
  return (
    <div className="arch-etl-stages">
      {diagram.stages.map((s, i) => (
        <div key={s.label} className="arch-etl-stage">
          <div className="arch-etl-header" style={{ background: s.color }}>
            <span>{s.label}</span>
            {i < diagram.stages.length - 1 && <span className="arch-etl-arrow">→</span>}
          </div>
          <ul className="arch-etl-items">
            {s.items.map(item => <li key={item}>{item}</li>)}
          </ul>
        </div>
      ))}
    </div>
  );
}

function StreamingDiagram({ diagram }) {
  return (
    <div className="arch-streaming">
      {diagram.flow.map((f, i) => (
        <div key={f.label} className="arch-stream-group">
          <div className="arch-stream-header" style={{ background: f.color }}>
            {f.label}
          </div>
          <div className="arch-stream-items">
            {f.items.map(item => <div key={item} className="arch-stream-item">{item}</div>)}
          </div>
          {i < diagram.flow.length - 1 && <div className="arch-stream-arrow">⟶</div>}
        </div>
      ))}
    </div>
  );
}

function ComparisonDiagram({ diagram }) {
  return (
    <div className="arch-comparison">
      <div className="arch-cmp-header">
        <span />
        <span className="arch-cmp-title arch-cmp-batch">Batch</span>
        <span className="arch-cmp-title arch-cmp-stream">Streaming</span>
      </div>
      {diagram.comparison.map(row => (
        <div key={row.aspect} className="arch-cmp-row">
          <span className="arch-cmp-aspect">{row.aspect}</span>
          <span className="arch-cmp-batch">{row.batch}</span>
          <span className="arch-cmp-stream">{row.streaming}</span>
        </div>
      ))}
    </div>
  );
}

function WorkflowDiagram({ diagram }) {
  const statusColors = { success: '#2f756e', running: '#f59e0b', pending: '#9ca3af', failed: '#dc2626' };
  return (
    <div className="arch-workflow">
      {diagram.tasks.map((t, i) => (
        <div key={t.id} className="arch-wf-task">
          <div className="arch-wf-task-inner" style={{ borderColor: statusColors[t.status] }}>
            <span className="arch-wf-icon">{t.icon}</span>
            <div className="arch-wf-body">
              <span className="arch-wf-label">{t.label}</span>
              <span className="arch-wf-meta">{t.cluster}</span>
              <span className="arch-wf-duration" style={{ color: statusColors[t.status] }}>
                {t.status === 'running' ? '▶ ' : t.status === 'success' ? '✓ ' : '○ '}
                {t.duration}
              </span>
            </div>
          </div>
          {i < diagram.tasks.length - 1 && <span className="arch-wf-connector">→</span>}
        </div>
      ))}
    </div>
  );
}

function DiagramCard({ diagram }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`arch-card${expanded ? ' arch-card--expanded' : ''}`}>
      <button
        type="button"
        className="arch-card-header"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className="arch-card-title-block">
          <strong className="arch-card-title">{diagram.title}</strong>
          <span className="arch-card-subtitle">{diagram.subtitle}</span>
        </div>
        <div className="arch-card-right">
          <div className="arch-tools">
            {diagram.tools.slice(0, 3).map(t => (
              <span key={t} className="arch-tool-chip">{t}</span>
            ))}
          </div>
          <span className="arch-expand-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="arch-card-body">
          <p className="arch-card-desc">{diagram.description}</p>
          <div className="arch-diagram-area">
            {diagram.id === 'medallion'          && <MedallionDiagram diagram={diagram} />}
            {diagram.id === 'adf-pipeline'       && <ADFDiagram diagram={diagram} />}
            {diagram.id === 'etl-flow'           && <ETLFlowDiagram diagram={diagram} />}
            {diagram.id === 'streaming'          && <StreamingDiagram diagram={diagram} />}
            {diagram.id === 'batch-vs-streaming' && <ComparisonDiagram diagram={diagram} />}
            {diagram.id === 'databricks-workflow' && <WorkflowDiagram diagram={diagram} />}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

const ArchDiagrams = memo(function ArchDiagrams() {
  const [activeCloud, setActiveCloud] = useState('Azure');

  return (
    <section className="section" id="architecture">
      {/* ── Page header ── */}
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Architecture</p>
          <h2>Data Engineering Architecture Patterns</h2>
          <p className="arch-intro">
            Reference architectures and design patterns used in production systems.
          </p>
        </div>
        <span className="arch-count">{ARCH_PATTERNS.length + DIAGRAMS.length} patterns</span>
      </div>

      {/* ── Architecture Pattern Cards ── */}
      <h3 className="arch-section-heading">Architecture Patterns</h3>
      <div className="arch-pattern-grid">
        {ARCH_PATTERNS.map(p => (
          <ArchPatternCard key={p.id} pattern={p} />
        ))}
      </div>

      {/* ── Cloud Reference Architectures ── */}
      <h3 className="arch-section-heading" style={{ marginTop: 40 }}>Cloud Reference Architectures</h3>
      <div className="arch-cloud-tabs">
        {Object.keys(CLOUD_ARCHS).map(cloud => (
          <button
            key={cloud}
            type="button"
            className={`arch-cloud-tab${activeCloud === cloud ? ' arch-cloud-tab--active' : ''}`}
            onClick={() => setActiveCloud(cloud)}
          >
            {cloud}
          </button>
        ))}
      </div>
      <div className="arch-pattern-card" style={{ borderLeftColor: '#2f756e' }}>
        <div className="arch-pattern-title" style={{ marginBottom: 12 }}>
          {CLOUD_ARCHS[activeCloud].label}
        </div>
        <CloudArchTab cloud={activeCloud} />
      </div>

      {/* ── Design Principles ── */}
      <h3 className="arch-section-heading" style={{ marginTop: 40 }}>Design Principles</h3>
      <div className="arch-principles-grid">
        {DESIGN_PRINCIPLES.map(p => (
          <div key={p.title} className="arch-principle-card">
            <span className="arch-principle-icon">{p.icon}</span>
            <strong className="arch-principle-title">{p.title}</strong>
            <p className="arch-principle-desc">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Interactive Diagrams (existing) ── */}
      <h3 className="arch-section-heading" style={{ marginTop: 40 }}>Interactive Diagrams</h3>
      <p className="arch-intro" style={{ marginBottom: 16 }}>
        Click any pattern below to expand the interactive diagram.
      </p>
      <div className="arch-grid">
        {DIAGRAMS.map(d => <DiagramCard key={d.id} diagram={d} />)}
      </div>
    </section>
  );
});

export default ArchDiagrams;
