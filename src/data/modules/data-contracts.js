export const dataContractsModule = {
  documentationMapping: [
    {
      concept: 'Data contracts and governance',
      officialSource: 'Official Documentation References',
      sourceUrl: 'https://learn.microsoft.com/en-us/azure/architecture/data-guide/',
      howThisLessonUsesIt: 'This module explains how schema ownership, compatibility, and quality gates keep Azure data pipelines safe as they evolve.',
    },
  ],
  sections: [
    {
      title: 'Contract Fundamentals',
      subtopics: [
        {
          id: 'data-contract-definition',
          title: 'What is a Data Contract?',
          difficulty: 'Intermediate',
          explanation: 'A data contract is an explicit agreement about schema, semantics, freshness, and ownership between producers and consumers.',
          why: 'Senior teams use contracts to turn assumptions into an interface they can version, test, and govern.',
          syntax: `A good data contract defines:
  - required fields
  - data types and semantics
  - freshness / SLA expectations
  - ownership and escalation path
  - versioning and change policy`,
          example: 'A customer events team publishes a contract for customer_id, event_time, and event_type before the payload lands in ADLS Bronze or Event Hubs.',
          productionContext: 'The contract becomes the rulebook that keeps downstream Databricks, Synapse, Fabric, and Power BI consumers from being surprised by upstream changes.',
          expectedOutput: 'A clear interface that both the producing app team and consuming analytics team can point to when changes happen.',
          interview: {
            question: 'How would you explain a data contract to a hiring manager?',
            answer: 'It is the versioned agreement that tells teams what data will look like, who owns it, how it can evolve, and how breaking changes are prevented or coordinated.',
          },
          practice: 'Describe the contract for a customer-order event stream that feeds Bronze, Silver, and Gold.',
          hint: 'Think schema, freshness, ownership, and versioning — not just column names.',
          solution: `# Contract checklist
1. Define required columns and their types.
2. State freshness and SLA expectations.
3. Document producer and consumer ownership.
4. Add versioning and a change policy.
5. Link the contract to pipeline validation.`,
        },
        {
          id: 'data-contract-ownership',
          title: 'Producer vs Consumer Ownership',
          difficulty: 'Intermediate',
          explanation: 'The producer owns the contract and the consumer defines what it depends on.',
          why: 'Ownership clarity prevents the usual “the pipeline team should fix it” / “the app team changed it” blame loop.',
          syntax: `Ownership pattern:
  Producer  → publishes contract, announces changes, ships versions
  Consumer  → declares dependencies, validates expectations, upgrades on schedule`,
          example: 'An API team changes a JSON field name and gives the analytics team a versioned migration window instead of breaking the nightly load.',
          productionContext: 'Ownership should be visible in the metadata, change process, and escalation path so the right team gets paged first.',
          expectedOutput: 'A contract that says who changes it, who approves it, and who gets notified when it changes.',
          interview: {
            question: 'Who should own a data contract in a production platform?',
            answer: 'The producer owns the contract, the consumer defines what it needs, and both sides agree on compatibility, versioning, and release communication.',
          },
          practice: 'Explain what happens when a source team wants to rename a field that several downstream consumers already use.',
          hint: 'Talk about communication, versioning, and a safe migration window.',
          solution: `# Ownership rule
Producer maintains the schema contract.
Consumer documents dependencies.
Both teams agree on compatibility and release timing.`,
        },
      ],
    },
    {
      title: 'Enforcement and Change Control',
      subtopics: [
        {
          id: 'data-contract-evolution',
          title: 'Schema Evolution & Backward Compatibility',
          difficulty: 'Advanced',
          explanation: 'Backward-compatible evolution adds or extends fields without breaking older consumers; breaking changes need versioning and migration.',
          why: 'Senior engineers must keep the platform moving without turning every schema change into a production incident.',
          syntax: `Safe evolution:
  - add nullable fields
  - keep old versions readable
  - version payloads when needed
  - document compatibility windows`,
          example: 'A source adds discount_amount as a nullable field, then later retires a field only after consumers have migrated to the new version.',
          productionContext: 'If you rename or remove a field without a plan, Bronze may still land the payload, but Silver, Gold, and BI will break downstream.',
          expectedOutput: 'A versioning approach that makes a new contract readable by old consumers until the migration is complete.',
          interview: {
            question: 'What makes a schema change backward-compatible?',
            answer: 'Additive changes that old consumers can ignore are usually safe; renames, removals, and type changes are breaking and need a versioning or migration plan.',
          },
          practice: 'Describe how you would introduce a new field to a contract without breaking old consumers.',
          hint: 'Additive beats destructive; version the contract when you cannot remain compatible.',
          solution: `# Backward-compatible change
1. Add the field as nullable or optional.
2. Keep the old payload version available.
3. Let consumers migrate on a published timeline.
4. Remove the old version only after adoption is complete.`,
        },
        {
          id: 'data-contract-testing',
          title: 'Contract Testing & Quality Gates',
          difficulty: 'Advanced',
          explanation: 'Contract tests validate the schema before deployment; quality gates validate the content before promotion.',
          why: 'A senior Azure DE should stop bad data at the boundary rather than cleaning up a broken Gold table later.',
          syntax: `Validation layers:
  - contract test in CI
  - schema enforcement at ingest
  - quality gates before Silver/Gold
  - quarantine for failing records`,
          example: 'A pull request fails because the source dropped a required customer_id field, so the pipeline never reaches production.',
          productionContext: 'This keeps broken schema changes out of ADF, Databricks, Synapse, and Fabric release paths.',
          expectedOutput: 'A build or release that fails fast before the new payload reaches consumers.',
          interview: {
            question: 'Where would you run contract testing in Azure?',
            answer: 'I would run it in CI and again at pipeline ingress so bad schema changes fail before they can reach Bronze, Silver, or Gold.',
          },
          practice: 'Show how a contract test would block a missing required field before a deployment finishes.',
          hint: 'The goal is to fail fast and early, not to discover the problem after a dashboard breaks.',
          solution: `# Contract test flow
1. Validate sample payloads in CI.
2. Reject breaking schema changes before deploy.
3. Enforce schema at the ingestion boundary.
4. Route bad records to quarantine when possible.`,
        },
        {
          id: 'data-contract-architecture',
          title: 'Metadata-Driven Pipelines & Contract-Driven Architecture',
          difficulty: 'Advanced',
          explanation: 'Metadata-driven pipelines store contract rules, owners, and validation logic in configuration instead of hardcoding them in every job.',
          why: 'It scales better than cloning pipelines and makes contract enforcement auditable and repeatable.',
          syntax: `Metadata example:
  source_name
  expected_schema
  freshness_sla
  owner_team
  validation_rules
  quarantine_path`,
          example: 'ADF reads a config table that contains the expected schema and validation rules, then routes failing rows to quarantine while the good rows continue to Silver.',
          productionContext: 'This turns the contract into a control plane for the platform and keeps one release path consistent across many sources.',
          expectedOutput: 'A reusable ingestion pattern where new sources are onboarded through metadata, not custom code.',
          interview: {
            question: 'How do metadata-driven pipelines support contract-driven architecture?',
            answer: 'They make the contract executable: the pipeline reads the rules, validates the payload, logs ownership, and promotes only compliant data.',
          },
          practice: 'Describe the metadata you would store for a new source before it is allowed into the platform.',
          hint: 'Think owner, schema, SLA, and quarantine path.',
          solution: `# Metadata-driven contract control
1. Store source schema and owner in a config table.
2. Read the contract at runtime.
3. Validate and quarantine failures.
4. Promote only contract-compliant rows.`,
        },
      ],
    },
  ],
  miniProjects: [
    {
      title: 'Customer Events Contract',
      goal: 'Define a production-ready contract for a customer events pipeline and show how it is enforced.',
      tasks: [
        'List the required fields and owners.',
        'Describe a safe schema evolution plan.',
        'Show where the contract test and quality gate would run.',
      ],
      expectedOutput: 'A short design note that shows how the contract protects Bronze, Silver, and Gold.',
    },
  ],
};
