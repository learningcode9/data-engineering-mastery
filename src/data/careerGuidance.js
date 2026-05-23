export const beginnerJourney = {
  roleSummary:
    'Data Engineers build reliable systems that collect, clean, transform, and deliver data for analytics, AI, finance, operations, and product teams.',
  companyTools: [
    'SQL warehouses',
    'Python pipelines',
    'Spark / PySpark',
    'ADF or Glue',
    'Databricks',
    'Kafka',
    'Data quality checks',
  ],
  interviewFocus: [
    'SQL problem solving',
    'Pipeline design',
    'Python fundamentals',
    'Spark trade-offs',
    'Cloud services',
    'Production debugging',
  ],
  reassurance:
    'You do not need to know everything on day one. Start with SQL, build one skill at a time, and use projects to prove what you can do.',
};

export const phaseMentorship = {
  foundation: {
    why: 'This is where every data engineering journey starts. SQL, Python, Linux, Git, and modeling are the skills teams expect before cloud tooling.',
    jobs: 'Junior Data Engineer, Analytics Engineer, Data Analyst moving into DE',
    companiesUse: 'Every company with a warehouse, dashboard, or reporting pipeline.',
    confidence: 'You can read data, write scripts, use Git, and explain table design.',
    timeline: '8-10 weeks',
    difficulty: 'Beginner',
  },
  pipeline: {
    why: 'Pipelines turn raw source data into trusted datasets. This phase teaches how production data actually moves.',
    jobs: 'Data Engineer, ETL Developer, Analytics Engineer',
    companiesUse: 'Retail order loads, SaaS event pipelines, finance reconciliations, marketing attribution.',
    confidence: 'You can design batch loads, incremental logic, CDC, and data quality checks.',
    timeline: '6-8 weeks',
    difficulty: 'Beginner to Intermediate',
  },
  'big-data': {
    why: 'Spark and file-format fundamentals matter when data becomes too large for one machine.',
    jobs: 'Spark Engineer, Big Data Engineer, Lakehouse Engineer',
    companiesUse: 'Customer 360 tables, clickstream processing, ML feature generation, large historical backfills.',
    confidence: 'You can explain partitions, Delta Lake, file formats, and Spark performance basics.',
    timeline: '6-8 weeks',
    difficulty: 'Intermediate',
  },
  cloud: {
    why: 'Most real data engineering work runs on managed cloud services, not only local scripts.',
    jobs: 'Azure Data Engineer, AWS Data Engineer, Cloud Data Engineer',
    companiesUse: 'ADF pipelines, Databricks jobs, Glue crawlers, ADLS/S3 data lakes, medallion lakehouses.',
    confidence: 'You can connect storage, orchestration, transformation, and catalog layers.',
    timeline: '5-7 weeks',
    difficulty: 'Intermediate',
  },
  streaming: {
    why: 'Streaming powers real-time products, alerting, fraud detection, and operational dashboards.',
    jobs: 'Streaming Data Engineer, Platform Data Engineer',
    companiesUse: 'Kafka clickstreams, Event Hubs telemetry, late-arriving events, watermarking, checkpointing.',
    confidence: 'You can reason about lag, exactly-once trade-offs, checkpoints, and stateful processing.',
    timeline: '4-5 weeks',
    difficulty: 'Intermediate to Advanced',
  },
  production: {
    why: 'Production skills separate tutorial projects from job-ready engineering. Reliability, security, CI/CD, and monitoring are what teams trust.',
    jobs: 'Data Platform Engineer, Senior Data Engineer, Production Support DE',
    companiesUse: 'Airflow/ADF orchestration, alerting, retries, RBAC, Unity Catalog, incident response.',
    confidence: 'You can operate pipelines safely, recover failures, and explain governance.',
    timeline: '6-8 weeks',
    difficulty: 'Intermediate to Advanced',
  },
  career: {
    why: 'Hiring teams need evidence: projects, resume bullets, interview stories, and mock practice.',
    jobs: 'Entry-level and mid-level Data Engineer roles',
    companiesUse: 'Portfolio projects and production scenarios as proof of practical readiness.',
    confidence: 'You can explain what you built, why it matters, and how you would debug it in production.',
    timeline: '4-6 weeks',
    difficulty: 'All levels',
  },
  ai: {
    why: 'AI is becoming part of the modern data stack: metadata copilots, RAG over docs, AI-assisted data quality, and analytics automation.',
    jobs: 'AI Data Engineer, Data Platform Engineer, Analytics Engineer with AI focus',
    companiesUse: 'LLM-assisted pipelines, vector databases, semantic search over data catalogs, AI analytics copilots.',
    confidence: 'You can discuss where AI helps data teams and where deterministic pipelines still matter.',
    timeline: '4-5 weeks',
    difficulty: 'Intermediate to Advanced',
  },
};

const topicPhaseMap = {
  sql: 'foundation',
  python: 'foundation',
  'linux-cli': 'foundation',
  git: 'foundation',
  'data-modeling': 'foundation',
  'etl-vs-elt': 'pipeline',
  'batch-processing': 'pipeline',
  'incremental-loading': 'pipeline',
  cdc: 'pipeline',
  'data-quality': 'pipeline',
  pyspark: 'big-data',
  'spark-optimization': 'big-data',
  'partitioning-strategies': 'big-data',
  'file-formats': 'big-data',
  'delta-lake': 'big-data',
  'cloud-storage': 'cloud',
  'azure-data-factory': 'cloud',
  'azure-databricks': 'cloud',
  'aws-glue': 'cloud',
  'medallion-architecture': 'cloud',
  'kafka-basics': 'streaming',
  'structured-streaming': 'streaming',
  'event-hubs': 'streaming',
  checkpointing: 'streaming',
  orchestration: 'production',
  'monitoring-logging': 'production',
  'retry-handling': 'production',
  'cicd-de': 'production',
  'security-governance': 'production',
  'unity-catalog': 'production',
  'de-projects': 'career',
  'resume-builder': 'career',
  'interview-preparation': 'career',
  'mock-interviews': 'career',
  'production-scenarios': 'career',
  'ai-for-data-engineers': 'ai',
  'llm-pipelines': 'ai',
  'vector-databases': 'ai',
  'ai-analytics': 'ai',
};

export function getPhaseMentorship(phaseId) {
  return phaseMentorship[phaseId] ?? phaseMentorship.foundation;
}

export function getMentorshipForTopic(topic) {
  const phaseId = topicPhaseMap[topic?.id] ?? 'foundation';
  return getPhaseMentorship(phaseId);
}

export function getInterviewReadinessEstimate(readiness) {
  if (readiness >= 85) return 'Interview-ready now: focus on mock interviews and project storytelling.';
  if (readiness >= 65) return 'About 4-6 weeks away with focused SQL, Spark, and project review.';
  if (readiness >= 40) return 'About 8-12 weeks away if you study consistently and finish one project.';
  if (readiness >= 15) return 'About 3-4 months away. Stay focused on foundations and pipeline practice.';
  return 'About 4-6 months for most beginners. Start with SQL and practice daily.';
}

export function getPhaseByTopicIds(topicIds = []) {
  const counts = {};
  topicIds.forEach(id => {
    const phase = topicPhaseMap[id];
    if (phase) counts[phase] = (counts[phase] ?? 0) + 1;
  });
  const [best] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ['foundation'];
  return best;
}
