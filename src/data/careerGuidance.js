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
    why: 'This is where every Azure Data Engineering journey starts. SQL, Advanced SQL, and Python are the skills teams expect before cloud tooling.',
    jobs: 'Junior Data Engineer, Analytics Engineer, Data Analyst moving into DE',
    companiesUse: 'Every company with a warehouse, dashboard, or reporting pipeline.',
    confidence: 'You can query data, solve interview SQL, and automate pipeline work with Python.',
    timeline: '7-9 weeks',
    difficulty: 'Beginner',
  },
  'de-core': {
    why: 'Production teams need modeled, tested, documented transformation layers, not random SQL scripts.',
    jobs: 'Data Engineer, Analytics Engineer, Warehouse Engineer',
    companiesUse: 'Dimensional models, dbt projects, source tests, marts, semantic models, and trusted reporting layers.',
    confidence: 'You can design warehouse models and explain how dbt makes transformations testable and deployable.',
    timeline: '4-6 weeks',
    difficulty: 'Beginner to Intermediate',
  },
  'azure-foundations': {
    why: 'Azure roles expect platform literacy before complex Spark or lakehouse work.',
    jobs: 'Azure Data Engineer, Cloud Data Engineer, DP-203 candidate',
    companiesUse: 'Resource groups, Managed Identity, ADF pipelines, ADLS Gen2 landing zones, Key Vault, and Azure Monitor.',
    confidence: 'You can explain how Azure services connect securely to move and store data.',
    timeline: '5-7 weeks',
    difficulty: 'Intermediate',
  },
  'spark-lakehouse': {
    why: 'Databricks, PySpark, and Delta Lake are the production-scale engine behind modern Azure lakehouses.',
    jobs: 'Azure Data Engineer, Databricks Engineer, Lakehouse Engineer',
    companiesUse: 'Bronze/Silver/Gold tables, CDC MERGE jobs, Spark optimization, Delta time travel, and ML feature pipelines.',
    confidence: 'You can build and tune lakehouse pipelines that scale beyond single-machine processing.',
    timeline: '8-10 weeks',
    difficulty: 'Intermediate to Advanced',
  },
  'enterprise-analytics': {
    why: 'Enterprise platforms turn lakehouse data into governed analytics, semantic models, and BI-ready serving layers.',
    jobs: 'Azure Analytics Engineer, BI Platform Engineer, Microsoft Fabric Engineer',
    companiesUse: 'Synapse serverless/dedicated SQL, Fabric Lakehouse, OneLake, Direct Lake semantic models, and Power BI.',
    confidence: 'You can explain how curated lake data becomes performant reporting and analytics products.',
    timeline: '4-5 weeks',
    difficulty: 'Intermediate',
  },
  'production-engineering': {
    why: 'Senior DE work is reliability, security, CI/CD, observability, streaming, and cost control.',
    jobs: 'Senior Data Engineer, Data Platform Engineer, Production Support DE',
    companiesUse: 'CI/CD pipelines, Key Vault, Managed Identity, Kafka/Event Hubs, runbooks, monitoring, and incident response.',
    confidence: 'You can operate pipelines safely, recover failures, and explain governance and observability tradeoffs.',
    timeline: '8-10 weeks',
    difficulty: 'Advanced',
  },
  'career-system-design': {
    why: 'Projects, system design, and interview preparation convert learning into hiring signal.',
    jobs: 'Azure Data Engineer, Senior Data Engineer, Platform Data Engineer',
    companiesUse: 'Portfolio-ready systems, architecture tradeoff narratives, resume bullets, and mock interview loops.',
    confidence: 'You can explain what you built, why it matters, and how you would debug it in production.',
    timeline: '5-7 weeks',
    difficulty: 'Career',
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
  'advanced-sql': 'foundation',
  python: 'foundation',
  'linux-cli': 'foundation',
  git: 'foundation',
  'data-modeling': 'de-core',
  dbt: 'de-core',
  'azure-fundamentals': 'azure-foundations',
  'azure-data-lake-gen2': 'azure-foundations',
  'azure-synapse': 'enterprise-analytics',
  'microsoft-fabric': 'enterprise-analytics',
  'azure-security': 'production-engineering',
  'kafka-streaming': 'production-engineering',
  'production-operations': 'production-engineering',
  'system-design': 'career-system-design',
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
