export const cdcModule = {
  "sections": [
    {
      "title": "CDC Foundations",
      "subtopics": [
        {
          "id": "cdc-full-vs-incremental",
          "title": "Full Load vs Incremental vs CDC",
          "difficulty": "Intermediate",
          "explanation": "Full loads copy everything, incremental loads copy changed rows by a cursor, and CDC captures inserts, updates, and deletes from change events or logs.",
          "what": "Full loads copy everything, incremental loads copy changed rows by a cursor, and CDC captures inserts, updates, and deletes from change events or logs.",
          "why": "Senior data engineers choose the right strategy based on volume, delete handling, latency, and source capabilities.",
          "realWorldUsage": "A customer table starts with a full load, then switches to CDC so address updates and deletes reach the warehouse within minutes.",
          "azureUsage": "ADF supports full and incremental patterns; CDC often uses source-native CDC, Event Hubs, Debezium, Fabric mirroring, or Databricks streaming.",
          "azureRelevance": "ADF supports full and incremental patterns; CDC often uses source-native CDC, Event Hubs, Debezium, Fabric mirroring, or Databricks streaming.",
          "databricksUsage": "Databricks commonly applies CDC events into Delta tables with foreachBatch and MERGE.",
          "databricksRelevance": "Databricks commonly applies CDC events into Delta tables with foreachBatch and MERGE.",
          "example": "Initial snapshot -> CDC stream -> Bronze events -> Silver latest-state MERGE -> Gold SCD2 dimension",
          "expectedOutput": "A target table that starts complete and then stays synchronized through changes.",
          "practice": "Pick full, watermark incremental, or CDC for a 500M-row orders table with deletes and explain why.",
          "practiceTask": "Pick full, watermark incremental, or CDC for a 500M-row orders table with deletes and explain why.",
          "interviewQuestion": "Why is CDC different from timestamp incremental loading?",
          "interview": {
            "question": "Why is CDC different from timestamp incremental loading?",
            "answer": "Timestamp incremental reads changed rows by a cursor but can miss deletes; CDC captures operation-level changes including deletes and transaction ordering."
          },
          "commonMistakes": [
            "Starting CDC without an initial snapshot.",
            "Using timestamp incremental when hard deletes matter."
          ],
          "productionContext": "A customer table starts with a full load, then switches to CDC so address updates and deletes reach the warehouse within minutes.",
          "performanceTip": "CDC reduces full scans but requires careful batching, ordering, and target indexing/clustering.",
          "performanceConsiderations": "CDC reduces full scans but requires careful batching, ordering, and target indexing/clustering.",
          "seniorEngineeringInsights": "Seniors design the transition from snapshot to continuous changes and document the exact cutover point.",
          "seniorEngineerNote": "Seniors design the transition from snapshot to continuous changes and document the exact cutover point.",
          "hints": [
            "Pick full, watermark incremental, or CDC for a 500M-row orders table with deletes and explain why.",
            "Timestamp incremental reads changed rows by a cursor but can miss deletes; CDC captures operation-level changes including deletes and transaction ordering."
          ]
        },
        {
          "id": "cdc-log-based-and-watermarks",
          "title": "Log-Based CDC and Watermarks",
          "difficulty": "Intermediate",
          "explanation": "Log-based CDC reads database transaction logs; watermarks track the last safely processed position or timestamp.",
          "what": "Log-based CDC reads database transaction logs; watermarks track the last safely processed position or timestamp.",
          "why": "Reliable CDC depends on deterministic ordering and recovery from the last committed point.",
          "realWorldUsage": "A SQL Server CDC pipeline stores the last LSN processed and resumes from that LSN after a failed run.",
          "azureUsage": "Azure SQL, SQL Server, Event Hubs, ADF, and Databricks can participate in CDC architectures depending on source and latency requirements.",
          "azureRelevance": "Azure SQL, SQL Server, Event Hubs, ADF, and Databricks can participate in CDC architectures depending on source and latency requirements.",
          "databricksUsage": "Databricks jobs can store CDC offsets in control tables and use Delta checkpointing for streaming sources.",
          "databricksRelevance": "Databricks jobs can store CDC offsets in control tables and use Delta checkpointing for streaming sources.",
          "example": "control_table(source_table, last_lsn, last_successful_run_id, status)",
          "expectedOutput": "A restartable CDC process that never advances the cursor before target validation succeeds.",
          "practice": "Design a control table for source table, last LSN, batch id, row counts, and status.",
          "practiceTask": "Design a control table for source table, last LSN, batch id, row counts, and status.",
          "interviewQuestion": "When do you advance a CDC watermark?",
          "interview": {
            "question": "When do you advance a CDC watermark?",
            "answer": "Only after target writes, validations, and audit logging succeed for that batch."
          },
          "commonMistakes": [
            "Advancing the watermark before MERGE commits.",
            "Using arrival time instead of source change sequence."
          ],
          "productionContext": "A SQL Server CDC pipeline stores the last LSN processed and resumes from that LSN after a failed run.",
          "performanceTip": "Batch CDC events by source sequence windows and keep target MERGE predicates selective.",
          "performanceConsiderations": "Batch CDC events by source sequence windows and keep target MERGE predicates selective.",
          "seniorEngineeringInsights": "Seniors treat watermarks as transactional state, not just a timestamp variable in a pipeline.",
          "seniorEngineerNote": "Seniors treat watermarks as transactional state, not just a timestamp variable in a pipeline.",
          "hints": [
            "Design a control table for source table, last LSN, batch id, row counts, and status.",
            "Only after target writes, validations, and audit logging succeed for that batch."
          ]
        }
      ]
    },
    {
      "title": "Applying Changes Safely",
      "subtopics": [
        {
          "id": "cdc-deletes-tombstones-soft-deletes",
          "title": "Deletes, Tombstones, and Soft Deletes",
          "difficulty": "Intermediate",
          "explanation": "CDC delete events may physically delete target rows, mark rows inactive, or create tombstone records for downstream consumers.",
          "what": "CDC delete events may physically delete target rows, mark rows inactive, or create tombstone records for downstream consumers.",
          "why": "Delete handling controls whether analytics reflect current state, historical state, or compliance erasure requirements.",
          "realWorldUsage": "A CRM customer delete becomes is_deleted=true in Silver but triggers a GDPR delete workflow for sensitive Gold data.",
          "azureUsage": "ADF and Databricks pipelines must agree whether deletes are propagated, soft-deleted, or quarantined for approval.",
          "azureRelevance": "ADF and Databricks pipelines must agree whether deletes are propagated, soft-deleted, or quarantined for approval.",
          "databricksUsage": "Delta MERGE can DELETE matched rows or UPDATE flags such as is_deleted and deleted_at.",
          "databricksRelevance": "Delta MERGE can DELETE matched rows or UPDATE flags such as is_deleted and deleted_at.",
          "example": "WHEN MATCHED AND op = \"D\" THEN UPDATE SET is_deleted = true, deleted_at = event_ts",
          "expectedOutput": "A target table with delete semantics that match business and compliance requirements.",
          "practice": "Choose hard delete, soft delete, or tombstone for customer, order, and audit records.",
          "practiceTask": "Choose hard delete, soft delete, or tombstone for customer, order, and audit records.",
          "interviewQuestion": "How do you handle deletes in CDC?",
          "interview": {
            "question": "How do you handle deletes in CDC?",
            "answer": "Clarify business semantics, preserve raw delete events, then apply hard delete, soft delete, or tombstone logic in Silver/Gold as required."
          },
          "commonMistakes": [
            "Ignoring deletes because the initial incremental pattern only handled upserts.",
            "Hard deleting data needed for audit."
          ],
          "productionContext": "A CRM customer delete becomes is_deleted=true in Silver but triggers a GDPR delete workflow for sensitive Gold data.",
          "performanceTip": "Frequent deletes can fragment Delta files; schedule maintenance and consider partition-scoped deletes.",
          "performanceConsiderations": "Frequent deletes can fragment Delta files; schedule maintenance and consider partition-scoped deletes.",
          "seniorEngineeringInsights": "Seniors separate source-state synchronization from legal retention and analytical history requirements.",
          "seniorEngineerNote": "Seniors separate source-state synchronization from legal retention and analytical history requirements.",
          "hints": [
            "Choose hard delete, soft delete, or tombstone for customer, order, and audit records.",
            "Clarify business semantics, preserve raw delete events, then apply hard delete, soft delete, or tombstone logic in Silver/Gold as required."
          ]
        },
        {
          "id": "cdc-dedup-replay-idempotency",
          "title": "Deduplication, Replay, and Idempotency",
          "difficulty": "Intermediate",
          "explanation": "CDC pipelines must survive duplicated events, replayed batches, and retries without corrupting the target state.",
          "what": "CDC pipelines must survive duplicated events, replayed batches, and retries without corrupting the target state.",
          "why": "Production failures are normal; CDC correctness is proven by rerun safety.",
          "realWorldUsage": "An Event Hubs outage causes a replay of 20 minutes of events; the Silver MERGE must produce the same final state as a single clean run.",
          "azureUsage": "Event Hubs offsets, ADF retry policies, and Databricks checkpoints all influence replay behavior.",
          "azureRelevance": "Event Hubs offsets, ADF retry policies, and Databricks checkpoints all influence replay behavior.",
          "databricksUsage": "Use ROW_NUMBER by key and source sequence, then MERGE into Delta with deterministic survivor logic.",
          "databricksRelevance": "Use ROW_NUMBER by key and source sequence, then MERGE into Delta with deterministic survivor logic.",
          "example": "ROW_NUMBER() OVER (PARTITION BY business_key ORDER BY source_lsn DESC, event_ts DESC) AS rn",
          "expectedOutput": "One latest event per key per batch before applying changes to the target.",
          "practice": "Write the survivor rule for duplicate CDC events with the same business key.",
          "practiceTask": "Write the survivor rule for duplicate CDC events with the same business key.",
          "interviewQuestion": "How do you make a CDC pipeline idempotent?",
          "interview": {
            "question": "How do you make a CDC pipeline idempotent?",
            "answer": "Preserve raw events, order and deduplicate by source sequence, MERGE by key, update cursor only after success, and reconcile operation counts."
          },
          "commonMistakes": [
            "Using ingestion timestamp as the only ordering field.",
            "Appending CDC events directly into current-state tables."
          ],
          "productionContext": "An Event Hubs outage causes a replay of 20 minutes of events; the Silver MERGE must produce the same final state as a single clean run.",
          "performanceTip": "Deduplicate in the current batch before MERGE to reduce target scans and shuffle.",
          "performanceConsiderations": "Deduplicate in the current batch before MERGE to reduce target scans and shuffle.",
          "seniorEngineeringInsights": "Seniors test CDC by replaying the same batch twice and proving target counts and values remain stable.",
          "seniorEngineerNote": "Seniors test CDC by replaying the same batch twice and proving target counts and values remain stable.",
          "hints": [
            "Write the survivor rule for duplicate CDC events with the same business key.",
            "Preserve raw events, order and deduplicate by source sequence, MERGE by key, update cursor only after success, and reconcile operation counts."
          ]
        },
        {
          "id": "cdc-schema-drift-reconciliation",
          "title": "Schema Drift and Reconciliation",
          "difficulty": "Intermediate",
          "explanation": "Schema drift changes the shape of CDC events; reconciliation proves the target still matches source expectations.",
          "what": "Schema drift changes the shape of CDC events; reconciliation proves the target still matches source expectations.",
          "why": "CDC pipelines can fail silently when source columns, data types, or operation payloads change.",
          "realWorldUsage": "A source team adds discount_code to orders; Bronze captures it, Silver contract tests decide whether to promote it, and reconciliation flags row-count drift.",
          "azureUsage": "Azure pipelines should alert on schema changes and store reconciliation results in audit tables.",
          "azureRelevance": "Azure pipelines should alert on schema changes and store reconciliation results in audit tables.",
          "databricksUsage": "Delta schema evolution can help, but Silver and Gold contracts still need explicit governance.",
          "databricksRelevance": "Delta schema evolution can help, but Silver and Gold contracts still need explicit governance.",
          "example": "source_count, insert_count, update_count, delete_count, target_count, rejected_count by batch_id",
          "expectedOutput": "A CDC audit record showing operation counts and validation status for each batch.",
          "practice": "Design reconciliation checks for insert/update/delete counts and target latest-state count.",
          "practiceTask": "Design reconciliation checks for insert/update/delete counts and target latest-state count.",
          "interviewQuestion": "How do you validate CDC correctness?",
          "interview": {
            "question": "How do you validate CDC correctness?",
            "answer": "Compare source operation counts, target row counts, delete counts, duplicate keys, rejected records, and watermark/LSN continuity."
          },
          "commonMistakes": [
            "Only checking whether the pipeline succeeded technically.",
            "Letting schema drift auto-promote into Gold."
          ],
          "productionContext": "A source team adds discount_code to orders; Bronze captures it, Silver contract tests decide whether to promote it, and reconciliation flags row-count drift.",
          "performanceTip": "Run reconciliation by batch/window instead of scanning all history every run.",
          "performanceConsiderations": "Run reconciliation by batch/window instead of scanning all history every run.",
          "seniorEngineeringInsights": "Seniors make CDC observable: every batch has operation metrics, cursor movement, rejects, and recovery instructions.",
          "seniorEngineerNote": "Seniors make CDC observable: every batch has operation metrics, cursor movement, rejects, and recovery instructions.",
          "hints": [
            "Design reconciliation checks for insert/update/delete counts and target latest-state count.",
            "Compare source operation counts, target row counts, delete counts, duplicate keys, rejected records, and watermark/LSN continuity."
          ]
        },
        {
          "id": "cdc-to-scd2",
          "title": "CDC to SCD Type 2",
          "difficulty": "Intermediate",
          "explanation": "CDC events can be transformed into SCD2 dimension versions with effective dates, expiry dates, and current flags.",
          "what": "CDC events can be transformed into SCD2 dimension versions with effective dates, expiry dates, and current flags.",
          "why": "Analytics often needs historical attribute truth, not only latest source state.",
          "realWorldUsage": "Customer region changes from West to East; facts before the change should report West and later facts should report East.",
          "azureUsage": "Fabric Warehouse, Synapse, or Databricks can implement SCD2 with MERGE, surrogate keys, and validation checks.",
          "azureRelevance": "Fabric Warehouse, Synapse, or Databricks can implement SCD2 with MERGE, surrogate keys, and validation checks.",
          "databricksUsage": "Delta MERGE can expire current rows and insert new dimension versions from ordered CDC events.",
          "databricksRelevance": "Delta MERGE can expire current rows and insert new dimension versions from ordered CDC events.",
          "example": "Expire current row where hash changed; insert new row with effective_start_date = event_ts and is_current = true.",
          "expectedOutput": "A dimension table with exactly one current row per natural key and no overlapping effective windows.",
          "practice": "List the columns and checks required for a CDC-driven SCD2 customer dimension.",
          "practiceTask": "List the columns and checks required for a CDC-driven SCD2 customer dimension.",
          "interviewQuestion": "How do you convert CDC events into SCD2?",
          "interview": {
            "question": "How do you convert CDC events into SCD2?",
            "answer": "Order events by source sequence, detect attribute changes, expire the current row, insert a new version, and validate current-row uniqueness and non-overlapping dates."
          },
          "commonMistakes": [
            "Processing multiple changes for a key out of order.",
            "Not checking for overlapping effective date ranges."
          ],
          "productionContext": "Customer region changes from West to East; facts before the change should report West and later facts should report East.",
          "performanceTip": "Cluster or index dimensions by natural key and current flag to keep MERGE lookups efficient.",
          "performanceConsiderations": "Cluster or index dimensions by natural key and current flag to keep MERGE lookups efficient.",
          "seniorEngineeringInsights": "Seniors distinguish latest-state Silver tables from historical Gold dimensions and build tests for both.",
          "seniorEngineerNote": "Seniors distinguish latest-state Silver tables from historical Gold dimensions and build tests for both.",
          "hints": [
            "List the columns and checks required for a CDC-driven SCD2 customer dimension.",
            "Order events by source sequence, detect attribute changes, expire the current row, insert a new version, and validate current-row uniqueness and non-overlapping dates."
          ]
        }
      ]
    }
  ]
};
