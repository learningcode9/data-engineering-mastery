const slugify = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const titleOverrides = {
  sql: 'SQL Foundations',
  python: 'Python for Data Work',
  git: 'Git Fundamentals',
  'linux-cli': 'Linux Basics',
  'etl-vs-elt': 'ETL Fundamentals',
  'azure-data-lake-gen2': 'ADLS Gen2',
  'azure-synapse': 'Synapse Basics',
  'azure-security': 'Security & Key Vault',
  'microsoft-fabric': 'Fabric Fundamentals',
  'fabric-lakehouse': 'Lakehouse',
  'fabric-warehouse': 'Warehouse',
  'fabric-semantic-models': 'Semantic Models',
  'fabric-direct-lake': 'Direct Lake',
  'fabric-real-time-analytics': 'Real-Time Analytics',
  'fabric-eventstream': 'Eventstream',
  'fabric-data-activator': 'Data Activator',
  'fabric-governance': 'Governance in Fabric',
  'azure-databricks': 'Databricks',
  'spark-sql': 'Spark SQL',
  'medallion-architecture': 'Lakehouse Optimization / Medallion Patterns',
  'cicd-de': 'CI/CD',
  'monitoring-logging': 'Monitoring',
  'production-operations': 'Production Support',
  cdc: 'CDC Mastery',
  streaming: 'Streaming',
  'kafka-basics': 'Kafka Fundamentals',
  'event-hubs': 'Kafka vs Event Hubs',
  'event-driven-architecture': 'Event-Driven Architecture',
  'system-design': 'System Design',
  'data-lineage': 'Data Lineage',
  governance: 'Governance',
  'data-mesh': 'Data Mesh',
  'lakehouse-governance': 'Lakehouse Governance',
  'ha-dr': 'HA/DR',
  'multi-region-design': 'Multi-Region Design',
  'interview-preparation': 'Interview Prep',
  'workplace-scenarios': 'Workplace Scenarios',
  'stakeholder-communication': 'Stakeholder Communication',
  'estimation-planning': 'Estimation & Planning',
  'llm-fundamentals': 'LLM Fundamentals',
  'prompt-engineering': 'Prompt Engineering',
  embeddings: 'Embeddings',
  rag: 'RAG',
  'ai-data-pipelines': 'AI Data Pipelines',
  'ai-evaluation-guardrails': 'AI Evaluation & Guardrails',
  'ai-agents': 'AI Agents',
  'aws-data-stack': 'AWS Data Stack',
  'aws-glue': 'AWS Data Stack',
  snowflake: 'Snowflake',
  'kafka-advanced': 'Kafka Advanced',
  dbt: 'dbt',
  'api-file-ingestion': 'API & File Ingestion',
  'data-contracts': 'Data Contracts',
  'metadata-driven-pipelines': 'Metadata-driven Pipelines',
  'data-quality': 'Data Quality',
  'data-observability': 'Data Observability',
  'cost-optimization': 'Cost Optimization',
  finops: 'FinOps for Data Platforms',
  'infrastructure-as-code': 'Infrastructure as Code',
};

