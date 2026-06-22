import { pythonModule } from './python.js';

function uniqueArray(values = []) {
  return [...new Set(values.filter(Boolean))];
}

function createLesson({
  id,
  title,
  difficulty = 'Intermediate',
  explanation,
  why,
  realWorldUsage,
  azureUsage,
  databricksUsage,
  syntax,
  example,
  expectedOutput,
  practiceTask,
  interviewQuestion,
  interviewAnswer,
  commonMistakes = [],
  performanceConsiderations,
  resumeTips,
  productionContext,
  seniorEngineeringInsights,
}) {
  return {
    id,
    title,
    difficulty,
    explanation,
    what: explanation,
    beginnerExplanation: explanation,
    why,
    realWorldUsage,
    realWorldBusinessExample: realWorldUsage,
    azureUsage,
    azureRelevance: azureUsage,
    databricksUsage,
    databricksRelevance: databricksUsage,
    syntax,
    example,
    expectedOutput,
    practice: practiceTask,
    practiceTask,
    hint: 'Anchor your answer to an Azure production pipeline, then explain what would break if you skipped this step.',
    solution: interviewAnswer,
    interview: {
      question: interviewQuestion,
      answer: interviewAnswer,
    },
    interviewQuestion,
    commonMistakes,
    productionContext: productionContext ?? realWorldUsage,
    performanceTip: performanceConsiderations,
    performanceConsiderations,
    resumeTips,
    resumeFraming: resumeTips,
    seniorEngineeringInsights: seniorEngineeringInsights ?? interviewAnswer,
  };
}

function enrichLesson(lesson, sectionTitle) {
  const explanation = lesson.explanation ?? lesson.what ?? `${lesson.title} in a practical Azure data engineering context.`;
  const interviewQuestion = lesson.interviewQuestion ?? lesson.interview?.question ?? `How would you use ${lesson.title} in a production Azure data platform?`;
  const interviewAnswer =
    lesson.interview?.answer ??
    lesson.solution ??
    `Explain the business problem, the Azure implementation choice, the validation checks, and the operational risks for ${lesson.title}.`;

  const commonMistakes = Array.isArray(lesson.commonMistakes)
    ? lesson.commonMistakes
    : lesson.commonMistakes
      ? [lesson.commonMistakes]
      : [];

  return {
    ...lesson,
    explanation,
    what: lesson.what ?? explanation,
    beginnerExplanation: lesson.beginnerExplanation ?? explanation,
    why:
      lesson.why ??
      `${lesson.title} matters because data engineers use it inside ${sectionTitle.toLowerCase()} work that must be reliable, testable, and supportable in production.`,
    realWorldUsage:
      lesson.realWorldUsage ??
      lesson.productionContext ??
      `A production Azure data pipeline uses ${lesson.title} while loading, transforming, validating, or serving data for downstream consumers.`,
    realWorldBusinessExample:
      lesson.realWorldBusinessExample ??
      lesson.realWorldUsage ??
      lesson.productionContext ??
      `Teams apply ${lesson.title} to keep data movement and transformations reliable in real delivery environments.`,
    azureUsage:
      lesson.azureUsage ??
      lesson.azureRelevance ??
      `In Azure, ${lesson.title} typically appears in ADF, Synapse, Fabric, Key Vault, or CI/CD workflows depending on where the pipeline runs.`,
    azureRelevance:
      lesson.azureRelevance ??
      lesson.azureUsage ??
      `Use ${lesson.title} to keep Azure-based data platform workflows stable, governed, and repeatable.`,
    databricksUsage:
      lesson.databricksUsage ??
      lesson.databricksRelevance ??
      `In Databricks, ${lesson.title} usually shows up in notebook jobs, workflow orchestration, Delta pipelines, or troubleshooting tasks.`,
    databricksRelevance:
      lesson.databricksRelevance ??
      lesson.databricksUsage ??
      `Senior engineers should be able to explain how ${lesson.title} changes when the workload runs on Databricks.`,
    syntax: lesson.syntax ?? `# ${lesson.title}\n# Outline the core steps, inputs, validations, and outputs.`,
    example:
      lesson.example ??
      `Use ${lesson.title} in a small but realistic Azure data engineering scenario with source, transformation, validation, and serving layers.`,
    expectedOutput:
      lesson.expectedOutput ?? `A production-ready outcome where ${lesson.title} improves reliability, correctness, or delivery speed.`,
    practice: lesson.practice ?? lesson.practiceTask ?? `Apply ${lesson.title} to a realistic Azure data engineering scenario and explain how you would validate the result.`,
    practiceTask:
      lesson.practiceTask ?? lesson.practice ?? `Apply ${lesson.title} to a realistic Azure data engineering scenario and explain how you would validate the result.`,
    hint:
      lesson.hint ??
      'Mention data volume, failure handling, retry behavior, and what you would monitor after deployment.',
    solution: lesson.solution ?? interviewAnswer,
    interviewQuestion,
    interview: {
      question: interviewQuestion,
      answer: interviewAnswer,
    },
    commonMistakes: uniqueArray([
      ...commonMistakes,
      `Treating ${lesson.title} like theory instead of connecting it to validation, observability, and operational ownership.`,
    ]),
    productionContext:
      lesson.productionContext ??
      lesson.realWorldUsage ??
      `Production use of ${lesson.title} should be observable, parameterized, and safe to rerun without corrupting downstream data.`,
    performanceTip:
      lesson.performanceTip ??
      lesson.performanceConsiderations ??
      `Explain how ${lesson.title} affects cost, latency, retries, or cluster/resource usage before calling the design production-ready.`,
    performanceConsiderations:
      lesson.performanceConsiderations ??
      lesson.performanceTip ??
      `Explain how ${lesson.title} affects cost, latency, retries, or cluster/resource usage before calling the design production-ready.`,
    resumeTips:
      lesson.resumeTips ??
      lesson.resumeFraming ??
      `Frame ${lesson.title} as a delivered engineering outcome with scope, reliability controls, and business impact.`,
    resumeFraming:
      lesson.resumeFraming ??
      lesson.resumeTips ??
      `Frame ${lesson.title} as a delivered engineering outcome with scope, reliability controls, and business impact.`,
    seniorEngineeringInsights:
      lesson.seniorEngineeringInsights ??
      interviewAnswer,
  };
}

