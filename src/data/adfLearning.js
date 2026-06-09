// Phase 10 — Learning ↔ Work integration. Maps each simulator to recommended
// learning topics (prerequisites) and computes a readiness score from the
// learner's completed topics. Guidance only — nothing is locked.

export const SIM_PREREQS = {
  'ADF-1024': {
    title: 'Customer Events API → ADLS Bronze',
    prereqs: [
      { label: 'ADF Foundations', topicId: 'azure-data-factory' },
      { label: 'ADLS Gen2 / Cloud Storage', topicId: 'cloud-storage' },
      { label: 'Watermarking', topicId: 'checkpointing' },
      { label: 'Incremental Loading', topicId: 'incremental-loading' },
      { label: 'Monitoring & Logging', topicId: 'monitoring-logging' },
      { label: 'Retry & Failure Recovery', topicId: 'retry-handling' },
    ],
  },
  'ADF-1025': {
    title: 'Bronze → Silver Transformation',
    prereqs: [
      { label: 'Delta Lake', topicId: 'delta-lake' },
      { label: 'Data Quality', topicId: 'data-quality' },
      { label: 'Medallion Architecture', topicId: 'medallion-architecture' },
      { label: 'PySpark', topicId: 'pyspark' },
    ],
  },
  'ADF-1026': {
    title: 'Silver → Gold Aggregation',
    prereqs: [
      { label: 'Data Warehousing & Modeling', topicId: 'data-modeling' },
      { label: 'Medallion Architecture', topicId: 'medallion-architecture' },
      { label: 'Delta Lake', topicId: 'delta-lake' },
      { label: 'Advanced SQL', topicId: 'advanced-sql' },
    ],
  },
  'ADF-1027': {
    title: 'Marketing Dashboard Dataset',
    prereqs: [
      { label: 'Data Modeling', topicId: 'data-modeling' },
      { label: 'Microsoft Fabric / Synapse', topicId: 'microsoft-fabric' },
      { label: 'Security & Governance', topicId: 'security-governance' },
    ],
  },
  'ADF-1030': {
    title: 'Customer Master CDC Pipeline',
    prereqs: [
      { label: 'Incremental Loading', topicId: 'incremental-loading' },
      { label: 'Change Data Capture', topicId: 'cdc' },
      { label: 'Delta Lake', topicId: 'delta-lake' },
      { label: 'Data Warehousing (SCD2)', topicId: 'data-modeling' },
      { label: 'Advanced SQL (MERGE)', topicId: 'advanced-sql' },
    ],
  },
  'DBX-2001': {
    title: 'Slow Customer Analytics Job',
    prereqs: [
      { label: 'PySpark / Spark Basics', topicId: 'pyspark' },
      { label: 'Spark Optimization', topicId: 'spark-optimization' },
      { label: 'Partitioning Strategies', topicId: 'partitioning-strategies' },
      { label: 'Delta Lake', topicId: 'delta-lake' },
      { label: 'Joins (Advanced SQL)', topicId: 'advanced-sql' },
    ],
  },
  'INC-1001': {
    title: 'Customer Events Pipeline Failed Overnight',
    prereqs: [
      { label: 'Production Operations & Monitoring', topicId: 'production-operations' },
      { label: 'Monitoring & Logging', topicId: 'monitoring-logging' },
      { label: 'Retry & Failure Recovery', topicId: 'retry-handling' },
      { label: 'Azure Security & Secrets', topicId: 'azure-security' },
    ],
  },
  'REL-3001': {
    title: 'Deploy Customer Analytics Release',
    prereqs: [
      { label: 'DevOps & CI/CD', topicId: 'cicd-de' },
      { label: 'Git & Version Control', topicId: 'git' },
      { label: 'Production Operations', topicId: 'production-operations' },
      { label: 'Azure Fundamentals', topicId: 'azure-fundamentals' },
    ],
  },
  'ARCH-4001': {
    title: 'Design Customer Analytics Platform',
    prereqs: [
      { label: 'System Design', topicId: 'system-design' },
      { label: 'Azure Fundamentals', topicId: 'azure-fundamentals' },
      { label: 'Medallion Architecture', topicId: 'medallion-architecture' },
      { label: 'Data Warehousing & Modeling', topicId: 'data-modeling' },
      { label: 'Azure Databricks', topicId: 'azure-databricks' },
    ],
  },
};

// After finishing a topic, which simulator to recommend next.
export const RECOMMENDED_SIM_BY_TOPIC = {
  'azure-data-factory': 'ADF-1024',
  'cloud-storage': 'ADF-1024',
  'azure-data-lake-gen2': 'ADF-1024',
  'checkpointing': 'ADF-1024',
  'delta-lake': 'ADF-1025',
  'medallion-architecture': 'ADF-1025',
  'data-quality': 'ADF-1025',
  'data-modeling': 'ADF-1026',
  'advanced-sql': 'ADF-1026',
  'incremental-loading': 'ADF-1030',
  'cdc': 'ADF-1030',
  'pyspark': 'DBX-2001',
  'spark-optimization': 'DBX-2001',
  'partitioning-strategies': 'DBX-2001',
  'production-operations': 'INC-1001',
  'monitoring-logging': 'INC-1001',
  'cicd-de': 'REL-3001',
  'git': 'REL-3001',
  'system-design': 'ARCH-4001',
};

export function simReadiness(simId, completedTopics = {}) {
  const entry = SIM_PREREQS[simId];
  if (!entry) return { pct: 0, met: [], missing: [], title: simId };
  const met = [];
  const missing = [];
  entry.prereqs.forEach(p => {
    (completedTopics[p.topicId] ? met : missing).push(p);
  });
  const pct = entry.prereqs.length ? Math.round((met.length / entry.prereqs.length) * 100) : 0;
  return { pct, met, missing, title: entry.title };
}

// The simulator the learner is most prepared for (highest readiness).
export function recommendSimulator(completedTopics = {}) {
  let best = null;
  for (const id of Object.keys(SIM_PREREQS)) {
    const r = simReadiness(id, completedTopics);
    if (!best || r.pct > best.pct) best = { id, ...r };
  }
  return best;
}