export const phaseBlocks = [
  {
    id: 'phase-1-foundations',
    title: 'Phase 1 — Foundations',
    shortTitle: 'Foundations',
    description: 'Build the SQL, scripting, Git, and Linux skills every Azure Data Engineer uses daily.',
    trackType: 'core',
    order: 1,
    estimatedHours: 72,
    topicIds: ['sql', 'python', 'git', 'linux-cli'],
    prerequisites: [],
    exitCriteria: 'Can write production SQL, small Python utilities, and navigate Git and Linux confidently.',
  },
  {
    id: 'phase-2-data-engineering-core',
    title: 'Phase 2 — Data Engineering Core',
    shortTitle: 'Core',
    description: 'Model data correctly, ingest it reliably, and define the contracts that keep pipelines trustworthy.',
    trackType: 'core',
    order: 2,
    estimatedHours: 96,
    topicIds: ['data-modeling', 'etl-vs-elt', 'api-file-ingestion', 'data-quality', 'data-contracts', 'metadata-driven-pipelines'],
    prerequisites: ['phase-1-foundations'],
    exitCriteria: 'Can design a warehouse model, ingest data from APIs/files, and add quality and contract checks.',
  },
  {
    id: 'phase-3-azure-foundations',
    title: 'Phase 3 — Azure Foundations',
    shortTitle: 'Azure',
    description: 'Land data in Azure, orchestrate pipelines, and secure access with Key Vault and managed identities.',
    trackType: 'core',
    order: 3,
    estimatedHours: 80,
    topicIds: ['azure-data-lake-gen2', 'azure-data-factory', 'azure-synapse', 'azure-security'],
    prerequisites: ['phase-2-data-engineering-core'],
    exitCriteria: 'Can build secure ADLS / ADF / Synapse solutions with production-ready access control.',
  },
  {
    id: 'phase-4-microsoft-fabric',
    title: 'Phase 4 — Microsoft Fabric',
    shortTitle: 'Fabric',
    description: 'Use OneLake, Lakehouse, Warehouse, Direct Lake, and real-time items in one governed SaaS platform.',
    trackType: 'core',
    order: 4,
    estimatedHours: 110,
    topicIds: [
      'microsoft-fabric',
      'fabric-onelake',
      'fabric-lakehouse',
      'fabric-warehouse',
      'fabric-semantic-models',
      'fabric-direct-lake',
      'fabric-real-time-analytics',
      'fabric-eventstream',
      'fabric-data-activator',
      'fabric-governance',
    ],
    prerequisites: ['phase-3-azure-foundations'],
    exitCriteria: 'Can explain where Lakehouse, Warehouse, Direct Lake, and real-time patterns fit in Fabric.',
  },
  {
    id: 'phase-5-spark-lakehouse',
    title: 'Phase 5 — Spark & Lakehouse',
    shortTitle: 'Spark',
    description: 'Process data at scale with Databricks, PySpark, Delta Lake, and medallion patterns.',
    trackType: 'core',
    order: 5,
    estimatedHours: 92,
    topicIds: ['azure-databricks', 'pyspark', 'spark-sql', 'delta-lake', 'medallion-architecture'],
    prerequisites: ['phase-4-microsoft-fabric'],
    exitCriteria: 'Can build Bronze/Silver/Gold pipelines, tune Spark jobs, and explain Delta behavior.',
  },
  {
    id: 'phase-6-production-engineering-finops',
    title: 'Phase 6 — Production Engineering & FinOps',
    shortTitle: 'Production',
    description: 'Harden data systems with CI/CD, infrastructure as code, observability, support, and cost control.',
    trackType: 'core',
    order: 6,
    estimatedHours: 88,
    topicIds: ['cicd-de', 'infrastructure-as-code', 'monitoring-logging', 'data-observability', 'cost-optimization', 'finops', 'production-operations'],
    prerequisites: ['phase-5-spark-lakehouse'],
    exitCriteria: 'Can deploy, monitor, support, and optimize a production Azure data platform responsibly.',
  },
  {
    id: 'phase-7-advanced-streaming-cdc',
    title: 'Phase 7 — Advanced Streaming & CDC',
    shortTitle: 'Streaming',
    description: 'Handle change data capture, streaming, Kafka, and event-driven workloads with confidence.',
    trackType: 'core',
    order: 7,
    estimatedHours: 84,
    topicIds: ['cdc', 'streaming', 'kafka-basics', 'event-hubs', 'event-driven-architecture'],
    prerequisites: ['phase-6-production-engineering-finops'],
    exitCriteria: 'Can design exactly-once-ish streaming flows and explain Kafka vs Event Hubs tradeoffs.',
  },
  {
    id: 'phase-8-enterprise-architecture-governance',
    title: 'Phase 8 — Enterprise Architecture & Governance',
    shortTitle: 'Architecture',
    description: 'Design governed, resilient, multi-region data platforms with clear lineage and operating rules.',
    trackType: 'core',
    order: 8,
    estimatedHours: 88,
    topicIds: ['system-design', 'data-lineage', 'governance', 'data-mesh', 'lakehouse-governance', 'ha-dr', 'multi-region-design'],
    prerequisites: ['phase-7-advanced-streaming-cdc'],
    exitCriteria: 'Can whiteboard a secure, observable, multi-region Azure/Fabric architecture end to end.',
  },
  {
    id: 'phase-9-career-readiness',
    title: 'Phase 9 — Career Readiness',
    shortTitle: 'Career',
    description: 'Turn skills into interviews, workplace stories, and a clear path to senior-level roles.',
    trackType: 'core',
    order: 9,
    estimatedHours: 48,
    topicIds: ['interview-preparation', 'workplace-scenarios', 'stakeholder-communication', 'estimation-planning'],
    prerequisites: ['phase-8-enterprise-architecture-governance'],
    exitCriteria: 'Can explain your work, estimate projects, and answer senior Azure DE interview questions confidently.',
  },
];

