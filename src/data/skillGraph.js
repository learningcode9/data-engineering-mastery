// Skill dependency graph — encodes realistic prerequisite relationships between topics.
// prereqs: topics that feed into this one (readiness score is derived from these)
// boosts:  topics this one unlocks / strengthens readiness for
// weight:  relative importance to overall readiness (1.0 = normal)

export const SKILL_GRAPH = {
  sql: {
    label: 'SQL Mastery',
    prereqs: [],
    boosts: ['pyspark', 'azure-databricks', 'aws-glue'],
    weight: 1.4,
    tier: 'foundation',
    description: 'Core analytical language for all data work. Required before Spark, ETL, or cloud tools.',
    unlocks: [
      'Window functions for running totals and ranking',
      'Spark DataFrame API (SQL mental model transfers directly)',
      'Data modeling patterns (SCD, star schema)',
      'Delta Lake MERGE INTO operations',
    ],
    prereqWarning: null,
  },
  python: {
    label: 'Python for Data',
    prereqs: [],
    boosts: ['pyspark', 'azure-data-factory', 'aws-glue', 'ai-for-data-engineers'],
    weight: 1.3,
    tier: 'foundation',
    description: 'Scripting, automation, and pipeline logic. Needed for every serious data role.',
    unlocks: [
      'Custom Spark transformations and UDFs',
      'Airflow DAG authoring',
      'REST API ingestion patterns',
      'ML pipeline integration',
    ],
    prereqWarning: null,
  },
  pyspark: {
    label: 'PySpark',
    prereqs: ['sql', 'python'],
    boosts: ['azure-databricks', 'aws-glue'],
    weight: 1.5,
    tier: 'core',
    description: 'Distributed processing engine. SQL fluency + Python are hard prerequisites.',
    unlocks: [
      'Catalyst optimizer internals',
      'Shuffle optimization and partitioning strategy',
      'Streaming with Structured Streaming',
      'Delta Lake merge patterns',
    ],
    prereqWarning: 'Attempting PySpark without SQL confidence leads to inefficient DataFrames that are hard to debug.',
  },
  'azure-databricks': {
    label: 'Azure Databricks',
    prereqs: ['pyspark'],
    boosts: ['azure-data-factory'],
    weight: 1.2,
    tier: 'platform',
    description: 'Unified analytics platform. Requires Spark fundamentals to use effectively.',
    unlocks: [
      'Unity Catalog and fine-grained access control',
      'MLflow experiment tracking',
      'Delta Live Tables (DLT) pipelines',
      'Auto-optimize and ZORDER for query acceleration',
    ],
    prereqWarning: 'Without PySpark foundations, Databricks becomes a black box that is expensive to debug.',
  },
  'azure-data-factory': {
    label: 'Azure Data Factory',
    prereqs: ['python', 'azure-databricks'],
    boosts: [],
    weight: 1.1,
    tier: 'platform',
    description: 'Enterprise-grade orchestration. Builds on Databricks and Python knowledge.',
    unlocks: [
      'CI/CD pipelines for ADF using ARM templates',
      'Trigger-based and dependency-driven orchestration',
      'Self-hosted integration runtime for on-premises sources',
    ],
    prereqWarning: null,
  },
  'aws-glue': {
    label: 'AWS Glue',
    prereqs: ['pyspark', 'python'],
    boosts: [],
    weight: 1.0,
    tier: 'platform',
    description: 'Serverless ETL in the AWS ecosystem. Requires PySpark and Python.',
    unlocks: [
      'Glue Data Catalog as a Hive metastore replacement',
      'Crawler automation for schema discovery',
      'Glue Studio visual ETL',
    ],
    prereqWarning: null,
  },
  'ai-for-data-engineers': {
    label: 'AI for Data Engineers',
    prereqs: ['python', 'pyspark'],
    boosts: [],
    weight: 0.9,
    tier: 'advanced',
    description: 'LLMs, embeddings, and vector pipelines. Python + Spark are prerequisites.',
    unlocks: [
      'RAG pipeline architecture with vector stores',
      'Semantic search over structured data lakes',
      'Prompt engineering for data transformation',
      'LLM-assisted data quality checks',
    ],
    prereqWarning: 'AI engineering without data pipeline fundamentals results in brittle, expensive systems.',
  },
};

// Compute how "ready" a learner is to start a topic based on prereq progress
export function computeReadiness(topicId, progress) {
  const node = SKILL_GRAPH[topicId];
  if (!node || !node.prereqs.length) return 100;
  const scores = node.prereqs.map(id => progress[id] ?? 0);
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

// Compute a weighted overall readiness score across all topics
export function computeWeightedOverall(progress) {
  const nodes = Object.entries(SKILL_GRAPH);
  const totalWeight = nodes.reduce((a, [, n]) => a + n.weight, 0);
  const weightedScore = nodes.reduce((a, [id, n]) => a + (progress[id] ?? 0) * n.weight, 0);
  return Math.round(weightedScore / totalWeight);
}

// Return topics that are "ready to start" (prereqs > 50%) but not yet started
export function getRecommendedNext(progress) {
  return Object.entries(SKILL_GRAPH)
    .filter(([id]) => (progress[id] ?? 0) === 0)
    .map(([id, node]) => ({
      id,
      ...node,
      readiness: computeReadiness(id, progress),
    }))
    .filter(t => t.readiness >= 50)
    .sort((a, b) => b.readiness - a.readiness);
}

// Return topics whose boosts are unlocked by current topic progress
export function getUnlockedBy(topicId, progress) {
  const pct = progress[topicId] ?? 0;
  if (pct < 60) return [];
  return SKILL_GRAPH[topicId]?.boosts
    .map(id => ({ id, label: SKILL_GRAPH[id]?.label, readiness: computeReadiness(id, progress) }))
    .filter(Boolean) ?? [];
}

// Topological order for learning path visualization
export const LEARNING_TIERS = {
  foundation: ['sql', 'python'],
  core: ['pyspark'],
  platform: ['azure-databricks', 'azure-data-factory', 'aws-glue'],
  advanced: ['ai-for-data-engineers'],
};
