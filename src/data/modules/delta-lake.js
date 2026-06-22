export const deltaLakeModule = {
  "sections": [
    {
      "title": "Delta Foundations",
      "subtopics": [
        {
          "id": "delta-transaction-log-acid",
          "title": "Transaction Log and ACID",
          "difficulty": "Intermediate",
          "explanation": "Delta Lake adds a _delta_log transaction log to Parquet files so reads and writes are atomic, consistent, isolated, and durable.",
          "what": "Delta Lake adds a _delta_log transaction log to Parquet files so reads and writes are atomic, consistent, isolated, and durable.",
          "why": "Production data lakes need safe concurrent writes, rollback, schema tracking, and reliable incremental updates.",
          "realWorldUsage": "A nightly Silver job updates orders while analysts query yesterday’s Gold mart; Delta provides consistent snapshots instead of half-written files.",
          "azureUsage": "Delta tables are common on ADLS Gen2 and OneLake, powering Databricks, Fabric Lakehouse, and Spark-based Azure pipelines.",
          "azureRelevance": "Delta tables are common on ADLS Gen2 and OneLake, powering Databricks, Fabric Lakehouse, and Spark-based Azure pipelines.",
          "databricksUsage": "Databricks uses Delta as the default table format for managed and external lakehouse tables.",
          "databricksRelevance": "Databricks uses Delta as the default table format for managed and external lakehouse tables.",
          "example": "DESCRIBE HISTORY silver.orders; SELECT * FROM silver.orders VERSION AS OF 12;",
          "expectedOutput": "A versioned table history that supports reproducible reads and rollback.",
          "practice": "Explain what happens in _delta_log when a batch appends new files and removes old files.",
          "practiceTask": "Explain what happens in _delta_log when a batch appends new files and removes old files.",
          "interviewQuestion": "What does the Delta transaction log provide?",
          "interview": {
            "question": "What does the Delta transaction log provide?",
            "answer": "It records table actions and metadata so readers see consistent snapshots and writers can commit atomic changes."
          },
          "commonMistakes": [
            "Treating Delta as just Parquet files and manually modifying table folders.",
            "Deleting files outside Delta commands."
          ],
          "productionContext": "A nightly Silver job updates orders while analysts query yesterday’s Gold mart; Delta provides consistent snapshots instead of half-written files.",
          "performanceTip": "The log enables file skipping and metadata pruning, but excessive small commits can slow planning.",
          "performanceConsiderations": "The log enables file skipping and metadata pruning, but excessive small commits can slow planning.",
          "seniorEngineeringInsights": "Seniors troubleshoot Delta by reading history, operation metrics, file counts, and version changes.",
          "seniorEngineerNote": "Seniors troubleshoot Delta by reading history, operation metrics, file counts, and version changes.",
          "hints": [
            "Explain what happens in _delta_log when a batch appends new files and removes old files.",
            "It records table actions and metadata so readers see consistent snapshots and writers can commit atomic changes."
          ]
        },
        {
          "id": "delta-schema-enforcement-evolution",
          "title": "Schema Enforcement and Evolution",
          "difficulty": "Intermediate",
          "explanation": "Schema enforcement rejects incompatible writes; schema evolution allows controlled additions or changes when enabled.",
          "what": "Schema enforcement rejects incompatible writes; schema evolution allows controlled additions or changes when enabled.",
          "why": "Data engineers need to protect Silver and Gold contracts while still handling real source changes.",
          "realWorldUsage": "A CRM API adds marketing_opt_in. Bronze accepts it, Silver validates it, and the team decides whether to evolve the contract.",
          "azureUsage": "Fabric and Synapse consumers rely on stable Gold schemas; uncontrolled evolution can break semantic models.",
          "azureRelevance": "Fabric and Synapse consumers rely on stable Gold schemas; uncontrolled evolution can break semantic models.",
          "databricksUsage": "Databricks supports mergeSchema and autoMerge, but these should be governed, not left open everywhere.",
          "databricksRelevance": "Databricks supports mergeSchema and autoMerge, but these should be governed, not left open everywhere.",
          "example": "df.write.option(\"mergeSchema\", \"true\").format(\"delta\").mode(\"append\").save(path)",
          "expectedOutput": "New compatible columns can be added intentionally while incompatible writes fail fast.",
          "practice": "Design a safe schema evolution flow for a new optional source column.",
          "practiceTask": "Design a safe schema evolution flow for a new optional source column.",
          "interviewQuestion": "How do you handle schema drift with Delta Lake?",
          "interview": {
            "question": "How do you handle schema drift with Delta Lake?",
            "answer": "Land raw data in Bronze, validate changes, evolve Silver/Gold only through governed contract changes, and alert on breaking changes."
          },
          "commonMistakes": [
            "Turning on automatic schema merge globally.",
            "Allowing source drift to flow directly into Gold tables."
          ],
          "productionContext": "A CRM API adds marketing_opt_in. Bronze accepts it, Silver validates it, and the team decides whether to evolve the contract.",
          "performanceTip": "Frequent schema changes can complicate statistics, downstream caching, and semantic model refresh.",
          "performanceConsiderations": "Frequent schema changes can complicate statistics, downstream caching, and semantic model refresh.",
          "seniorEngineeringInsights": "Seniors separate schema detection from schema acceptance and involve data owners before changing serving contracts.",
          "seniorEngineerNote": "Seniors separate schema detection from schema acceptance and involve data owners before changing serving contracts.",
          "hints": [
            "Design a safe schema evolution flow for a new optional source column.",
            "Land raw data in Bronze, validate changes, evolve Silver/Gold only through governed contract changes, and alert on breaking changes."
          ]
        }
      ]
    },
    {
      "title": "Production Mutation Patterns",
      "subtopics": [
        {
          "id": "delta-merge-upsert",
          "title": "MERGE / UPSERT",
          "difficulty": "Intermediate",
          "explanation": "Delta MERGE applies inserts, updates, and deletes from a source batch into a target table atomically.",
          "what": "Delta MERGE applies inserts, updates, and deletes from a source batch into a target table atomically.",
          "why": "Senior DE pipelines rely on MERGE for CDC, SCD, deduplication, and retry-safe incremental loads.",
          "realWorldUsage": "A Silver orders table receives changed records from a CDC feed and updates only affected order IDs instead of rewriting all history.",
          "azureUsage": "ADF can orchestrate Databricks/Fabric notebooks that perform Delta MERGE into ADLS or OneLake-backed tables.",
          "azureRelevance": "ADF can orchestrate Databricks/Fabric notebooks that perform Delta MERGE into ADLS or OneLake-backed tables.",
          "databricksUsage": "Databricks Delta MERGE is the standard pattern for foreachBatch streaming upserts and batch CDC processing.",
          "databricksRelevance": "Databricks Delta MERGE is the standard pattern for foreachBatch streaming upserts and batch CDC processing.",
          "example": "MERGE INTO silver.orders t USING updates s ON t.order_id = s.order_id WHEN MATCHED THEN UPDATE SET * WHEN NOT MATCHED THEN INSERT *;",
          "expectedOutput": "Target table reflects changed records without duplicate inserts.",
          "practice": "Write the decision logic for insert, update, and delete branches in a CDC MERGE.",
          "practiceTask": "Write the decision logic for insert, update, and delete branches in a CDC MERGE.",
          "interviewQuestion": "How do you optimize a Delta MERGE?",
          "interview": {
            "question": "How do you optimize a Delta MERGE?",
            "answer": "Deduplicate source changes first, filter target by partition, cluster/ZORDER on match keys, and keep batches reasonably sized."
          },
          "commonMistakes": [
            "Merging duplicate source keys.",
            "Missing partition predicates in the MERGE condition.",
            "Using MERGE to rewrite huge tables unnecessarily."
          ],
          "productionContext": "A Silver orders table receives changed records from a CDC feed and updates only affected order IDs instead of rewriting all history.",
          "performanceTip": "MERGE scans target files that may match the condition; clustering and partition filters reduce the scan.",
          "performanceConsiderations": "MERGE scans target files that may match the condition; clustering and partition filters reduce the scan.",
          "seniorEngineeringInsights": "Seniors always validate source uniqueness, operation counts, and idempotent rerun behavior around MERGE.",
          "seniorEngineerNote": "Seniors always validate source uniqueness, operation counts, and idempotent rerun behavior around MERGE.",
          "hints": [
            "Write the decision logic for insert, update, and delete branches in a CDC MERGE.",
            "Deduplicate source changes first, filter target by partition, cluster/ZORDER on match keys, and keep batches reasonably sized."
          ]
        },
        {
          "id": "delta-time-travel-restore",
          "title": "Time Travel and Restore",
          "difficulty": "Intermediate",
          "explanation": "Time travel reads previous table versions, while restore moves a table back to a previous valid version.",
          "what": "Time travel reads previous table versions, while restore moves a table back to a previous valid version.",
          "why": "Production teams use time travel to debug bad loads and recover from accidental writes.",
          "realWorldUsage": "A bad deployment overwrites Gold revenue; engineers inspect history, restore the previous version, and rerun the corrected job.",
          "azureUsage": "Fabric/Databricks lakehouse tables on ADLS or OneLake can preserve table versions subject to retention settings.",
          "azureRelevance": "Fabric/Databricks lakehouse tables on ADLS or OneLake can preserve table versions subject to retention settings.",
          "databricksUsage": "Databricks supports VERSION AS OF, TIMESTAMP AS OF, DESCRIBE HISTORY, and RESTORE TABLE.",
          "databricksRelevance": "Databricks supports VERSION AS OF, TIMESTAMP AS OF, DESCRIBE HISTORY, and RESTORE TABLE.",
          "example": "SELECT * FROM gold.sales VERSION AS OF 42; RESTORE TABLE gold.sales TO VERSION AS OF 42;",
          "expectedOutput": "Historical data can be inspected or restored without reconstructing raw files manually.",
          "practice": "Describe recovery steps after a bad Gold table overwrite.",
          "practiceTask": "Describe recovery steps after a bad Gold table overwrite.",
          "interviewQuestion": "How does Delta time travel help incident response?",
          "interview": {
            "question": "How does Delta time travel help incident response?",
            "answer": "It lets engineers compare versions, identify the bad commit, restore a known-good version, and rerun corrected logic."
          },
          "commonMistakes": [
            "Running VACUUM too aggressively and losing rollback options.",
            "Restoring without understanding downstream dependency refreshes."
          ],
          "productionContext": "A bad deployment overwrites Gold revenue; engineers inspect history, restore the previous version, and rerun the corrected job.",
          "performanceTip": "Long retention improves recoverability but increases storage cost; retention must balance compliance and operational needs.",
          "performanceConsiderations": "Long retention improves recoverability but increases storage cost; retention must balance compliance and operational needs.",
          "seniorEngineeringInsights": "Seniors document restore runbooks and test them before incidents happen.",
          "seniorEngineerNote": "Seniors document restore runbooks and test them before incidents happen.",
          "hints": [
            "Describe recovery steps after a bad Gold table overwrite.",
            "It lets engineers compare versions, identify the bad commit, restore a known-good version, and rerun corrected logic."
          ]
        },
        {
          "id": "delta-change-data-feed",
          "title": "Delta Change Data Feed",
          "difficulty": "Intermediate",
          "explanation": "Delta Change Data Feed exposes row-level changes between table versions.",
          "what": "Delta Change Data Feed exposes row-level changes between table versions.",
          "why": "It enables downstream incremental consumers to process only what changed instead of rereading full tables.",
          "realWorldUsage": "A Gold customer mart emits inserts and updates to a downstream feature table after each successful Silver MERGE.",
          "azureUsage": "CDF is useful for chained lakehouse pipelines on ADLS/OneLake where downstream jobs need version-aware increments.",
          "azureRelevance": "CDF is useful for chained lakehouse pipelines on ADLS/OneLake where downstream jobs need version-aware increments.",
          "databricksUsage": "Databricks supports reading change feed by version or timestamp when change data feed is enabled on a Delta table.",
          "databricksRelevance": "Databricks supports reading change feed by version or timestamp when change data feed is enabled on a Delta table.",
          "example": "SELECT * FROM table_changes(\"silver.orders\", 10, 12);",
          "expectedOutput": "Rows changed between versions 10 and 12 with change type metadata.",
          "practice": "Choose when to use CDF instead of a timestamp watermark.",
          "practiceTask": "Choose when to use CDF instead of a timestamp watermark.",
          "interviewQuestion": "When is Delta CDF useful?",
          "interview": {
            "question": "When is Delta CDF useful?",
            "answer": "When downstream tables need exact table-level changes from Delta versions without building a separate CDC feed."
          },
          "commonMistakes": [
            "Assuming CDF replaces source-system CDC.",
            "Forgetting to enable CDF before changes are needed."
          ],
          "productionContext": "A Gold customer mart emits inserts and updates to a downstream feature table after each successful Silver MERGE.",
          "performanceTip": "CDF reduces downstream scans but adds metadata and retention considerations.",
          "performanceConsiderations": "CDF reduces downstream scans but adds metadata and retention considerations.",
          "seniorEngineeringInsights": "Seniors distinguish source CDC from lakehouse change propagation and choose the right mechanism for each boundary.",
          "seniorEngineerNote": "Seniors distinguish source CDC from lakehouse change propagation and choose the right mechanism for each boundary.",
          "hints": [
            "Choose when to use CDF instead of a timestamp watermark.",
            "When downstream tables need exact table-level changes from Delta versions without building a separate CDC feed."
          ]
        }
      ]
    },
    {
      "title": "Optimization and Maintenance",
      "subtopics": [
        {
          "id": "delta-optimize-vacuum",
          "title": "OPTIMIZE, ZORDER, and VACUUM",
          "difficulty": "Intermediate",
          "explanation": "OPTIMIZE compacts files, ZORDER colocates related data, and VACUUM removes old unreferenced files after retention.",
          "what": "OPTIMIZE compacts files, ZORDER colocates related data, and VACUUM removes old unreferenced files after retention.",
          "why": "Delta tables degrade over time if small files and old versions are never maintained.",
          "realWorldUsage": "A daily Gold revenue table slows from 8 seconds to 4 minutes until OPTIMIZE compacts thousands of small files.",
          "azureUsage": "Fabric and Databricks workloads on lake storage both benefit from table maintenance, but retention must respect compliance needs.",
          "azureRelevance": "Fabric and Databricks workloads on lake storage both benefit from table maintenance, but retention must respect compliance needs.",
          "databricksUsage": "Databricks exposes OPTIMIZE, ZORDER, VACUUM, liquid clustering, and table history to manage Delta performance.",
          "databricksRelevance": "Databricks exposes OPTIMIZE, ZORDER, VACUUM, liquid clustering, and table history to manage Delta performance.",
          "example": "OPTIMIZE gold.sales ZORDER BY (customer_id); VACUUM gold.sales RETAIN 168 HOURS;",
          "expectedOutput": "Fewer files, better file skipping, and controlled storage cleanup.",
          "practice": "Create a maintenance schedule for a frequently merged Silver table and a read-heavy Gold table.",
          "practiceTask": "Create a maintenance schedule for a frequently merged Silver table and a read-heavy Gold table.",
          "interviewQuestion": "Why run OPTIMIZE and VACUUM?",
          "interview": {
            "question": "Why run OPTIMIZE and VACUUM?",
            "answer": "OPTIMIZE improves query performance by compacting files; VACUUM reclaims storage after old versions are no longer needed."
          },
          "commonMistakes": [
            "Vacuuming below safe retention.",
            "ZORDERing too many columns.",
            "Optimizing tiny tables that do not need it."
          ],
          "productionContext": "A daily Gold revenue table slows from 8 seconds to 4 minutes until OPTIMIZE compacts thousands of small files.",
          "performanceTip": "Choose clustering/ZORDER columns from actual filter patterns, not guesses.",
          "performanceConsiderations": "Choose clustering/ZORDER columns from actual filter patterns, not guesses.",
          "seniorEngineeringInsights": "Seniors monitor table history, file count, average file size, and query scan metrics before scheduling maintenance.",
          "seniorEngineerNote": "Seniors monitor table history, file count, average file size, and query scan metrics before scheduling maintenance.",
          "hints": [
            "Create a maintenance schedule for a frequently merged Silver table and a read-heavy Gold table.",
            "OPTIMIZE improves query performance by compacting files; VACUUM reclaims storage after old versions are no longer needed."
          ]
        }
      ]
    }
  ]
};