function cloneModule(module, sectionAppender) {
  return {
    ...module,
    sections: sectionAppender(
      module.sections.map(section => ({
        ...section,
        subtopics: section.subtopics.map(subtopic => enrichLesson(subtopic, section.title)),
      })),
    ),
  };
}

export const pythonProductionQualityModule = cloneModule(pythonModule, sections => [
  ...sections,
  {
    title: 'Production Python for Data Engineering',
    subtopics: [
      createLesson({
        id: 'py-production-packaging',
        title: 'Packaging, Parameters, and Reusable ETL Code',
        difficulty: 'Intermediate',
        explanation: 'Production Python pipelines should be structured as reusable modules with clear entry points, parameter handling, and testable functions rather than one giant notebook cell or script.',
        why: 'Senior data engineers are expected to turn exploratory code into maintainable jobs that can run in dev, test, and prod without manual edits.',
        realWorldUsage: 'A CRM ingestion job reads environment-specific config, authenticates with Key Vault-backed secrets, and reuses the same extraction/validation package across ADF, Fabric, and Databricks orchestrations.',
        azureUsage: 'Use environment variables, Key Vault references, and deployment parameters from Azure DevOps or GitHub Actions so the same Python package can run across environments.',
        databricksUsage: 'In Databricks, move shared helpers into workspace files or repos, keep notebooks thin, and call tested Python functions from workflow jobs.',
        syntax: `def main(config_path: str, load_date: str) -> None:\n    config = load_config(config_path)\n    records = extract_records(config, load_date)\n    validated = validate_records(records)\n    write_bronze(validated, config, load_date)\n\nif __name__ == \"__main__\":\n    main(config_path=\"conf/dev.yml\", load_date=\"2026-06-17\")`,
        example: 'Package extraction, schema validation, and sink writing into separate Python modules so one codebase supports both backfills and daily runs.',
        expectedOutput: 'A reusable Python ETL package that supports environment promotion, testing, and safe reruns.',
        practiceTask: 'Refactor a single-file API ingestion script into extract, validate, and load functions with a parameterized main entry point.',
        interviewQuestion: 'How do you know a Python data pipeline script is production-ready?',
        interviewAnswer: 'It is parameterized, testable, environment-aware, secrets-safe, observable, and idempotent. The code should separate business logic from runtime configuration and support reruns without manual edits.',
        commonMistakes: [
          'Keeping all logic in one notebook cell or script file.',
          'Hardcoding environment-specific paths, table names, or secrets.',
          'Skipping packaging until the code is already hard to test.',
        ],
        performanceConsiderations: 'Reusable code reduces duplicate API calls and repeated transformation logic, and it makes profiling easier when a single function is slow.',
        resumeTips: 'Built reusable Python ETL packages with environment parameters, validation logic, and deployment-ready entry points for Azure data pipelines.',
      }),
      createLesson({
        id: 'py-api-retries-backoff',
        title: 'API Retries, Backoff, and Idempotent Extraction',
        difficulty: 'Intermediate',
        explanation: 'Reliable API ingestion needs retry policies, exponential backoff, idempotent writes, and checkpointing so transient failures do not create duplicates or data loss.',
        why: 'Most real source systems rate-limit, timeout, or occasionally return incomplete payloads. Senior engineers design Python extractors to survive those conditions.',
        realWorldUsage: 'An order API returns HTTP 429 during peak traffic. The ingestion code retries with backoff, preserves the last-successful watermark, and resumes without reloading already-landed pages.',
        azureUsage: 'ADF or Fabric can orchestrate the Python job, but the retry/backoff logic still belongs in the code or in a robust source connector design.',
        databricksUsage: 'Databricks notebooks often call REST APIs for SaaS ingestion. Jobs should store watermarks, response metadata, and run IDs in Delta audit tables.',
        syntax: `for attempt in range(1, max_retries + 1):\n    response = call_api(url, token)\n    if response.status_code == 200:\n        return response.json()\n    if response.status_code in {429, 500, 502, 503}:\n        sleep(base_delay * attempt)\n        continue\n    raise RuntimeError(f\"Non-retryable API failure: {response.status_code}\")`,
        example: 'Persist the last processed cursor in a control table, retry rate-limit failures, and write raw payloads with request metadata for replay.',
        expectedOutput: 'An API extractor that can restart safely after transient failure and avoids duplicate landing data.',
        practiceTask: 'Write a retry policy for a paginated REST extraction that must handle 429, 500, and token expiry without duplicating landed rows.',
        interviewQuestion: 'What makes a Python API ingestion job idempotent?',
        interviewAnswer: 'It tracks source checkpoints or watermarks, writes deterministic target keys, and can rerun the same window without creating duplicate records. Retry logic alone is not enough; the sink behavior must also be safe.',
        commonMistakes: [
          'Retrying everything including authentication and schema errors.',
          'Appending raw data without a watermark or deduplication key.',
          'Storing retry state only in memory instead of a control table.',
        ],
        performanceConsiderations: 'Over-aggressive retries can increase vendor cost and trigger throttling. Balance parallelism, backoff, and batch size carefully.',
        resumeTips: 'Implemented idempotent Python API ingestion with retry/backoff, watermark checkpointing, and audit-table driven recovery.',
      }),
      createLesson({
        id: 'py-logging-testing-observability',
        title: 'Logging, Testing, and Observability for Python Pipelines',
        difficulty: 'Intermediate',
        explanation: 'Python data jobs need structured logs, unit tests, and run-level observability so teams can detect failures, understand row-level impact, and support production incidents quickly.',
        why: 'Without logs and tests, a script may “work” until the first bad file, schema drift event, or silent truncation makes downstream numbers wrong.',
        realWorldUsage: 'A nightly pipeline starts dropping rows after a source change. Structured logs show the invalid record count spike, unit tests catch the schema mismatch in CI, and the run record points support engineers to the failing transformation.',
        azureUsage: 'Send Python job logs to Log Analytics, Application Insights, or audit tables and include run IDs that tie back to ADF or Fabric pipeline executions.',
        databricksUsage: 'Log record counts and failure context into Delta audit tables so Databricks jobs can be debugged from notebooks, workflows, and BI dashboards.',
        syntax: `logger.info(\"bronze_load_complete\", extra={\n    \"run_id\": run_id,\n    \"rows_in\": rows_in,\n    \"rows_out\": rows_out,\n    \"watermark\": watermark,\n})`,
        example: 'Add pytest coverage for schema validation helpers and write run-level audit records that capture rows read, rows rejected, and target partitions updated.',
        expectedOutput: 'A Python pipeline with testable logic, searchable logs, and run-level diagnostics for support.',
        practiceTask: 'Design the minimum audit record and log fields you would store for a Python ingestion job that writes Bronze data daily.',
        interviewQuestion: 'What observability signals should every Python data pipeline emit?',
        interviewAnswer: 'At minimum: run ID, source window, rows read, rows rejected, rows written, duration, target location, and failure reason. Senior engineers also track freshness, schema drift, and retry counts.',
        commonMistakes: [
          'Logging free-form strings without run IDs or metrics.',
          'Only testing happy-path parsing logic.',
          'Treating notebook output as sufficient production monitoring.',
        ],
        performanceConsiderations: 'Logging too much raw row data can become expensive and noisy. Prefer summary metrics, sample errors, and targeted debug logs.',
        resumeTips: 'Added structured logging, audit metrics, and unit tests to Python data pipelines, reducing mean time to diagnose production issues.',
      }),
    ],
  },
]);