export const aiTrackBlocks = [
  {
    id: 'ai-track',
    title: 'AI for Data Engineers',
    shortTitle: 'AI',
    description: 'A separate specialization track for LLM workflows, RAG, vector search, and AI-assisted data pipelines.',
    trackType: 'ai',
    order: 10,
    estimatedHours: 64,
    topicIds: ['llm-fundamentals', 'prompt-engineering', 'embeddings', 'vector-databases', 'rag', 'ai-data-pipelines', 'ai-evaluation-guardrails', 'ai-agents'],
    prerequisites: ['phase-9-career-readiness'],
    exitCriteria: 'Can build, evaluate, and explain AI-assisted data workflows without mixing them into the core Azure path.',
  },
];

export const optionalBlocks = [
  {
    id: 'optional-technologies',
    title: 'Optional Technologies',
    shortTitle: 'Optional',
    description: 'Peripheral technologies that broaden the platform view without changing the core Azure focus.',
    trackType: 'optional',
    order: 11,
    estimatedHours: 40,
    topicIds: ['aws-glue', 'snowflake', 'dbt', 'kafka-advanced'],
    prerequisites: ['phase-8-enterprise-architecture-governance'],
    exitCriteria: 'Can speak about adjacent tools, but keep Azure as the primary production platform.',
  },
];

export const curriculumPhaseGroups = {
  core: phaseBlocks,
  ai: aiTrackBlocks,
  optional: optionalBlocks,
};

export const curriculumTracks = [
  ...phaseBlocks,
  ...aiTrackBlocks,
  ...optionalBlocks,
];

const topicPhaseLookup = curriculumTracks.reduce((acc, phase) => {
  for (const topicId of phase.topicIds ?? []) acc[topicId] = phase.id;
  return acc;
}, {});

const topicTrackLookup = curriculumTracks.reduce((acc, phase) => {
  for (const topicId of phase.topicIds ?? []) acc[topicId] = phase.trackType;
  return acc;
}, {});

export const coreTrackTopicIds = phaseBlocks.flatMap(phase => phase.topicIds ?? []);
export const aiTrackTopicIds = aiTrackBlocks.flatMap(phase => phase.topicIds ?? []);
export const optionalTrackTopicIds = optionalBlocks.flatMap(phase => phase.topicIds ?? []);

// The canonical order used by roadmap progress and "next topic" logic.
export const seniorAzureTopicOrder = curriculumTracks.flatMap(phase => phase.topicIds ?? []);

export const seniorAzurePhases = phaseBlocks;

export const seniorAzureLearningPathTemplate = phaseBlocks.map(phase => ({
  id: phase.id,
  title: phase.title,
  shortTitle: phase.shortTitle,
  estimatedTime: phase.estimatedHours ? `${Math.ceil(phase.estimatedHours / 8)}-${Math.ceil(phase.estimatedHours / 6)} weeks` : '2-4 weeks',
  difficulty: 'Core',
  trackType: 'core',
  description: phase.description,
  prerequisites: phase.prerequisites,
  exitCriteria: phase.exitCriteria,
  modules: [
    {
      id: `${phase.id}-module`,
      title: phase.shortTitle,
      lessons: phase.topicIds.map(topicId => ({
        id: topicId,
        topicId,
        title: topicTitle(topicId),
        label: topicLabel(topicId),
        difficulty: topicDifficulty(topicId),
        type: 'topic',
        body: `Learn ${topicTitle(topicId)} as part of the ${phase.shortTitle} phase of the Senior Azure Data Engineer curriculum.`,
      })),
    },
  ],
}));

