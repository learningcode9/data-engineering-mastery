// Workplace simulator catalogue — drives the Workplace Simulator page and the
// compact "Workplace Simulator" stage card on the dashboard.

export const workplaceSimulators = [
  {
    id: 'adf',
    title: 'ADF Pipeline Simulator',
    summary: 'Build a restart-safe REST API → ADLS Bronze ingestion pipeline from a real ticket.',
    tools: ['ADF', 'ADLS', 'Key Vault'],
    status: 'available',
    statusLabel: 'Available',
    icon: '▣',
  },
  {
    id: 'databricks',
    title: 'Databricks Simulator',
    summary: 'Transform Bronze into Silver and Gold with notebooks, Delta, and quality checks.',
    tools: ['Databricks', 'Delta', 'Spark'],
    status: 'next',
    statusLabel: 'Next',
    icon: '⚡',
  },
  {
    id: 'incident',
    title: 'Production Incident Simulator',
    summary: 'Diagnose a failing overnight load from logs, run history, and watermark state.',
    tools: ['Logs', 'Monitor', 'On-call'],
    status: 'soon',
    statusLabel: 'Coming soon',
    icon: '⊗',
  },
  {
    id: 'cicd',
    title: 'CI/CD Release Simulator',
    summary: 'Promote ADF and Databricks artifacts across dev, test, and prod with approvals.',
    tools: ['DevOps', 'Git', 'Approvals'],
    status: 'soon',
    statusLabel: 'Coming soon',
    icon: '◈',
  },
];
