// Centralized documentation source registry.
// All topic docs are referenced by sourceId — never hardcoded in components.

export const DOC_SOURCES = {
  // ── Microsoft ──────────────────────────────────────────────────────────────
  'ms-fabric-overview': {
    id: 'ms-fabric-overview',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Microsoft Fabric Documentation',
    url: 'https://learn.microsoft.com/en-us/fabric/',
    description: 'Official overview of the end-to-end analytics platform',
  },
  'ms-fabric-onelake': {
    id: 'ms-fabric-onelake',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'OneLake Documentation',
    url: 'https://learn.microsoft.com/en-us/fabric/onelake/onelake-overview',
    description: 'OneLake — the single logical data lake for the entire organization',
  },
  'ms-fabric-lakehouse': {
    id: 'ms-fabric-lakehouse',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Fabric Lakehouse Documentation',
    url: 'https://learn.microsoft.com/en-us/fabric/data-engineering/lakehouse-overview',
    description: 'Fabric Lakehouse — Delta tables, shortcuts, and SQL analytics',
  },
  'ms-fabric-warehouse': {
    id: 'ms-fabric-warehouse',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Fabric Data Warehouse Documentation',
    url: 'https://learn.microsoft.com/en-us/fabric/data-warehouse/data-warehousing',
    description: 'Fabric Warehouse — fully managed T-SQL analytics warehouse',
  },
  'ms-fabric-data-factory': {
    id: 'ms-fabric-data-factory',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Data Factory in Fabric',
    url: 'https://learn.microsoft.com/en-us/fabric/data-factory/data-factory-overview',
    description: 'Data integration and orchestration with pipelines and dataflows',
  },
  'ms-fabric-dataflows-gen2': {
    id: 'ms-fabric-dataflows-gen2',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Dataflows Gen2 in Fabric',
    url: 'https://learn.microsoft.com/en-us/fabric/data-factory/dataflows-gen2-overview',
    description: 'Power Query-based transformation authoring in the cloud',
  },
  'ms-fabric-notebooks': {
    id: 'ms-fabric-notebooks',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Fabric Notebooks Documentation',
    url: 'https://learn.microsoft.com/en-us/fabric/data-engineering/how-to-use-notebook',
    description: 'Collaborative PySpark and SparkSQL notebooks in Fabric',
  },
  'ms-fabric-spark': {
    id: 'ms-fabric-spark',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Apache Spark in Fabric',
    url: 'https://learn.microsoft.com/en-us/fabric/data-engineering/spark-overview',
    description: 'Managed Spark compute, environments, and job scheduling in Fabric',
  },
  'ms-fabric-rti': {
    id: 'ms-fabric-rti',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Real-Time Intelligence in Fabric',
    url: 'https://learn.microsoft.com/en-us/fabric/real-time-intelligence/overview',
    description: 'Streaming ingestion, Eventstream, KQL databases, and real-time dashboards',
  },
  'ms-fabric-eventstream': {
    id: 'ms-fabric-eventstream',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Fabric Eventstream Documentation',
    url: 'https://learn.microsoft.com/en-us/fabric/real-time-intelligence/event-streams/overview',
    description: 'No-code streaming data ingestion and routing with Eventstream',
  },
  'ms-fabric-kql': {
    id: 'ms-fabric-kql',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'KQL Database & Queryset',
    url: 'https://learn.microsoft.com/en-us/fabric/real-time-intelligence/create-database',
    description: 'Kusto Query Language database for high-speed time-series analytics',
  },
  'ms-fabric-semantic-models': {
    id: 'ms-fabric-semantic-models',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Semantic Models in Fabric',
    url: 'https://learn.microsoft.com/en-us/fabric/data-warehouse/semantic-models',
    description: 'Power BI semantic models backed by Direct Lake for sub-second query performance',
  },
  'ms-fabric-medallion': {
    id: 'ms-fabric-medallion',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Medallion Architecture in OneLake',
    url: 'https://learn.microsoft.com/en-us/azure/databricks/lakehouse/medallion',
    description: 'Bronze → Silver → Gold architecture patterns for Fabric Lakehouses',
  },
  'ms-fabric-deployment': {
    id: 'ms-fabric-deployment',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Fabric Deployment Pipelines',
    url: 'https://learn.microsoft.com/en-us/fabric/cicd/deployment-pipelines/intro-to-deployment-pipelines',
    description: 'CI/CD and lifecycle management for Fabric items',
  },
  'ms-fabric-git': {
    id: 'ms-fabric-git',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Fabric Git Integration',
    url: 'https://learn.microsoft.com/en-us/fabric/cicd/git-integration/intro-to-git-integration',
    description: 'Connect Fabric workspaces to GitHub or Azure DevOps',
  },
  'ms-adf': {
    id: 'ms-adf',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Azure Data Factory Documentation',
    url: 'https://learn.microsoft.com/en-us/azure/data-factory/',
    description: 'Cloud-based ETL and data integration service',
  },
  'ms-databricks': {
    id: 'ms-databricks',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Azure Databricks Documentation',
    url: 'https://learn.microsoft.com/en-us/azure/databricks/',
    description: 'Apache Spark analytics platform on Azure',
  },
  'ms-synapse': {
    id: 'ms-synapse',
    vendor: 'Microsoft',
    vendorColor: '#0078d4',
    title: 'Azure Synapse Analytics',
    url: 'https://learn.microsoft.com/en-us/azure/synapse-analytics/',
    description: 'Unified analytics for data warehousing and big data',
  },

  // ── Apache ─────────────────────────────────────────────────────────────────
  'apache-spark': {
    id: 'apache-spark',
    vendor: 'Apache',
    vendorColor: '#e25a00',
    title: 'Apache Spark Documentation',
    url: 'https://spark.apache.org/docs/latest/',
    description: 'Unified engine for large-scale data analytics',
  },
  'apache-airflow': {
    id: 'apache-airflow',
    vendor: 'Apache',
    vendorColor: '#e25a00',
    title: 'Apache Airflow Documentation',
    url: 'https://airflow.apache.org/docs/',
    description: 'Platform to programmatically author, schedule, and monitor workflows',
  },
  'apache-kafka': {
    id: 'apache-kafka',
    vendor: 'Apache',
    vendorColor: '#e25a00',
    title: 'Apache Kafka Documentation',
    url: 'https://kafka.apache.org/documentation/',
    description: 'Distributed event streaming platform',
  },
  'delta-lake': {
    id: 'delta-lake',
    vendor: 'Delta Lake',
    vendorColor: '#003b5c',
    title: 'Delta Lake Documentation',
    url: 'https://docs.delta.io/latest/index.html',
    description: 'ACID transactions and scalable metadata handling for Apache Spark',
  },

  // ── Databricks ─────────────────────────────────────────────────────────────
  'databricks-docs': {
    id: 'databricks-docs',
    vendor: 'Databricks',
    vendorColor: '#e44c36',
    title: 'Databricks Documentation',
    url: 'https://docs.databricks.com/',
    description: 'Databricks Lakehouse platform documentation',
  },
  'databricks-unity-catalog': {
    id: 'databricks-unity-catalog',
    vendor: 'Databricks',
    vendorColor: '#e44c36',
    title: 'Unity Catalog Documentation',
    url: 'https://docs.databricks.com/en/data-governance/unity-catalog/index.html',
    description: 'Unified governance for all data assets in Databricks',
  },

  // ── AWS ────────────────────────────────────────────────────────────────────
  'aws-glue': {
    id: 'aws-glue',
    vendor: 'AWS',
    vendorColor: '#ff9900',
    title: 'AWS Glue Documentation',
    url: 'https://docs.aws.amazon.com/glue/',
    description: 'Serverless data integration service',
  },
  'aws-s3': {
    id: 'aws-s3',
    vendor: 'AWS',
    vendorColor: '#ff9900',
    title: 'Amazon S3 Documentation',
    url: 'https://docs.aws.amazon.com/s3/',
    description: 'Object storage for data lakes and analytics',
  },
  'aws-redshift': {
    id: 'aws-redshift',
    vendor: 'AWS',
    vendorColor: '#ff9900',
    title: 'Amazon Redshift Documentation',
    url: 'https://docs.aws.amazon.com/redshift/',
    description: 'Fully managed petabyte-scale data warehouse',
  },

  // ── Python / Open Source ────────────────────────────────────────────────────
  'python-docs': {
    id: 'python-docs',
    vendor: 'Python',
    vendorColor: '#3776ab',
    title: 'Python Documentation',
    url: 'https://docs.python.org/3/',
    description: 'Official Python 3 documentation',
  },
  'pandas-docs': {
    id: 'pandas-docs',
    vendor: 'pandas',
    vendorColor: '#130654',
    title: 'pandas Documentation',
    url: 'https://pandas.pydata.org/docs/',
    description: 'Data analysis and manipulation library',
  },
  'postgresql-docs': {
    id: 'postgresql-docs',
    vendor: 'PostgreSQL',
    vendorColor: '#336791',
    title: 'PostgreSQL Documentation',
    url: 'https://www.postgresql.org/docs/',
    description: 'Advanced open-source relational database',
  },
  'dbt-docs': {
    id: 'dbt-docs',
    vendor: 'dbt',
    vendorColor: '#ff694a',
    title: 'dbt Documentation',
    url: 'https://docs.getdbt.com/',
    description: 'Data transformation using SQL with software engineering best practices',
  },
};

// Get a doc source entry by id — returns null if not found (safe to use in render)
export function getDocSource(id) {
  return DOC_SOURCES[id] ?? null;
}

// Resolve an array of sourceIds into full source objects (filters out unknowns)
export function resolveDocSources(ids = []) {
  return ids.map(id => DOC_SOURCES[id]).filter(Boolean);
}