export const aiLearningPathTemplate = aiTrackBlocks.map(phase => ({
  id: phase.id,
  title: phase.title,
  shortTitle: phase.shortTitle,
  estimatedTime: phase.estimatedHours ? `${Math.ceil(phase.estimatedHours / 8)}-${Math.ceil(phase.estimatedHours / 6)} weeks` : '1-3 weeks',
  difficulty: 'Specialization',
  trackType: 'ai',
  description: phase.description,
  prerequisites: phase.prerequisites,
  exitCriteria: phase.exitCriteria,
  modules: [
    {
      id: `${phase.id}-module`,
      title: phase.shortTitle,
      lessons: phase.topicIds.map(topicId => ({
        id: topicId,
        topicId,
        title: topicTitle(topicId),
        label: 'AI',
        difficulty: topicDifficulty(topicId),
        type: 'topic',
        body: `Build practical understanding of ${topicTitle(topicId)} in the AI for Data Engineers specialization track.`,
      })),
    },
  ],
}));

export const optionalTechnologiesTemplate = optionalBlocks.map(phase => ({
  id: phase.id,
  title: phase.title,
  shortTitle: phase.shortTitle,
  estimatedTime: phase.estimatedHours ? `${Math.ceil(phase.estimatedHours / 8)}-${Math.ceil(phase.estimatedHours / 6)} weeks` : '1-2 weeks',
  difficulty: 'Optional',
  trackType: 'optional',
  description: phase.description,
  prerequisites: phase.prerequisites,
  exitCriteria: phase.exitCriteria,
  modules: [
    {
      id: `${phase.id}-module`,
      title: phase.shortTitle,
      lessons: phase.topicIds.map(topicId => ({
        id: topicId,
        topicId,
        title: topicTitle(topicId),
        label: 'Optional',
        difficulty: topicDifficulty(topicId),
        type: 'topic',
        body: `Explore ${topicTitle(topicId)} as an adjacent technology without affecting the core Azure learning path.`,
      })),
    },
  ],
}));

export const curriculumRouteMap = Object.fromEntries(
  seniorAzureTopicOrder.map(topicId => [topicId, routeForTopic(topicId)])
);

export const curriculumMigrationMap = {
  'advanced-sql': 'sql',
  'azure-fundamentals': 'azure-data-factory',
  'azure-data-lake-gen2': 'azure-data-lake-gen2',
  'cloud-storage': 'azure-data-lake-gen2',
  'checkpointing': 'cdc',
  'retry-handling': 'production-operations',
  'monitoring-logging': 'monitoring-logging',
  'production-operations': 'production-operations',
  'kafka-streaming': 'streaming',
};

const conceptHomes = {
  'Delta Lake': {
    canonicalTopic: 'delta-lake',
    references: ['medallion-architecture', 'azure-databricks', 'fabric-lakehouse'],
    doNotReteach: ['azure-databricks', 'microsoft-fabric'],
  },
  CDC: {
    canonicalTopic: 'cdc',
    references: ['production-operations', 'event-driven-architecture', 'kafka-basics'],
    doNotReteach: ['streaming', 'event-hubs'],
  },
  'SCD Type 2': {
    canonicalTopic: 'data-modeling',
    references: ['etl-vs-elt', 'azure-databricks', 'fabric-warehouse'],
    doNotReteach: ['data-quality'],
  },
  'Medallion Architecture': {
    canonicalTopic: 'medallion-architecture',
    references: ['delta-lake', 'fabric-lakehouse', 'azure-databricks'],
    doNotReteach: ['fabric-fundamentals'],
  },
  'Lakehouse Architecture': {
    canonicalTopic: 'microsoft-fabric',
    references: ['medallion-architecture', 'delta-lake', 'azure-databricks'],
    doNotReteach: ['fabric-lakehouse', 'fabric-warehouse'],
  },
  'Data Quality': {
    canonicalTopic: 'data-quality',
    references: ['data-contracts', 'monitoring-logging', 'production-operations'],
    doNotReteach: ['etl-vs-elt'],
  },
  'Data Contracts': {
    canonicalTopic: 'data-contracts',
    references: ['metadata-driven-pipelines', 'data-quality', 'governance'],
    doNotReteach: ['system-design'],
  },
  Governance: {
    canonicalTopic: 'governance',
    references: ['fabric-governance', 'lakehouse-governance', 'azure-security'],
    doNotReteach: ['data-lineage'],
  },
  Security: {
    canonicalTopic: 'azure-security',
    references: ['governance', 'fabric-governance', 'lakehouse-governance'],
    doNotReteach: ['databricks-unity-catalog'],
  },
  Observability: {
    canonicalTopic: 'data-observability',
    references: ['monitoring-logging', 'production-operations', 'finops'],
    doNotReteach: ['system-design'],
  },
  Kafka: {
    canonicalTopic: 'kafka-basics',
    references: ['streaming', 'event-hubs', 'event-driven-architecture'],
    doNotReteach: ['kafka-advanced'],
  },
  Fabric: {
    canonicalTopic: 'microsoft-fabric',
    references: ['fabric-onelake', 'fabric-lakehouse', 'fabric-warehouse', 'fabric-semantic-models'],
    doNotReteach: ['azure-synapse'],
  },
  'AI/RAG': {
    canonicalTopic: 'rag',
    references: ['vector-databases', 'embeddings', 'ai-data-pipelines'],
    doNotReteach: ['ai-for-data-engineers'],
  },
};