export const apiFileIngestionModule = {
  sections: [
    {
      title: 'API and File Ingestion Foundations',
      subtopics: [
        createLesson({
          id: 'api-file-sources-patterns',
          title: 'Batch Files vs APIs as Source Systems',
          difficulty: 'Beginner',
          explanation: 'Data engineers ingest from both files and APIs, but the failure modes, metadata, and idempotency controls are different for each source type.',
          why: 'If you treat an API like a flat file or treat a file drop like a transactional source, you miss the controls needed for correctness and supportability.',
          realWorldUsage: 'A retail team receives nightly supplier CSV files in ADLS while also polling a CRM REST API every hour for new customer updates.',
          azureUsage: 'ADF, Fabric Pipelines, or Azure Functions commonly orchestrate file drops and API pulls into ADLS or OneLake Bronze zones.',
          databricksUsage: 'Databricks often takes over after landing, using Auto Loader for files or notebook jobs for API extraction and downstream Silver transformation.',
          syntax: `File pattern: source landing path -> metadata validation -> Bronze write\nAPI pattern: auth -> pagination -> checkpoint -> raw payload landing -> Bronze normalization`,
          example: 'Compare a daily `orders_2026_06_17.csv` landing pattern with a paginated `/customers?updated_after=...` API extractor.',
          expectedOutput: 'A source-aware ingestion design that preserves raw input and uses the right validation strategy.',
          practiceTask: 'Design one Bronze ingestion flow for a daily CSV and one for an incremental REST API source. Explain what metadata you would capture for each.',
          interviewQuestion: 'How do file ingestion and API ingestion differ operationally?',
          interviewAnswer: 'Files are usually batch- and arrival-driven, so you validate naming, size, schema, and landing completeness. APIs require auth, pagination, rate-limit handling, checkpointing, and replay-safe loading.',
          commonMistakes: [
            'Using one ingestion template for both files and APIs.',
            'Skipping source metadata capture such as file size, checksum, or API cursor.',
            'Loading directly to Silver without a raw Bronze landing zone.',
          ],
          performanceConsiderations: 'Source-aware ingestion prevents unnecessary reprocessing and makes it easier to scale parallelism safely.',
          resumeTips: 'Built source-specific ingestion patterns for batch files and REST APIs with raw landing, checkpointing, and validation metadata.',
        }),
        createLesson({
          id: 'api-file-landing-bronze',
          title: 'Bronze Landing, Metadata, and Replay Safety',
          difficulty: 'Intermediate',
          explanation: 'A robust Bronze layer stores the raw file or payload, the ingestion metadata, and enough lineage to replay or reprocess data later without ambiguity.',
          why: 'Senior data engineers preserve original evidence so they can recover from downstream bugs, schema drift, or incorrect business logic without re-pulling the source blindly.',
          realWorldUsage: 'A malformed source file causes Silver parsing to fail. The team fixes the parser and reprocesses the exact Bronze artifact using the stored file path, checksum, and run ID.',
          azureUsage: 'Store raw assets in ADLS Gen2 or OneLake Bronze paths with partitioned landing folders, control tables, and ingestion audit logs.',
          databricksUsage: 'Use Delta audit tables to track source file names, API cursors, request timestamps, and replay windows for notebook or workflow-driven ingestion.',
          syntax: `bronze/<domain>/<source>/<ingest_date>/raw_file_or_payload\ncontrol.ingestion_audit(run_id, source_name, watermark, rows_landed, checksum, status)`,
          example: 'Landing raw JSON payloads from a payments API alongside an audit table that tracks request window, response count, and retry attempts.',
          expectedOutput: 'A replayable Bronze landing zone with raw data, metadata, and auditable lineage.',
          practiceTask: 'Define the minimum metadata columns you would store for a Bronze landing table that supports both file and API ingestion.',
          interviewQuestion: 'What metadata is mandatory for replay-safe ingestion?',
          interviewAnswer: 'At minimum: run ID, source identifier, source window or cursor, landed timestamp, raw object path, row count or payload count, status, and ideally a checksum or hash. Without those, replay and RCA become guesswork.',
          commonMistakes: [
            'Overwriting raw files instead of versioning by load window.',
            'Tracking row counts but not source windows or object paths.',
            'Keeping audit state only in orchestrator logs.',
          ],
          performanceConsiderations: 'Compact audit tables and partitioned Bronze folders make backfills faster and reduce operational hunting time.',
          resumeTips: 'Implemented Bronze landing standards with raw object lineage, replay metadata, and audit-table driven recovery.',
        }),
        createLesson({
          id: 'api-file-validation-controls',
          title: 'Validation, Reconciliation, and Operational Controls',
          difficulty: 'Intermediate',
          explanation: 'Ingestion is not done when data lands. You still need schema checks, row-count validation, duplicate detection, quarantine handling, and reconciliation against the source expectation.',
          why: 'The biggest ingestion failures are silent ones: missing files, partial API pages, duplicate records, or schema drift that technically “loads” but breaks analytics later.',
          realWorldUsage: 'A vendor sends the right file name but only half the rows. Validation compares landed row count to the control total and sends the file to quarantine instead of promoting bad data.',
          azureUsage: 'ADF, Synapse, or Fabric can orchestrate validation steps, but the data quality logic itself usually lives in SQL, Spark, or Python checks against Bronze and Silver tables.',
          databricksUsage: 'Databricks jobs commonly calculate source-to-target reconciliation metrics and write quarantine rows for malformed records into Delta side tables.',
          syntax: `SELECT source_count, landed_count, source_count - landed_count AS variance\nFROM control.reconciliation_results\nWHERE run_id = :run_id;`,
          example: 'After an API load, compare expected pages vs received pages, landed payload count vs raw rows, and deduplicated Silver count vs source unique keys.',
          expectedOutput: 'A pass/fail validation result with explicit variance metrics and a clear next action.',
          practiceTask: 'Write a validation checklist for a daily Bronze ingestion that must detect missing files, duplicate rows, and truncated API responses.',
          interviewQuestion: 'What reconciliation checks would you add to a production ingestion pipeline?',
          interviewAnswer: 'At minimum: source-to-landed row counts, duplicate key checks, schema drift detection, null/business-key validation, and run-status metrics tied to a control table. The goal is to catch silent partial loads before downstream users do.',
          commonMistakes: [
            'Assuming successful copy means successful ingestion.',
            'Validating only final Silver output and ignoring Bronze completeness.',
            'Not defining quarantine behavior for bad records or missing files.',
          ],
          performanceConsiderations: 'Validation should be targeted and incremental; do not force a full historical scan when only today’s partition changed.',
          resumeTips: 'Added reconciliation, quarantine, and schema-validation controls to production ingestion pipelines across API and file sources.',
        }),
      ],
    },
  ],
};

