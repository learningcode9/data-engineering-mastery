export const projectImplementationGuides = {
  'sales-lakehouse': {
    groups: [
      {
        id: 'prep',
        title: '1. Prepare the source and cloud setup',
        summary: 'Get the feed, access, and environments ready before you write the pipeline.',
        sections: [
          {
            label: 'Prerequisites',
            items: [
              'A sample sales feed, a clear business key, and agreement on the refresh cadence.',
              'Access to ADLS, Databricks, Azure DevOps, and a secrets store such as Key Vault.',
            ],
          },
          {
            label: 'Source system setup',
            items: [
              'Confirm file naming, schema, and whether late or corrected records can arrive.',
              'Capture a source contract so the team knows which columns are mandatory.',
            ],
          },
          {
            label: 'Azure services setup',
            items: [
              'Create landing storage for raw data, a notebook workspace for transforms, and a serving layer for analysts.',
              'Parameterize the environment names so dev, test, and prod stay isolated.',
            ],
          },
        ],
      },
      {
        id: 'build',
        title: '2. Build the ingestion and transformation flow',
        summary: 'Move raw sales data through Bronze, Silver, and Gold with clear ownership at each stage.',
        sections: [
          {
            label: 'Step-by-step implementation',
            items: [
              'Land the raw store files into Bronze with ingestion metadata and file-level tracking.',
              'Clean and deduplicate the Silver layer before any business aggregation starts.',
              'Publish Gold fact and dimension tables that analysts can query without extra joins.',
            ],
          },
          {
            label: 'Data ingestion',
            items: [
              'Ingest incrementally so the pipeline only reprocesses the changed business window.',
              'Keep the ingestion step idempotent so reruns do not double count transactions.',
            ],
          },
          {
            label: 'Bronze / Silver / Gold',
            items: [
              'Bronze stores the raw store export plus ingestion timestamp and source file name so the team can replay a bad batch later.',
              'Silver applies type casting, store-level deduplication, and customer history handling with SCD Type 2 using surrogate keys, effective/expiry dates, and a current flag for corrected records.',
              'Gold exposes reporting-friendly fact_sales and conformed dimensions for store, product, customer, and date.',
            ],
          },
        ],
      },
      {
        id: 'operate',
        title: '3. Add quality, monitoring, and deployment controls',
        summary: 'Protect the pipeline before it reaches production users.',
        sections: [
          {
            label: 'Data quality checks',
            items: [
              'Check duplicate keys, null business keys, and row-count reconciliation between layers.',
              'Validate that source totals and Gold totals agree for the same business date.',
            ],
          },
          {
            label: 'Monitoring and logging',
            items: [
              'Log file counts, rejected rows, and job duration so failures are easy to diagnose.',
              'Alert when a store drops out of the feed or the nightly run misses its SLA.',
            ],
          },
          {
            label: 'Error handling and CI/CD',
            items: [
              'Quarantine bad records instead of failing the entire pipeline on one malformed row.',
              'Deploy the ADF trigger, Databricks notebooks, and job configs through Azure DevOps with environment parameters, Key Vault secrets, and approvals.',
            ],
          },
        ],
      },
      {
        id: 'prove',
        title: '4. Validate the solution and handle common issues',
        summary: 'Show that the pipeline is correct, recoverable, and production-ready.',
        sections: [
          {
            label: 'Validation checklist',
            items: [
              'Run a small backfill and a replay to prove the job is safe to rerun.',
              'Verify that Bronze, Silver, and Gold counts line up with the expected business totals.',
            ],
          },
          {
            label: 'Common real-world issues',
            items: [
              'Schema drift from a source file changing column order or adding a field.',
              'Small-file buildup in Bronze or a MERGE that becomes slow on the Silver table.',
            ],
          },
        ],
      },
      {
        id: 'story',
        title: '5. Tell the interview and résumé story',
        summary: 'Turn the work into a clear project explanation and strong CV bullets.',
        sections: [
          {
            label: 'How to explain this in interviews',
            items: [
              'Start with the business problem, then explain why a Bronze/Silver/Gold pattern was the safest design.',
              'Call out how you handled quality gates, incremental loading, and production support.',
            ],
          },
          {
            label: 'Resume bullet examples',
            items: [
              'Built a Bronze/Silver/Gold retail lakehouse in Databricks for 50+ store feeds, with conformed dimensions and daily reconciliation checks.',
              'Reduced reporting latency from two days to under one hour by replacing manual Excel exports with an automated ADLS-to-Delta pipeline and SCD Type 2 customer handling.',
            ],
          },
        ],
      },
    ],
  },

  'incremental-etl': {
    groups: [
      {
        id: 'prep',
        title: '1. Prepare the source and cloud setup',
        summary: 'Make the source, watermark, and target environment ready before you automate the ETL.',
        sections: [
          { label: 'Prerequisites', items: ['Access to the source OLTP database, the target analytics database, and a state store for the watermark.'] },
          { label: 'Source system setup', items: ['Confirm the modified timestamp or change column you will use for incremental extraction.'] },
          { label: 'Azure services setup', items: ['Use Azure Container Instances or a similar runtime, Key Vault for secrets, and Azure DevOps for deployment.'] },
        ],
      },
      {
        id: 'build',
        title: '2. Implement the incremental ETL flow',
        summary: 'Extract only changed rows, clean them, and load them safely into the target.',
        sections: [
          { label: 'Step-by-step implementation', items: ['Read the last watermark, extract only the changed rows, transform them, and upsert into the target.'] },
          { label: 'Data ingestion', items: ['Treat the extract as an incremental batch and persist a checkpoint only after the load succeeds.'] },
          { label: 'Bronze / Silver / Gold', items: ['Bronze stores the raw extract, Silver applies business rules, and Gold exposes the reporting-ready table.'] },
        ],
      },
      {
        id: 'operate',
        title: '3. Add operations and deployment controls',
        summary: 'Make the pipeline observable and safe to release.',
        sections: [
          { label: 'Data quality checks', items: ['Check duplicates, nulls, and row counts before the target is updated.'] },
          { label: 'Monitoring and logging', items: ['Log the watermark, the batch size, and the rows affected on every run.'] },
          { label: 'Error handling and CI/CD', items: ['Fail fast on validation errors, then deploy through a parameterized Azure DevOps pipeline.'] },
        ],
      },
      {
        id: 'prove',
        title: '4. Validate the solution and common issues',
        summary: 'Show that the ETL can rerun and still produce the same target state.',
        sections: [
          { label: 'Validation checklist', items: ['Re-run the same window twice and confirm the target row count stays stable.'] },
          { label: 'Common real-world issues', items: ['A watermark advanced too early, or a source row changed after extraction and needs a replay.'] },
        ],
      },
      {
        id: 'story',
        title: '5. Tell the interview and résumé story',
        summary: 'Translate the ETL work into a senior-ready narrative.',
        sections: [
          { label: 'How to explain this in interviews', items: ['Explain the watermark strategy, the restart path, and how you proved the load was idempotent.'] },
          { label: 'Resume bullet examples', items: ['Built a restartable incremental ETL pipeline with watermark tracking and UPSERT logic, replacing a 4-hour full reload with a 15-minute delta load.'] },
        ],
      },
    ],
  },

  'cdc-pipeline': {
    groups: [
      {
        id: 'prep',
        title: '1. Prepare the change-data sources',
        summary: 'Confirm how the source emits inserts, updates, and deletes before you build the merge logic.',
        sections: [
          { label: 'Prerequisites', items: ['Access to the source change feed, a target warehouse table, and a state store for replay control.'] },
          { label: 'Source system setup', items: ['Verify the CDC operation codes, business keys, and how tombstones or deletes are represented.'] },
          { label: 'Azure services setup', items: ['Use Event Hubs or ADLS for landing, Databricks for MERGE logic, and Key Vault for secrets.'] },
        ],
      },
      {
        id: 'build',
        title: '2. Implement the CDC pipeline',
        summary: 'Stage changes, preserve offsets, and keep the CDC load replay-safe from Bronze through Gold.',
        sections: [
          { label: 'Step-by-step implementation', items: ['Land the raw CDC events, decode the operation codes, and apply deterministic MERGE rules for inserts, updates, and deletes.'] },
          { label: 'Data ingestion', items: ['Track the Kafka offset or CDC watermark per batch so each replay window is explicit and auditable.'] },
          { label: 'Bronze / Silver / Gold', items: ['Bronze captures the raw change records with before/after payloads, Silver normalizes and deduplicates them, and Gold publishes the current warehouse view.'] },
        ],
      },
      {
        id: 'operate',
        title: '3. Add production controls',
        summary: 'Make sure the pipeline stays observable and safe under retry.',
        sections: [
          { label: 'Data quality checks', items: ['Check one current row per business key, no duplicate tombstones, and reconciled row counts after each replay window.'] },
          { label: 'Monitoring and logging', items: ['Track offset, watermark, replay window, deleted rows, and number of rows affected by each MERGE.'] },
          { label: 'Error handling and CI/CD', items: ['Stop the checkpoint update until the merge commits, then deploy the streaming job through Azure DevOps with parameterized environment settings.'] },
        ],
      },
      {
        id: 'prove',
        title: '4. Validate and troubleshoot',
        summary: 'Prove the pipeline can rerun without corrupting the target.',
        sections: [
          { label: 'Validation checklist', items: ['Run the same CDC window twice and confirm the final table is unchanged, including soft deletes and replayed updates.'] },
          { label: 'Common real-world issues', items: ['Duplicate ingestion, late-arriving records, tombstone handling mistakes, and a checkpoint that moves before the merge succeeds.'] },
        ],
      },
      {
        id: 'story',
        title: '5. Explain it in interviews',
        summary: 'Use a concise story that shows operational thinking and correctness.',
        sections: [
          { label: 'How to explain this in interviews', items: ['Focus on idempotency, replay safety, MERGE rules for inserts/updates/deletes, and how you reconcile source and target counts.'] },
          { label: 'Resume bullet examples', items: ['Built an idempotent CDC pipeline with replay-safe MERGE logic, offset tracking, delete handling, and row-level reconciliation checks.'] },
        ],
      },
    ],
  },

  'api-ingestion': {
    groups: [
      {
        id: 'prep',
        title: '1. Prepare the source and environment',
        summary: 'Set the API contract, secrets, and landing zone before the first extraction.',
        sections: [
          { label: 'Prerequisites', items: ['API endpoint, auth method, paging rules, and agreed incremental window.'] },
          { label: 'Source system setup', items: ['Document the JSON fields, rate limits, and how you will handle missing or late records.'] },
          { label: 'Azure services setup', items: ['Use ADF for orchestration, ADLS for raw landing, and Key Vault for credentials.'] },
        ],
      },
      {
        id: 'build',
        title: '2. Implement the API ingestion flow',
        summary: 'Pull data from the API, land it raw, and shape it into a trusted Bronze-to-Gold flow.',
        sections: [
          { label: 'Step-by-step implementation', items: ['Fetch paged responses, land the raw payload, normalize it, and publish a reporting table.'] },
          { label: 'Data ingestion', items: ['Preserve raw JSON in Bronze before any parsing or filtering happens.'] },
          { label: 'Bronze / Silver / Gold', items: ['Bronze stores the API payload, Silver converts it to typed records, and Gold serves the final analytics model.'] },
        ],
      },
      {
        id: 'operate',
        title: '3. Add quality and release controls',
        summary: 'Keep the pipeline stable across API retries and schema changes.',
        sections: [
          { label: 'Data quality checks', items: ['Check response counts, duplicate IDs, and required fields before loading Gold.'] },
          { label: 'Monitoring and logging', items: ['Log page count, HTTP status, latency, and the last successful watermark.'] },
          { label: 'Error handling and CI/CD', items: ['Retry transient errors, quarantine bad payloads, and deploy the pipeline through a parameterized release flow.'] },
        ],
      },
      {
        id: 'prove',
        title: '4. Validate and troubleshoot',
        summary: 'Show that the pipeline recovers gracefully when the API misbehaves.',
        sections: [
          { label: 'Validation checklist', items: ['Verify the landed record count matches the API response for the chosen window.'] },
          { label: 'Common real-world issues', items: ['Rate limits, missing fields, pagination bugs, and schema drift in the payload.'] },
        ],
      },
      {
        id: 'story',
        title: '5. Tell the interview story',
        summary: 'Explain the ingestion story in a way that sounds production-ready.',
        sections: [
          { label: 'How to explain this in interviews', items: ['Describe the API contract, your retry strategy, and how you prevented duplicate landing data.'] },
          { label: 'Resume bullet examples', items: ['Automated a REST API ingestion flow into ADLS Bronze with ADF orchestration, schema validation, and alerting.'] },
        ],
      },
    ],
  },

  'medallion-project': {
    groups: [
      {
        id: 'prep',
        title: '1. Set up the medallion workspace',
        summary: 'Define the raw, cleaned, and serving areas before you start transforming data.',
        sections: [
          { label: 'Prerequisites', items: ['A clear source contract, a workspace for transformations, and a place to store raw data.'] },
          { label: 'Source system setup', items: ['Confirm which source fields are authoritative and which need cleansing or deduplication.'] },
          { label: 'Azure services setup', items: ['Use ADLS or OneLake for storage, Databricks for transforms, and Synapse or Fabric for serving.'] },
        ],
      },
      {
        id: 'build',
        title: '2. Build the Bronze / Silver / Gold flow',
        summary: 'Keep each layer purpose-driven so the model stays easy to explain and reuse.',
        sections: [
          { label: 'Step-by-step implementation', items: ['Land raw records in Bronze, standardize and validate in Silver, then publish business-ready Gold tables.'] },
          { label: 'Data ingestion', items: ['Preserve the original payload in Bronze so the pipeline can be replayed and audited.'] },
          { label: 'Bronze / Silver / Gold', items: ['Bronze is raw and append-only, Silver is cleaned and deduped, Gold is curated for consumers.'] },
        ],
      },
      {
        id: 'operate',
        title: '3. Add operational controls',
        summary: 'Keep the design trustworthy for real teams.',
        sections: [
          { label: 'Data quality checks', items: ['Confirm row counts, schema drift, and business-key uniqueness at each stage.'] },
          { label: 'Monitoring and logging', items: ['Record run duration, rejected rows, and quality-failure counts for each layer.'] },
          { label: 'Error handling and CI/CD', items: ['Use environment parameters, approvals, and rollback-ready deployments for notebook changes.'] },
        ],
      },
      {
        id: 'prove',
        title: '4. Validate and handle issues',
        summary: 'Show how the layered design helps you recover when something goes wrong.',
        sections: [
          { label: 'Validation checklist', items: ['Check that Bronze, Silver, and Gold totals reconcile before dashboards refresh.'] },
          { label: 'Common real-world issues', items: ['Schema drift, duplicate records, bad null handling, and a Gold model that no longer matches the business rules.'] },
        ],
      },
      {
        id: 'story',
        title: '5. Tell the interview and résumé story',
        summary: 'Explain why the medallion pattern is the right fit for the problem.',
        sections: [
          { label: 'How to explain this in interviews', items: ['Describe the benefit of separating raw, cleaned, and curated layers and how that improved trust.'] },
          { label: 'Resume bullet examples', items: ['Implemented a Bronze/Silver/Gold medallion lakehouse on Databricks to improve lineage, data quality, and replayability.'] },
        ],
      },
    ],
  },

  'streaming-analytics': {
    groups: [
      {
        id: 'prep',
        title: '1. Prepare the streaming sources',
        summary: 'Make sure the event feed, offsets, and environment are ready before you go live.',
        sections: [
          { label: 'Prerequisites', items: ['An event stream, clear event schema, and a target latency SLA.'] },
          { label: 'Source system setup', items: ['Confirm event keys, ordering guarantees, and how missing or duplicate messages should be handled.'] },
          { label: 'Azure services setup', items: ['Use Event Hubs or Kafka, Databricks Structured Streaming, and Key Vault for secrets.'] },
        ],
      },
      {
        id: 'build',
        title: '2. Build the streaming pipeline',
        summary: 'Land events, transform them continuously, and publish low-latency outputs.',
        sections: [
          { label: 'Step-by-step implementation', items: ['Read the stream, apply watermarking, aggregate the data, and write to a serving table or sink.'] },
          { label: 'Data ingestion', items: ['Capture the raw event payload first so you can replay the stream if needed.'] },
          { label: 'Bronze / Silver / Gold', items: ['Bronze stores raw events, Silver prepares clean streaming facts, and Gold exposes alert-ready or dashboard-ready aggregates.'] },
        ],
      },
      {
        id: 'operate',
        title: '3. Add observability and safety',
        summary: 'Make the stream measurable and recoverable.',
        sections: [
          { label: 'Data quality checks', items: ['Validate event completeness, duplicate event IDs, and null critical fields before publishing.'] },
          { label: 'Monitoring and logging', items: ['Track lag, batch duration, checkpoint progress, and failed micro-batches.'] },
          { label: 'Error handling and CI/CD', items: ['Quarantine malformed events and deploy streaming code through a blue/green release path.'] },
        ],
      },
      {
        id: 'prove',
        title: '4. Validate and troubleshoot',
        summary: 'Show that the stream keeps working when partitions or offsets move.',
        sections: [
          { label: 'Validation checklist', items: ['Replay a known event window and confirm the final aggregates match the expected totals.'] },
          { label: 'Common real-world issues', items: ['Checkpoint corruption, duplicate messages, lag spikes, and a stream that falls behind during peak load.'] },
        ],
      },
      {
        id: 'story',
        title: '5. Tell the interview story',
        summary: 'Explain how you built a real-time pipeline that the business could trust.',
        sections: [
          { label: 'How to explain this in interviews', items: ['Describe the latency target, the event contract, and how you handled recovery and replay.'] },
          { label: 'Resume bullet examples', items: ['Built a low-latency streaming analytics pipeline with Event Hubs, Databricks, and checkpointed micro-batch processing for alerting use cases.'] },
        ],
      },
    ],
  },

  'databricks-optimization': {
    groups: [
      {
        id: 'prep',
        title: '1. Measure the workload first',
        summary: 'Start from the bottleneck, not from the cluster size.',
        sections: [
          { label: 'Prerequisites', items: ['A slow Spark job, access to Spark UI, and a baseline runtime to compare against.'] },
          { label: 'Source system setup', items: ['Identify the biggest tables, the join keys, and the filters used by the job.'] },
          { label: 'Azure services setup', items: ['Use Databricks, ADLS, and Azure Monitor to inspect runtime behavior and cluster metrics.'] },
        ],
      },
      {
        id: 'build',
        title: '2. Tune the Spark job',
        summary: 'Apply the smallest changes that reduce shuffle and runtime.',
        sections: [
          { label: 'Step-by-step implementation', items: ['Inspect the physical plan, remove skew, reduce shuffles, and tune partitions.'] },
          { label: 'Data ingestion', items: ['Keep the input read efficient by pruning the data before wide transformations start.'] },
          { label: 'Bronze / Silver / Gold', items: ['Bronze contains the raw dataset, Silver contains the optimized transform path, and Gold holds benchmark-ready outputs.'] },
        ],
      },
      {
        id: 'operate',
        title: '3. Add production controls',
        summary: 'Make sure the performance gains survive day-to-day use.',
        sections: [
          { label: 'Data quality checks', items: ['Confirm the tuned job still returns the same row counts and output totals.'] },
          { label: 'Monitoring and logging', items: ['Track shuffle spill, stage duration, executor memory, and job runtime after every release.'] },
          { label: 'Error handling and CI/CD', items: ['Package the notebook in Git and use CI to catch regressions before they reach production.'] },
        ],
      },
      {
        id: 'prove',
        title: '4. Validate and troubleshoot',
        summary: 'Prove the performance fix is real and sustainable.',
        sections: [
          { label: 'Validation checklist', items: ['Compare the before-and-after runtime, spill, and scan metrics.'] },
          { label: 'Common real-world issues', items: ['A skewed key, a bad broadcast choice, or a job that scales poorly because it still shuffles too much.'] },
        ],
      },
      {
        id: 'story',
        title: '5. Tell the interview and résumé story',
        summary: 'Explain the tuning as an engineering improvement with measurable impact.',
        sections: [
          { label: 'How to explain this in interviews', items: ['Name the bottleneck first, then explain the change and the measured improvement.'] },
          { label: 'Resume bullet examples', items: ['Reduced a Spark job runtime by tuning joins, partitioning, and shuffle patterns in Databricks without changing the output contract.'] },
        ],
      },
    ],
  },

  'iot-streaming': {
    groups: [
      {
        id: 'prep',
        title: '1. Prepare the IoT source and cloud services',
        summary: 'Set up the telemetry contract and the streaming backbone before implementation.',
        sections: [
          { label: 'Prerequisites', items: ['A device telemetry feed, threshold rules, and a required alert latency.'] },
          { label: 'Source system setup', items: ['Confirm device IDs, event cadence, and what counts as a valid telemetry message.'] },
          { label: 'Azure services setup', items: ['Use IoT Hub or Event Hubs, Databricks, ADLS, and Key Vault for secure connectivity.'] },
        ],
      },
      {
        id: 'build',
        title: '2. Build the real-time telemetry flow',
        summary: 'Land telemetry, filter it continuously, and push alert-ready data downstream.',
        sections: [
          { label: 'Step-by-step implementation', items: ['Capture device events from Event Hub, parse the payload, detect anomalies, and emit stream aggregates with checkpointed state.'] },
          { label: 'Data ingestion', items: ['Store the raw telemetry stream first so the team can replay it during incidents or backfill late device events.'] },
          { label: 'Bronze / Silver / Gold', items: ['Bronze stores raw telemetry from Event Hub, Silver standardizes and scores events, and Gold feeds dashboards or alerts.'] },
        ],
      },
      {
        id: 'operate',
        title: '3. Add operational safety',
        summary: 'Keep the stream observable, secure, and recoverable.',
        sections: [
          { label: 'Data quality checks', items: ['Check event completeness, duplicate device IDs, valid timestamps, and late-arriving records before publishing alerts.'] },
          { label: 'Monitoring and logging', items: ['Track stream lag, alert counts, checkpoint progress, and device-level error spikes by partition.'] },
          { label: 'Error handling and CI/CD', items: ['Fail fast on malformed messages and deploy stream code through parameterized environments with rollout approval.'] },
        ],
      },
      {
        id: 'prove',
        title: '4. Validate and troubleshoot',
        summary: 'Show that the stream behaves correctly under load and replay.',
        sections: [
          { label: 'Validation checklist', items: ['Replay recorded telemetry and confirm the anomaly count matches the expected result, including late events and duplicate deliveries.'] },
          { label: 'Common real-world issues', items: ['Checkpoint drift, burst traffic, late device messages, partition skew, and incorrect alert thresholds.'] },
        ],
      },
      {
        id: 'story',
        title: '5. Tell the interview story',
        summary: 'Present the solution like a production-ready real-time system.',
        sections: [
          { label: 'How to explain this in interviews', items: ['Lead with the business need for low-latency telemetry and explain how Event Hub, checkpoints, and replay handling kept the stream reliable.'] },
          { label: 'Resume bullet examples', items: ['Built a real-time IoT telemetry pipeline using Event Hub, checkpointed Spark streaming, and replay-safe anomaly detection within seconds.'] },
        ],
      },
    ],
  },

  'fraud-detection': {
    groups: [
      {
        id: 'prep',
        title: '1. Prepare the fraud data sources',
        summary: 'Align the transaction feed, scoring logic, and latency target before the build starts.',
        sections: [
          { label: 'Prerequisites', items: ['Access to the transaction stream, model version, and fraud decision threshold.'] },
          { label: 'Source system setup', items: ['Confirm the transaction schema, enrichment keys, and what happens when a field is missing.'] },
          { label: 'Azure services setup', items: ['Use a streaming backbone, Databricks or Spark, a model registry, and Key Vault for secure access.'] },
        ],
      },
      {
        id: 'build',
        title: '2. Build the scoring pipeline',
        summary: 'Score transactions quickly and keep the model output traceable.',
        sections: [
          { label: 'Step-by-step implementation', items: ['Ingest the transaction stream, enrich it, score it, and route high-risk events to a separate sink.'] },
          { label: 'Data ingestion', items: ['Land the raw stream first so every scored event can be replayed if needed.'] },
          { label: 'Bronze / Silver / Gold', items: ['Bronze stores the raw transaction, Silver prepares features, and Gold serves the scored outcome or alert table.'] },
        ],
      },
      {
        id: 'operate',
        title: '3. Add quality and release controls',
        summary: 'Keep the scoring service safe under pressure.',
        sections: [
          { label: 'Data quality checks', items: ['Validate transaction completeness, duplicate IDs, and the presence of critical scoring fields.'] },
          { label: 'Monitoring and logging', items: ['Monitor false positives, false negatives, latency, and the percentage of events routed for manual review.'] },
          { label: 'Error handling and CI/CD', items: ['Version the model and the stream code separately, then deploy with staged approvals and rollback paths.'] },
        ],
      },
      {
        id: 'prove',
        title: '4. Validate and troubleshoot',
        summary: 'Prove the model and the pipeline can be trusted in production.',
        sections: [
          { label: 'Validation checklist', items: ['Replay a known transaction sample and compare the alert count to the expected baseline.'] },
          { label: 'Common real-world issues', items: ['Model drift, feature mismatch, stale thresholds, or a stream that becomes too slow during peak volume.'] },
        ],
      },
      {
        id: 'story',
        title: '5. Tell the interview and résumé story',
        summary: 'Show that you understand both streaming systems and risk trade-offs.',
        sections: [
          { label: 'How to explain this in interviews', items: ['Describe how you balanced accuracy, false positives, and latency while keeping the pipeline observable.'] },
          { label: 'Resume bullet examples', items: ['Implemented a real-time fraud scoring pipeline with streaming enrichment, model versioning, and low-latency alerting in Databricks.'] },
        ],
      },
    ],
  },

  'fabric-migration': {
    groups: [
      {
        id: 'prep',
        title: '1. Prepare the migration plan',
        summary: 'Map what moves to Fabric, what stays, and how teams will validate the change.',
        sections: [
          { label: 'Prerequisites', items: ['A clear inventory of Synapse, ADLS, and Power BI assets that need to move.'] },
          { label: 'Source system setup', items: ['Confirm the current warehouse schemas, semantic models, and refresh schedules.'] },
          { label: 'Azure services setup', items: ['Use Fabric workspaces, OneLake, Git integration, and deployment approvals for the new platform.'] },
        ],
      },
      {
        id: 'build',
        title: '2. Rebuild the data flow in Fabric',
        summary: 'Move the lakehouse, pipelines, and semantic layer into the Fabric model.',
        sections: [
          { label: 'Step-by-step implementation', items: ['Map the old Synapse assets to Fabric items, rebuild the flow, and validate the resulting semantic model with report parity checks.'] },
          { label: 'Data ingestion', items: ['Land data into OneLake and keep the original source copies available for backfill and refresh recovery.'] },
          { label: 'Bronze / Silver / Gold', items: ['Use Bronze for raw landing, Silver for transformed tables, and Gold for semantic-model-ready data exposed to Power BI.'] },
        ],
      },
      {
        id: 'operate',
        title: '3. Add governance and release controls',
        summary: 'Keep the migration safe for analysts and downstream reports.',
        sections: [
          { label: 'Data quality checks', items: ['Verify schema parity, refresh parity, row-count reconciliation, and RLS behavior after each move.'] },
          { label: 'Monitoring and logging', items: ['Track workspace deployment status, refresh duration, semantic model errors, and failed dataset refreshes.'] },
          { label: 'Error handling and CI/CD', items: ['Use pull-request approvals and deployment pipelines to move workspaces from dev to prod with rollback-ready validation, including a backed-up Gold table and semantic model.'] },
        ],
      },
      {
        id: 'prove',
        title: '4. Validate and troubleshoot',
        summary: 'Make sure the new platform behaves like the old one, only cleaner.',
        sections: [
          { label: 'Validation checklist', items: ['Compare key reports before and after migration and confirm the numbers still match, including the Power BI semantic model.'] },
          { label: 'Common real-world issues', items: ['Refresh failures, semantic model mismatches, stale Gold tables, and access control differences between workspaces.'] },
        ],
      },
      {
        id: 'story',
        title: '5. Tell the interview and résumé story',
        summary: 'Explain the migration in terms of business value, not just platform changes.',
        sections: [
          { label: 'How to explain this in interviews', items: ['Describe the reason for the migration, the validation strategy, and how you reduced operational overhead for analysts and BI users.'] },
          { label: 'Resume bullet examples', items: ['Migrated Synapse lakehouse assets to Fabric with OneLake, Git-integrated deployment, semantic-model validation, and Power BI report parity checks.'] },
        ],
      },
    ],
  },
};