export const canonicalConceptMap = conceptHomes;

function humanize(topicId) {
  return topicTitle(topicId);
}

function topicTitle(topicId) {
  if (titleOverrides[topicId]) return titleOverrides[topicId];
  return topicId
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bSql\b/g, 'SQL')
    .replace(/\bDbt\b/g, 'dbt')
    .replace(/\bLlm\b/g, 'LLM')
    .replace(/\bAi\b/g, 'AI')
    .replace(/\bCdc\b/g, 'CDC')
    .replace(/\bPbi\b/g, 'Power BI')
    .replace(/\bAdls\b/g, 'ADLS')
    .replace(/\bIac\b/g, 'IaC');
}

function topicLabel(topicId) {
  const t = topicTitle(topicId);
  if (t.includes('SQL')) return 'SQL';
  if (t.includes('Python')) return 'Python';
  if (t.includes('Fabric')) return 'Fabric';
  if (t.includes('Databricks')) return 'Databricks';
  if (t.includes('Azure Data Factory')) return 'ADF';
  if (t.includes('ADLS')) return 'Storage';
  if (t.includes('AWS')) return 'AWS';
  if (t.includes('Snowflake')) return 'Cloud';
  if (t.includes('dbt')) return 'dbt';
  if (t.includes('Kafka')) return 'Kafka';
  if (t.includes('CDC')) return 'CDC';
  if (t.includes('AI')) return 'AI';
  return 'DE';
}

function topicDifficulty(topicId) {
  if (['sql', 'python', 'git', 'linux-cli', 'etl-vs-elt', 'api-file-ingestion', 'data-quality', 'azure-data-lake-gen2', 'llm-fundamentals', 'prompt-engineering'].includes(topicId)) {
    return 'Beginner';
  }
  if ([
    'data-modeling',
    'data-contracts',
    'metadata-driven-pipelines',
    'azure-data-factory',
    'azure-synapse',
    'microsoft-fabric',
    'azure-security',
    'fabric-onelake',
    'fabric-lakehouse',
    'fabric-warehouse',
    'fabric-semantic-models',
    'fabric-direct-lake',
    'fabric-real-time-analytics',
    'fabric-eventstream',
    'fabric-data-activator',
    'fabric-governance',
    'pyspark',
    'spark-sql',
    'delta-lake',
    'azure-databricks',
    'medallion-architecture',
    'cicd-de',
    'infrastructure-as-code',
    'monitoring-logging',
    'data-observability',
    'cost-optimization',
    'finops',
    'production-operations',
    'cdc',
    'streaming',
    'kafka-basics',
    'event-hubs',
    'event-driven-architecture',
    'data-lineage',
    'governance',
    'data-mesh',
    'lakehouse-governance',
    'ha-dr',
    'multi-region-design',
    'interview-preparation',
    'workplace-scenarios',
    'stakeholder-communication',
    'estimation-planning',
    'embeddings',
    'vector-databases',
    'rag',
    'ai-data-pipelines',
    'ai-evaluation-guardrails',
    'aws-glue',
    'aws-data-stack',
    'snowflake',
    'dbt',
    'kafka-advanced',
  ].includes(topicId)) {
    return 'Intermediate';
  }
  return 'Advanced';
}

function routeForTopic(topicId) {
  return `/learning/${slugify(topicTitle(topicId))}`;
}