export const metadataDrivenPipelinesModule = {
  sections: [
    {
      title: 'Metadata-Driven Pipeline Design',
      subtopics: [
        createLesson({
          id: 'metadata-driven-core',
          title: 'What Metadata-Driven Pipelines Solve',
          difficulty: 'Intermediate',
          explanation: 'Metadata-driven pipelines externalize source configuration, target mappings, load rules, and validation logic into control tables or config files so one pipeline pattern can run many datasets.',
          why: 'Senior engineers reduce maintenance by scaling with metadata instead of cloning 40 nearly identical ADF or Fabric pipelines.',
          realWorldUsage: 'A team ingests 60 source tables using one parameterized pipeline that reads source connection info, target Bronze paths, watermark columns, and validation rules from a control table.',
          azureUsage: 'ADF and Fabric Pipelines use Lookup + ForEach + parameterized datasets, while Azure SQL or Delta control tables hold source metadata.',
          databricksUsage: 'Databricks jobs can read metadata tables to dynamically choose source paths, partition filters, target tables, and transformation notebooks.',
          syntax: `control.pipeline_config(source_name, source_type, load_type, watermark_column, target_path, target_table, validation_rule)\nLookup config -> ForEach dataset -> parameterized copy/notebook`,
          example: 'Use one ADF pipeline to process `orders`, `customers`, and `inventory` by reading table-specific settings from `control.pipeline_config`.',
          expectedOutput: 'A reusable ingestion pattern driven by metadata instead of duplicated orchestration assets.',
          practiceTask: 'Design the minimum columns you would store in a metadata table to drive ten similar Bronze ingestion pipelines.',
          interviewQuestion: 'Why do teams move from hardcoded pipelines to metadata-driven design?',
          interviewAnswer: 'Because hardcoded pipelines do not scale operationally. Metadata-driven design reduces duplication, speeds onboarding of new sources, and centralizes load logic, validation rules, and environment-specific configuration.',
          commonMistakes: [
            'Overcomplicating metadata tables before the base pattern is stable.',
            'Hiding business logic in metadata fields that nobody can debug.',
            'Creating metadata-driven copy pipelines without operational ownership of the control tables.',
          ],
          performanceConsiderations: 'Metadata-driven design saves development time, but poorly designed lookup loops can slow orchestration. Batch related workloads and cache config where appropriate.',
          resumeTips: 'Implemented metadata-driven Azure data pipelines that scaled one parameterized pattern across multiple source systems and target tables.',
        }),
        createLesson({
          id: 'metadata-driven-control-tables',
          title: 'Control Tables, Watermarks, and Dynamic Orchestration',
          difficulty: 'Intermediate',
          explanation: 'A production metadata-driven pattern needs both configuration tables and runtime control tables that capture last-successful watermark, run status, retry count, and target row metrics.',
          why: 'Configuration tells the pipeline what to do; runtime control tells you what actually happened and whether the next run can continue safely.',
          realWorldUsage: 'An hourly customer delta pipeline reads the configured watermark column, pulls only changed records, writes the new watermark on success, and blocks the next run if reconciliation fails.',
          azureUsage: 'Store pipeline configuration in Azure SQL / Fabric Warehouse and use ADF or Fabric Lookup activities to feed parameters into Copy, Notebook, or Stored Procedure steps.',
          databricksUsage: 'Databricks workflows often maintain watermark and run history in Delta control tables so Spark jobs can resume incrementally after a failure.',
          syntax: `control.pipeline_runtime(source_name, last_successful_watermark, last_run_id, last_status, rows_read, rows_written, updated_at)`,
          example: 'A Fabric pipeline uses a Lookup to read the active source list, a ForEach to launch per-table notebooks, and a Stored Procedure to update runtime state after each success.',
          expectedOutput: 'A metadata-driven orchestration flow that supports incremental loads, retries, and run-level observability.',
          practiceTask: 'Define separate columns for configuration vs runtime state in a metadata-driven Bronze-to-Silver ingestion design.',
          interviewQuestion: 'What runtime metadata is required for safe incremental orchestration?',
          interviewAnswer: 'At minimum: source identifier, active/inactive flag, load type, watermark column, last-successful watermark, last run status, rows read/written, and failure message or retry count. Without that split between config and runtime, support and replay become painful.',
          commonMistakes: [
            'Using one table for both static config and volatile runtime state.',
            'Updating the watermark before validation succeeds.',
            'Launching dynamic pipelines without recording per-source status.',
          ],
          performanceConsiderations: 'Keep runtime tables narrow and indexed on source name plus run timestamp; orchestration queries hit them frequently.',
          resumeTips: 'Built metadata and runtime control tables that enabled parameterized incremental loading, status tracking, and replay-safe orchestration.',
        }),
        createLesson({
          id: 'metadata-driven-governance',
          title: 'Governance, Testing, and Failure Handling',
          difficulty: 'Senior',
          explanation: 'Metadata-driven pipelines need governance rules, validation gates, and failure semantics just like code-based pipelines. Otherwise you create a scalable source of confusion.',
          why: 'At senior level, the question is not whether the pattern is dynamic. It is whether the team can test, audit, and support it when dozens of datasets rely on the same engine.',
          realWorldUsage: 'A bad metadata change points a source to the wrong target table. Because the config is versioned, tested, and promoted through CI/CD, the issue is caught in test before production data is overwritten.',
          azureUsage: 'Store metadata in versioned SQL scripts or deployment templates, validate it in CI, and gate production promotion with approval plus regression checks.',
          databricksUsage: 'Use Delta expectations, config validation notebooks, and schema checks before applying metadata-driven changes to shared workflows.',
          syntax: `Config validation -> deployment approval -> runtime smoke test -> data reconciliation -> watermark advance`,
          example: 'A CI step verifies that every active source has a valid target path, supported load type, owner, and reconciliation rule before deployment.',
          expectedOutput: 'A metadata-driven architecture that is auditable, supportable, and safe to promote across environments.',
          practiceTask: 'Create a pre-deployment validation checklist for metadata-driven pipeline changes that would prevent bad config from reaching production.',
          interviewQuestion: 'What is the biggest risk in metadata-driven pipelines at scale?',
          interviewAnswer: 'The control layer becomes a hidden codebase. If config is ungoverned, untested, or not versioned, one metadata mistake can break dozens of pipelines at once. Senior engineers treat metadata as code with validation, approval, and lineage.',
          commonMistakes: [
            'Letting analysts edit critical runtime metadata directly in production.',
            'Skipping CI validation because “it is just configuration.”',
            'No ownership model for who can activate or change pipeline metadata.',
          ],
          performanceConsiderations: 'Metadata engines should fail fast on bad config so they do not waste cluster time or orchestration minutes launching doomed runs.',
          resumeTips: 'Introduced metadata-as-code practices, config validation, and failure gates for dynamic data pipeline orchestration.',
        }),
      ],
    },
  ],
};

