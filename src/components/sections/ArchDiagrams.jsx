import { memo, useState } from 'react';

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
            {diagram.id === 'medallion'        && <MedallionDiagram diagram={diagram} />}
            {diagram.id === 'adf-pipeline'     && <ADFDiagram diagram={diagram} />}
            {diagram.id === 'etl-flow'         && <ETLFlowDiagram diagram={diagram} />}
            {diagram.id === 'streaming'        && <StreamingDiagram diagram={diagram} />}
            {diagram.id === 'batch-vs-streaming' && <ComparisonDiagram diagram={diagram} />}
            {diagram.id === 'databricks-workflow' && <WorkflowDiagram diagram={diagram} />}
          </div>
        </div>
      )}
    </div>
  );
}

const ArchDiagrams = memo(function ArchDiagrams() {
  return (
    <section className="section" id="architecture">
      <div className="section-title-row">
        <div>
          <p className="eyebrow">Architecture</p>
          <h2>Data Engineering Patterns</h2>
        </div>
        <span className="arch-count">{DIAGRAMS.length} patterns</span>
      </div>
      <p className="arch-intro">
        Interactive reference diagrams for the most common data engineering architectures. Click any pattern to expand.
      </p>
      <div className="arch-grid">
        {DIAGRAMS.map(d => <DiagramCard key={d.id} diagram={d} />)}
      </div>
    </section>
  );
});

export default ArchDiagrams;