export function getCurriculumTopicMeta(topicId) {
  if (!topicId) return null;
  const phase = curriculumTracks.find(p => (p.topicIds ?? []).includes(topicId));
  return {
    id: topicId,
    title: topicTitle(topicId),
    summary: `Learn ${topicTitle(topicId)} in the context of a production Azure data engineering platform.`,
    phaseId: phase?.id ?? null,
    phaseTitle: phase?.title ?? null,
    shortTitle: phase?.shortTitle ?? phase?.title ?? null,
    trackType: phase?.trackType ?? 'legacy',
    order: seniorAzureTopicOrder.indexOf(topicId) + 1,
    estimatedHours: estimatedHoursForTopic(topicId),
    difficulty: topicDifficulty(topicId),
    statusSource: 'curriculum',
    canonicalConcepts: canonicalConceptsFor(topicId),
    references: [],
    relatedLabs: [],
    relatedProjects: [],
    relatedSimulators: [],
    relatedInterviewModes: [],
    route: routeForTopic(topicId),
    prerequisites: topicPrerequisites(topicId),
  };
}

export function getSeniorAzureTopicMeta(topicId) {
  return getCurriculumTopicMeta(topicId);
}

export function getSeniorAzureNextStep(topicId) {
  const index = seniorAzureTopicOrder.indexOf(topicId);
  if (index < 0 || index >= seniorAzureTopicOrder.length - 1) return null;
  const nextId = seniorAzureTopicOrder[index + 1];
  const next = getCurriculumTopicMeta(nextId);
  return {
    id: nextId,
    title: next?.title ?? topicTitle(nextId),
    reason: `Continue with ${next?.title ?? topicTitle(nextId)} to follow the Senior Azure Data Engineer path in order.`,
  };
}

export const seniorAzureTopicMeta = Object.fromEntries(
  seniorAzureTopicOrder.map(topicId => [topicId, getCurriculumTopicMeta(topicId)])
);

function canonicalConceptsFor(topicId) {
  const concepts = [];
  for (const [concept, meta] of Object.entries(conceptHomes)) {
    if (meta.canonicalTopic === topicId) concepts.push(concept);
  }
  return concepts;
}

function topicPrerequisites(topicId) {
  const phase = curriculumTracks.find(p => (p.topicIds ?? []).includes(topicId));
  if (!phase?.prerequisites?.length) return [];
  return phase.prerequisites.slice();
}

function estimatedHoursForTopic(topicId) {
  const phase = curriculumTracks.find(p => (p.topicIds ?? []).includes(topicId));
  if (!phase?.topicIds?.length) return '6-8h';
  const hours = phase.estimatedHours ?? 48;
  const perTopic = Math.max(6, Math.round(hours / phase.topicIds.length));
  return `${Math.max(4, perTopic - 2)}-${perTopic + 2}h`;
}