export const fabricEventstreamModule = {
  sections: [
    {
      title: 'Fabric Eventstream Essentials',
      subtopics: [
        createLesson({
          id: 'eventstream-what-is',
          title: 'What Eventstream Does in a Fabric Architecture',
          difficulty: 'Intermediate',
          explanation: 'Fabric Eventstream is the low-code streaming ingestion layer in Real-Time Intelligence. It captures events from sources like Event Hubs, Kafka, or IoT Hub and routes them into Eventhouse, Lakehouse, or other sinks.',
          why: 'It helps Azure data engineers build near-real-time ingestion without writing a custom consumer for every telemetry or clickstream source.',
          realWorldUsage: 'An IoT team ingests device telemetry through Eventstream, filters malformed events, writes hot operational data to Eventhouse, and lands a copy in Lakehouse for longer-term analysis.',
          azureUsage: 'Eventstream commonly connects to Azure Event Hubs, IoT Hub, or Fabric-native sources when organizations standardize on the Microsoft data stack.',
          databricksUsage: 'Databricks may still process downstream Bronze or Silver layers, but Eventstream can provide the managed ingestion front door instead of custom streaming code.',
          syntax: `Source -> Eventstream transforms -> Eventhouse / Lakehouse destination\nTransforms: filter, route, aggregate, project fields`,
          example: 'Route valid sensor events to Eventhouse for low-latency queries and route suspicious malformed events to a dead-letter stream for support review.',
          expectedOutput: 'A governed event-ingestion flow with clear sinks for analytics and replay.',
          practiceTask: 'Design an Eventstream that ingests Event Hubs telemetry, filters invalid device IDs, and sends the clean stream to an Eventhouse table.',
          interviewQuestion: 'When would you use Fabric Eventstream instead of custom Spark streaming ingestion?',
          interviewAnswer: 'Use Eventstream when the pattern is mostly source capture, simple routing, filtering, and low-code operational analytics. Use Spark when you need complex stateful transformations, custom enrichment, or advanced streaming logic.',
          commonMistakes: [
            'Treating Eventstream as a full replacement for all streaming engines.',
            'Not defining a replay or dead-letter strategy for malformed events.',
            'Skipping duplicate-handling assumptions at the destination.',
          ],
          performanceConsiderations: 'Partition count and sink design still matter. Eventstream simplifies ingestion, but downstream throughput limits do not disappear.',
          resumeTips: 'Implemented Fabric Eventstream ingestion for real-time Azure telemetry with filtered routing into operational and historical analytics sinks.',
        }),
        createLesson({
          id: 'eventstream-routing-ops',
          title: 'Routing, Validation, and Streaming Operations',
          difficulty: 'Senior',
          explanation: 'Real streaming value comes from how you route, validate, and operate the stream after the connector is in place. Senior engineers plan for duplicates, malformed events, and lag visibility from day one.',
          why: 'A stream that lands events but offers no operational insight is still a support problem waiting to happen.',
          realWorldUsage: 'A retail clickstream source spikes during a campaign. Eventstream routes normal traffic to Eventhouse, preserves raw event copies in Lakehouse, and flags malformed events for operations dashboards.',
          azureUsage: 'Azure Event Hubs metrics and Fabric monitoring together help teams reason about ingestion lag, throughput, and source throttling.',
          databricksUsage: 'Databricks can subscribe to downstream Lakehouse Bronze data for deeper transformations while Eventstream remains the ingestion and routing layer.',
          syntax: `Valid stream -> Eventhouse\nReplay/archive stream -> Lakehouse Bronze\nError stream -> dead-letter destination`,
          example: 'Create three routes: primary analytics, raw archive, and dead-letter, then record event counts for each route per run window.',
          expectedOutput: 'A streaming ingestion design that is observable, replayable, and resilient to malformed traffic.',
          practiceTask: 'List the operational metrics you would monitor for a Fabric Eventstream carrying thousands of events per second.',
          interviewQuestion: 'How do you make an Eventstream production-ready?',
          interviewAnswer: 'Add route-level validation, dead-letter handling, duplicate-aware sinks, lag/throttling monitoring, and a raw archive path. A good stream is not just connected; it is operable and replay-safe.',
          commonMistakes: [
            'No dead-letter route for malformed events.',
            'Monitoring only destination availability and ignoring source lag.',
            'No archival copy for replay or forensic debugging.',
          ],
          performanceConsiderations: 'Heavy downstream transformations belong outside Eventstream if they delay real-time delivery. Keep ingestion fast and push complex processing to the right engine.',
          resumeTips: 'Designed replay-safe Eventstream routing with dead-letter handling, lag monitoring, and multi-sink operational analytics.',
        }),
        createLesson({
          id: 'eventstream-interview-architecture',
          title: 'Eventstream Architecture Tradeoffs',
          difficulty: 'Senior',
          explanation: 'Interviewers care less about whether you know the UI and more about whether you can place Eventstream correctly among Event Hubs, Stream Analytics, Spark Structured Streaming, and Fabric Eventhouse.',
          why: 'Senior Azure data engineers are expected to choose the right streaming tool, not just the one that looks easiest to configure.',
          realWorldUsage: 'A team evaluates whether to keep Azure Stream Analytics for complex temporal joins or simplify to Eventstream plus Eventhouse for lower-complexity operational dashboards.',
          azureUsage: 'The main Azure comparison is usually Eventstream vs Event Hubs + Stream Analytics vs Event Hubs + Databricks Structured Streaming.',
          databricksUsage: 'Databricks wins when stateful streaming logic, custom code, ML feature enrichment, or advanced exactly-once patterns are needed.',
          syntax: `Eventstream: low-code route/filter/aggregate\nStream Analytics: SQL-like CEP\nSpark Structured Streaming: code-first stateful processing`,
          example: 'Choose Eventstream for simple telemetry routing, Stream Analytics for event-window SQL patterns, and Databricks streaming for custom CDC-style enrichment at scale.',
          expectedOutput: 'A tool-selection answer that explains business fit, operational fit, and future scaling tradeoffs.',
          practiceTask: 'Compare Eventstream, Stream Analytics, and Databricks Structured Streaming for an IoT monitoring platform with alerting and historical reporting.',
          interviewQuestion: 'How would you justify Eventstream in a senior architecture discussion?',
          interviewAnswer: 'Frame it as the low-code ingestion and routing layer for Fabric-centric real-time analytics. It is strongest when you want quick delivery, integrated sinks, and operational dashboards, but it is not the right answer for complex stateful logic or deeply customized processing.',
          commonMistakes: [
            'Saying Eventstream can replace every streaming architecture.',
            'Ignoring source connector and sink limitations.',
            'Comparing tools only by UI convenience instead of operational fit.',
          ],
          performanceConsiderations: 'Choose the simplest tool that still satisfies latency, scale, and replay requirements. Overbuilding streaming pipelines creates unnecessary platform cost.',
          resumeTips: 'Evaluated streaming ingestion tool choices across Eventstream, Stream Analytics, and Databricks based on latency, complexity, and governance needs.',
        }),
      ],
    },
  ],
};

