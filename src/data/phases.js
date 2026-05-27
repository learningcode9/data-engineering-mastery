import { seniorAzurePhases } from './seniorAzurePath.js';

export const phases = seniorAzurePhases;

export const careerModes = [
  {
    id: 'azure-de',
    title: 'Azure Data Engineer',
    icon: '☁',
    description: 'Specialize in the Senior Azure DE path: ADF, ADLS Gen2, Databricks, Synapse, Fabric, security, CI/CD, and operations.',
    priorityTopics: [
      'sql',
      'advanced-sql',
      'python',
      'data-modeling',
      'dbt',
      'azure-fundamentals',
      'azure-data-factory',
      'azure-data-lake-gen2',
      'azure-databricks',
      'pyspark',
      'delta-lake',
      'azure-synapse',
      'microsoft-fabric',
      'cicd-de',
      'azure-security',
      'kafka-streaming',
      'production-operations',
      'system-design',
    ],
  },
  {
    id: 'databricks-engineer',
    title: 'Databricks Engineer',
    icon: '⚡',
    description: 'Master the Azure Databricks Lakehouse: PySpark, Delta Lake, medallion architecture, Unity Catalog, and streaming.',
    priorityTopics: ['azure-databricks', 'pyspark', 'delta-lake', 'spark-optimization', 'medallion-architecture', 'unity-catalog', 'kafka-streaming'],
  },
  {
    id: 'analytics-engineer',
    title: 'Analytics Engineer',
    icon: '▧',
    description: 'Bridge data engineering and analytics with SQL, data modeling, dbt, Synapse, Fabric, and governed semantic models.',
    priorityTopics: ['sql', 'advanced-sql', 'data-modeling', 'dbt', 'azure-synapse', 'microsoft-fabric', 'data-quality'],
  },
  {
    id: 'streaming-engineer',
    title: 'Streaming Engineer',
    icon: '⟿',
    description: 'Build real-time systems using Kafka, Event Hubs, Structured Streaming, checkpoints, monitoring, and Delta Lake.',
    priorityTopics: ['python', 'pyspark', 'kafka-streaming', 'kafka-basics', 'structured-streaming', 'event-hubs', 'checkpointing', 'production-operations'],
  },
];