export function createGenericTopic(topicId) {
  const meta = getCurriculumTopicMeta(topicId);
  return {
    id: topicId,
    title: meta.title,
    label: meta.trackType === 'ai' ? 'AI' : meta.trackType === 'optional' ? 'Optional' : meta.shortTitle ?? 'Topic',
    category: meta.phaseTitle ?? 'Curriculum',
    difficulty: meta.difficulty,
    progress: '0%',
    body: meta.summary,
    overview: [
      { title: 'What is this?', body: `A practical overview of ${meta.title} in a senior Azure data engineering context.` },
      { title: 'Why do we use it?', body: `Because production data platforms need ${meta.title.toLowerCase()} to stay reliable, governable, and interview-ready.` },
      { title: 'Simple example', body: `A typical ${meta.title} workflow in Azure, Fabric, Databricks, or the broader data platform stack.` },
      { title: 'Practice task', body: `Write a short production plan showing how you would apply ${meta.title} in a real data platform.` },
    ],
    questions: [
      { question: `What is ${meta.title}?`, answer: `A production data engineering concept used to design reliable, scalable data platforms.` },
      { question: `Where does ${meta.title} fit in a senior Azure DE role?`, answer: `It sits in the part of the stack that affects reliability, scale, cost, governance, or interview readiness.` },
      { question: `What should you explain in an interview?`, answer: `Use the problem it solves, the trade-offs, and how you would operate it in production.` },
    ],
    module: {
      documentationMapping: [
        {
          concept: meta.title,
          officialSource: 'Official Documentation References',
          sourceUrl: '',
          howThisLessonUsesIt: `This topic is framed around how ${meta.title} is used in real Azure data engineering systems.`,
        },
      ],
      sections: [
        {
          title: `${meta.title} Overview`,
          subtopics: [
            {
              id: `${topicId}-intro`,
              title: 'What it does',
              difficulty: meta.difficulty,
              explanation: meta.summary,
              why: `Because senior data engineers need to use ${meta.title.toLowerCase()} in a way that fits the business and the platform.`,
              syntax: `// ${meta.title}\n// Outline the main steps, dependencies, and outputs here.`,
              example: `# Example workflow for ${meta.title}\n# Source → transform → validate → serve`,
              expectedOutput: `A clear understanding of how ${meta.title} should be used in production.`,
              interview: {
                question: `How would you explain ${meta.title} to a hiring manager?`,
                answer: `Focus on the business problem, the architectural trade-offs, and how you would monitor or operate it in production.`,
              },
              commonMistakes: [
                `Treating ${meta.title} like a demo-only concept instead of something that needs monitoring and support.`,
              ],
              productionContext: `In production, ${meta.title} should be connected to data quality, observability, and clear ownership.`,
              seniorEngineerNote: `Senior engineers explain what ${meta.title} solves, where it belongs in the stack, and the cost/reliability trade-offs.`,
              hint: `Start with the business goal and work backward to the platform design.`,
              solution: `Explain the source, the processing pattern, the serving layer, and the operations story for ${meta.title}.`,
              completionOutcome: `You can now describe ${meta.title} in a senior Azure data engineering interview.`,
            },
            {
              id: `${topicId}-production`,
              title: 'Production usage',
              difficulty: meta.difficulty,
              explanation: `How ${meta.title} shows up in an Azure or Fabric production system.`,
              why: 'Production systems need controls, observability, and a clear failure mode.',
              productionContext: `Use ${meta.title} to support the actual workflow, not as a standalone demo.`,
              architectureRelevance: `Make sure ${meta.title} connects cleanly to the rest of the architecture and does not become a one-off island.`,
              commonMistakes: [`Over-engineering ${meta.title} before the business need is clear.`],
              seniorEngineerNote: `Tie the topic back to scale, cost, governance, and supportability.`,
            },
            {
              id: `${topicId}-practice`,
              title: 'Practice and interview angle',
              difficulty: meta.difficulty,
              explanation: `Practise applying ${meta.title} in a realistic scenario and explain the trade-offs aloud.`,
              why: 'The interview is about how you think, not just whether you know the term.',
              practice: `Describe a pipeline or platform where ${meta.title} is the right choice. Include the business need, the tools, and how you would validate the result.`,
              hint: 'Use a simple source → process → validation → serving flow.',
              solution: `A strong answer names the problem, the implementation, the validation checks, and the operational risks.`,
              expectedOutput: 'A concise, senior-level explanation with a practical example and clear trade-offs.',
              interview: {
                question: `What would you watch for when using ${meta.title} in production?`,
                answer: 'Look for failure handling, cost, governance, freshness, and how the design scales as the data volume grows.',
              },
              completionOutcome: `You can now connect ${meta.title} to a real Azure DE work scenario.`,
            },
          ],
        },
      ],
    },
    whyItMatters: meta.summary,
    learningObjectives: [
      `Understand where ${meta.title} fits in the approved Azure DE curriculum`,
      `Describe the production trade-offs and common failure modes`,
      `Explain the topic using a business-first, interview-ready answer`,
    ],
    realWorldUseCase: `A senior Azure data engineer uses ${meta.title} to solve a business problem in a real production system.`,
    commonMistakes: [
      `Treating ${meta.title} as a standalone theory topic instead of a part of the production workflow.`,
    ],
    practiceTasks: [`Explain how you would apply ${meta.title} in a real Azure data engineering project.`],
    interviewQuestions: [
      {
        question: `How would you use ${meta.title} in a production data platform?`,
        answer: 'Describe the source, the transformation, the validation, and how the result is consumed by the business.',
      },
    ],
    miniProject: {
      title: `${meta.title} Mini Project`,
      goal: `Apply ${meta.title} in a realistic Azure data engineering workflow.`,
      tasks: [`Document a ${meta.title} design with source, transformation, validation, and serving layers.`],
      expectedOutput: `A short design note showing where ${meta.title} belongs in a production platform.`,
    },
    nextStep: null,
    trackType: meta.trackType,
    phase: meta.phaseId,
    route: meta.route,
    canonicalConcepts: meta.canonicalConcepts,
    relatedLabs: meta.relatedLabs,
    relatedProjects: meta.relatedProjects,
    relatedSimulators: meta.relatedSimulators,
    relatedInterviewModes: meta.relatedInterviewModes,
    estimatedTime: meta.estimatedHours,
    timeEstimate: meta.estimatedHours,
    prerequisites: meta.prerequisites,
  };
}