export const fabricRealTimeAnalyticsModule = {
  sections: [
    {
      title: 'Fabric Real-Time Analytics',
      subtopics: [
        createLesson({
          id: 'eventhouse-foundations',
          title: 'Eventhouse and Real-Time Analytics Foundations',
          difficulty: 'Intermediate',
          explanation: 'Fabric Real-Time Analytics centers on Eventhouse and KQL databases for high-ingest, low-latency analysis of telemetry, logs, clickstreams, and operational events.',
          why: 'Senior Azure data engineers need a clear place for hot operational analytics that sits between raw event ingestion and slower historical batch reporting.',
          realWorldUsage: 'A payments team sends authorization events into Eventhouse so support dashboards can detect spikes, latency shifts, and failure codes within seconds.',
          azureUsage: 'Eventhouse is often paired with Azure Event Hubs or IoT Hub as the source layer, then exposed through Fabric-native dashboards and downstream Lakehouse archival.',
          databricksUsage: 'Databricks often complements Eventhouse by handling deeper historical transformations after the hot operational data has already served low-latency dashboards.',
          syntax: `Source stream -> Eventstream/Event Hubs -> Eventhouse (KQL DB) -> live queries / alerts -> archive to Lakehouse`,
          example: 'Operational events land in Eventhouse for instant aggregation while the same events are copied to Lakehouse Bronze for long-term retention and batch enrichment.',
          expectedOutput: 'A clear separation between low-latency operational analytics and longer-term historical data processing.',
          practiceTask: 'Draw the hot-path vs historical-path architecture for a fraud-event platform using Eventhouse plus Lakehouse.',
          interviewQuestion: 'When should Eventhouse be used instead of a Lakehouse table?',
          interviewAnswer: 'Use Eventhouse when the primary need is low-latency, high-ingest operational querying over event streams. Use Lakehouse when long-term historical processing, Spark transformations, or open Delta storage are more important than sub-second query response.',
          commonMistakes: [
            'Using Eventhouse as the only long-term system of record.',
            'Ignoring retention and archival strategy.',
            'Assuming Lakehouse query patterns and Eventhouse query patterns are interchangeable.',
          ],
          performanceConsiderations: 'Eventhouse shines on time-series and append-heavy workloads, but retention, partitioning logic, and downstream archival still need deliberate design.',
          resumeTips: 'Designed Fabric Real-Time Analytics architectures using Eventhouse for hot operational queries and Lakehouse for historical replay and enrichment.',
        }),
        createLesson({
          id: 'eventhouse-kql-ops',
          title: 'KQL Patterns, Retention, and Operational Queries',
          difficulty: 'Senior',
          explanation: 'Strong Real-Time Analytics design includes KQL query design, retention policies, and an operational handoff so support teams can detect anomalies and debug incidents quickly.',
          why: 'If teams cannot query lag, failures, and anomalies rapidly, the real-time layer becomes expensive infrastructure without operational value.',
          realWorldUsage: 'A sensor anomaly workflow uses KQL to summarize five-minute windows, detect outliers, and join alert results to device ownership metadata for faster escalation.',
          azureUsage: 'KQL patterns usually sit on top of Azure-sourced streams, and teams often compare the design against Azure Data Explorer or Synapse Link-style query patterns.',
          databricksUsage: 'Databricks may consume archived Delta versions of the same events later, but KQL remains the fastest operational query surface for the first response path.',
          syntax: `events\n| where timestamp > ago(1h)\n| summarize failures = countif(status == \"failed\") by bin(timestamp, 5m), source_system`,
          example: 'A KQL alert highlights a sudden spike in failed pipeline events by source system and routes the output to the support team within minutes.',
          expectedOutput: 'A real-time query layer that supports alerts, RCA, and operational dashboards without requiring batch reprocessing.',
          practiceTask: 'Define three KQL-style summaries you would expose for a production support dashboard over pipeline failure events.',
          interviewQuestion: 'What should a senior engineer monitor in Eventhouse/KQL workloads?',
          interviewAnswer: 'Monitor ingest freshness, query latency, retention policy behavior, anomaly counts, and whether the archive path to Lakehouse is keeping up. The value of Eventhouse is operational visibility, so stale or silent data defeats the purpose.',
          commonMistakes: [
            'Keeping events forever in the hot store instead of archiving appropriately.',
            'No alignment between KQL dashboards and downstream support playbooks.',
            'Using KQL only for ad hoc exploration and not for explicit operational KPIs.',
          ],
          performanceConsiderations: 'Retention windows, summarization strategy, and query filters matter. Operational workloads should optimize for fast narrowed queries rather than wide historical scans.',
          resumeTips: 'Built KQL-based operational dashboards and anomaly queries for real-time support, freshness monitoring, and alerting.',
        }),
        createLesson({
          id: 'eventhouse-architecture-tradeoffs',
          title: 'Eventhouse vs Lakehouse vs Synapse for Hot Analytics',
          difficulty: 'Senior',
          explanation: 'Real-Time Analytics should be taught as an architectural placement decision: Eventhouse for hot event analytics, Lakehouse for open historical processing, and Synapse/Fabric Warehouse for SQL-serving patterns.',
          why: 'Senior interviews frequently test whether you can separate hot-path analytics from historical or serving-layer analytics instead of pushing every workload into one store.',
          realWorldUsage: 'A fraud-monitoring platform keeps the latest 14 days in Eventhouse for support and alerting, archives everything to Lakehouse Bronze, and serves reconciled monthly trends from a Warehouse.',
          azureUsage: 'The Azure equivalent discussion often compares Eventhouse/KQL with ADX, Synapse Serverless, and Fabric Warehouse depending on latency and query style.',
          databricksUsage: 'Databricks fits best when the same event data needs complex stateful ETL or ML feature building rather than primarily operational querying.',
          syntax: `Hot operational analytics -> Eventhouse\nHistorical open analytics -> Lakehouse\nCurated SQL serving -> Warehouse/Synapse`,
          example: 'Use Eventhouse for incident dashboards, Lakehouse for replay and batch enrichment, and Warehouse for stable business reporting.',
          expectedOutput: 'A layered architecture where each store has a clear operational purpose.',
          practiceTask: 'Map hot, warm, and historical use cases for the same streaming dataset across Eventhouse, Lakehouse, and Warehouse.',
          interviewQuestion: 'How would you explain Eventhouse tradeoffs in a senior architecture interview?',
          interviewAnswer: 'Eventhouse is optimized for high-ingest operational analytics and KQL-based investigation. It is not the best primary system for long-horizon historical engineering or broad SQL serving. Strong answers explain how it fits with Lakehouse archival and Warehouse reporting instead of trying to make it do everything.',
          commonMistakes: [
            'Positioning Eventhouse as a replacement for every Fabric storage layer.',
            'No clear transition from operational data to governed historical storage.',
            'Ignoring how support and BI users have different query needs.',
          ],
          performanceConsiderations: 'Keeping hot analytics workloads isolated prevents expensive overuse of large warehouse or Spark compute for operational dashboards.',
          resumeTips: 'Designed hot-path analytics architectures that separated operational KQL workloads from historical Lakehouse and reporting-layer storage.',
        }),
      ],
    },
  ],
};
