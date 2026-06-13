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
      'python',
      'data-modeling',
      'api-file-ingestion',
      'azure-data-factory',
      'azure-data-lake-gen2',
      'azure-synapse',
      'microsoft-fabric',
      'azure-databricks',
      'pyspark',
      'delta-lake',
      'cicd-de',
      'infrastructure-as-code',
      'azure-security',
      'streaming',
      'cdc',
      'production-operations',
      'system-design',
    ],
  },
  {
    id: 'databricks-engineer',
    title: 'Databricks Engineer',
    icon: '⚡',
    description: 'Master the Azure Databricks Lakehouse: PySpark, Delta Lake, medallion architecture, Unity Catalog, and streaming.',
    priorityTopics: ['azure-databricks', 'pyspark', 'delta-lake', 'medallion-architecture', 'streaming', 'kafka-basics', 'event-hubs'],
  },
  {
    id: 'analytics-engineer',
    title: 'Analytics Engineer',
    icon: '▧',
    description: 'Bridge data engineering and analytics with SQL, data modeling, dbt, Synapse, Fabric, and governed semantic models.',
    priorityTopics: ['sql', 'data-modeling', 'dbt', 'azure-synapse', 'microsoft-fabric', 'data-quality', 'fabric-semantic-models'],
  },
  {
    id: 'streaming-engineer',
    title: 'Streaming Engineer',
    icon: '⟿',
    description: 'Build real-time systems using Kafka, Event Hubs, Structured Streaming, checkpoints, monitoring, and Delta Lake.',
    priorityTopics: ['python', 'pyspark', 'kafka-basics', 'streaming', 'event-hubs', 'cdc', 'production-operations', 'data-observability'],
  },
];