export const seniorAzureAdditionalTopics = seniorAzureTopicOrder.map(topicId => ({
  id: topicId,
  title: topicTitle(topicId),
  category: getCurriculumTopicMeta(topicId)?.phaseTitle ?? 'Curriculum',
  difficulty: topicDifficulty(topicId),
  step: seniorAzureTopicOrder.indexOf(topicId) + 1,
  trackType: getCurriculumTopicMeta(topicId)?.trackType ?? 'legacy',
  phase: getCurriculumTopicMeta(topicId)?.phaseId ?? null,
  estimatedTime: estimatedHoursForTopic(topicId),
  timeEstimate: estimatedHoursForTopic(topicId),
  prerequisites: topicPrerequisites(topicId),
  route: routeForTopic(topicId),
  canonicalConcepts: canonicalConceptsFor(topicId),
  summary: getCurriculumTopicMeta(topicId)?.summary,
}));

export const curriculumTrackSummaries = curriculumTracks.map(phase => ({
  id: phase.id,
  title: phase.title,
  shortTitle: phase.shortTitle,
  trackType: phase.trackType,
  description: phase.description,
  order: phase.order,
  estimatedHours: phase.estimatedHours,
  topicIds: phase.topicIds,
  prerequisites: phase.prerequisites,
  exitCriteria: phase.exitCriteria,
}));

export const seniorAzureRoadmapTrack = {
  id: 'senior-azure-data-engineer',
  title: 'Senior Azure Data Engineer',
  icon: '☁',
  color: '#0078d4',
  description: 'A production-grade career progression from SQL and Python foundations to Azure lakehouse engineering, enterprise analytics, operations, system design, and interviews.',
  duration: '9-12 months',
  difficulty: 'Beginner → Advanced',
  prerequisites: ['Comfort using a computer', 'Willingness to practice SQL and Python weekly'],
  skills: [
    'SQL and Python',
    'Data modeling and dbt',
    'ADF and ADLS Gen2',
    'Databricks, PySpark, and Delta Lake',
    'Synapse and Microsoft Fabric',
    'CI/CD, security, streaming, and monitoring',
    'System design and interview readiness',
  ],
  phases: phaseBlocks.map((phase, index) => ({
    id: phase.id,
    title: `Phase ${index + 1} — ${phase.title}`,
    duration: `${Math.ceil((phase.estimatedHours ?? 48) / 8)}-${Math.ceil((phase.estimatedHours ?? 48) / 6)} weeks`,
    description: phase.description,
    skills: phase.topicIds.map(topicId => getCurriculumTopicMeta(topicId)?.title ?? topicId),
    milestones: phase.topicIds.map(topicId => {
      const topic = getCurriculumTopicMeta(topicId);
      return `Complete ${topic?.title ?? topicId} and explain its production role in an Azure data platform.`;
    }),
    topicIds: phase.topicIds,
  })),
};

export function getCurriculumPhaseByTopicId(topicId) {
  return curriculumTracks.find(phase => (phase.topicIds ?? []).includes(topicId)) ?? null;
}

export function getCurriculumTrackByTopicId(topicId) {
  return getCurriculumPhaseByTopicId(topicId)?.trackType ?? 'legacy';
}

export function normalizeLegacyTopicProgress(completedTopics = {}) {
  const migrated = {};
  for (const [topicId, completed] of Object.entries(completedTopics ?? {})) {
    if (!completed) continue;
    const nextId = curriculumMigrationMap[topicId] ?? topicId;
    migrated[nextId] = true;
  }
  return migrated;
}

export function getCurriculumRouteMap() {
  return curriculumRouteMap;
}
