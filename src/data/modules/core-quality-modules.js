function makeLesson({
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
  commonMistakes,
  performanceConsiderations,
  resumeTips,
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
    hint: 'Tie the answer to a real Azure data pipeline, not a toy example.',
    solution: interviewAnswer,
    interview: {
      question: interviewQuestion,
      answer: interviewAnswer,
    },
    interviewQuestion,
    commonMistakes,
    productionContext: realWorldUsage,
    performanceTip: performanceConsiderations,
    performanceConsiderations,
    resumeTips,
    resumeFraming: resumeTips,
    seniorEngineeringInsights: interviewAnswer,
  };
}

export const gitFundamentalsModule = {
  sections: [
    {
      title: 'Git for Data Engineering Teams',
      subtopics: [
        makeLesson({
          id: 'git-branching-prs',
          title: 'Branches, Pull Requests, and Reviews',
          difficulty: 'Beginner',
          explanation: 'Git tracks code changes. Branches isolate work, pull requests create a review checkpoint, and merges promote approved changes into the shared codebase.',
          why: 'Data engineers use Git to control SQL models, ADF JSON, Databricks notebooks, Python packages, and infrastructure changes.',
          realWorldUsage: 'A developer changes a Silver customer transformation on a feature branch. The team reviews the logic, checks tests, then merges it for deployment.',
          azureUsage: 'Azure DevOps Repos and GitHub both support PR reviews, branch policies, build validation, and deployment triggers for ADF, Synapse, Fabric, and IaC.',
          databricksUsage: 'Databricks Repos or Git folders connect notebooks to Git so production notebook changes are reviewed instead of edited directly.',
          syntax: `git checkout -b feature/customer-dedup
git add src/pipelines/customer_silver.py
git commit -m "Add customer deduplication logic"
git push origin feature/customer-dedup`,
          example: 'A pull request includes the transformation code, a row-count validation query, and a note explaining expected duplicate reduction.',
          expectedOutput: 'Reviewed code is merged with history, ownership, and a deployment trigger.',
          practiceTask: 'Create a PR checklist for a Databricks notebook change that affects a Gold table.',
          interviewQuestion: 'How should Git be used in an Azure data engineering team?',
          interviewAnswer: 'Use branches, PR reviews, branch policies, automated tests, environment-specific deployment pipelines, and no direct production edits. Treat pipelines, notebooks, SQL, and IaC as versioned artifacts.',
          commonMistakes: [
            'Editing production notebooks or ADF pipelines directly.',
            'Merging without validation output.',
            'Putting generated files or secrets into Git.',
          ],
          performanceConsiderations: 'PR checks should include lightweight validation so feedback is fast enough that engineers do not bypass the process.',
          resumeTips: 'Version-controlled ADF, Databricks, SQL, and IaC changes using Git pull requests and release validation.',
        }),
        makeLesson({
          id: 'git-conflicts-data-assets',
          title: 'Merge Conflicts in Data Assets',
          difficulty: 'Intermediate',
          explanation: 'A merge conflict happens when two branches edit the same file or resource definition in incompatible ways.',
          why: 'ADF JSON, dbt models, Fabric notebooks, and Databricks workflow definitions can conflict when several engineers modify the same pipeline.',
          realWorldUsage: 'Two engineers edit the same ADF pipeline: one changes a REST source, another changes the ADLS sink path. The conflict must be resolved without dropping either change.',
          azureUsage: 'ADF Git integration stores pipelines as JSON, so teams need PR discipline and small focused changes to avoid unreadable conflicts.',
          databricksUsage: 'Notebook conflicts are easier to manage when notebooks are exported as source files and reusable logic lives in Python modules.',
          syntax: `git status
git diff
# edit conflicted file
git add path/to/file
git commit`,
          example: 'Resolve an ADF JSON conflict by keeping both the new REST pagination property and the new sink parameter.',
          expectedOutput: 'A clean merge that preserves both intended changes and passes validation.',
          practiceTask: 'Describe how you would resolve a conflict in an ADF pipeline JSON file safely.',
          interviewQuestion: 'What makes Git conflicts risky in data engineering projects?',
          interviewAnswer: 'Pipeline definitions are often config-heavy. A bad conflict resolution can silently remove parameters, linked services, or trigger settings. Resolve conflicts with focused diffs, reviews, and smoke tests.',
          commonMistakes: [
            'Accepting one side blindly.',
            'Resolving generated JSON without running a smoke test.',
            'Combining unrelated changes in one large PR.',
          ],
          performanceConsiderations: 'Small PRs reduce review time and lower the chance of breaking shared pipeline definitions.',
          resumeTips: 'Maintained safe Git workflows for shared ADF/Databricks assets with peer review and smoke validation.',
        }),
        makeLesson({
          id: 'git-rollback-release-tags',
          title: 'Rollback, Tags, and Release History',
          difficulty: 'Intermediate',
          explanation: 'Git history lets teams identify what changed, tag stable releases, and roll back to a known-good version when production breaks.',
          why: 'A senior data engineer must know how to recover from a bad deployment without guessing what changed.',
          realWorldUsage: 'A Gold revenue transformation deploys a bad join. The team identifies the release commit, rolls back the workflow definition, and reruns affected partitions.',
          azureUsage: 'Azure DevOps and GitHub releases can tag ADF, Bicep, Terraform, and pipeline code versions deployed to production.',
          databricksUsage: 'Databricks job definitions and notebooks should map to release commits so a failed job can be traced to a specific change.',
          syntax: `git log --oneline
git tag v1.4.2
git revert <bad_commit_sha>`,
          example: 'Production release v1.4.2 maps to the Databricks workflow deployed on Friday at 5 PM.',
          expectedOutput: 'Production assets can be traced and restored to a known-good release.',
          practiceTask: 'Write a rollback plan for a failed Databricks transformation release.',
          interviewQuestion: 'How do Git tags and release history help production data support?',
          interviewAnswer: 'They connect incidents to exact changes, enable revert/rollback, support audit requirements, and make deployment history understandable during RCA.',
          commonMistakes: [
            'Deploying untagged artifacts.',
            'Rolling back code without rerunning or repairing affected data.',
            'Losing the mapping between deployed workspace assets and Git commits.',
          ],
          performanceConsiderations: 'Rollback plans should target the smallest affected data window to reduce recovery time and compute cost.',
          resumeTips: 'Implemented release tagging and rollback practices for production data pipelines.',
        }),
      ],
    },
  ],
};

export const linuxBasicsModule = {
  sections: [
    {
      title: 'Linux for Data Engineers',
      subtopics: [
        makeLesson({
          id: 'linux-files-shell',
          title: 'Files, Paths, and Shell Navigation',
          difficulty: 'Beginner',
          explanation: 'Linux shell commands help engineers inspect files, navigate folders, and understand where pipeline inputs, logs, and outputs live.',
          why: 'Data engineering work often starts with checking whether files landed, what they contain, and how large they are.',
          realWorldUsage: 'A vendor file fails ingestion. The engineer checks the landing directory, file size, header row, and recent modification time before rerunning the pipeline.',
          azureUsage: 'Azure Cloud Shell, Linux build agents, self-hosted integration runtimes, and VM-based tools all rely on shell basics.',
          databricksUsage: 'Databricks supports `%sh` commands for lightweight inspection and debugging of driver-local files or environment details.',
          syntax: `pwd
ls -lh
cd /data/landing/orders
head -n 5 orders.csv
wc -l orders.csv`,
          example: 'Use `head` to confirm a CSV header changed before a schema mismatch failure.',
          expectedOutput: 'The engineer can quickly confirm file presence, shape, and freshness.',
          practiceTask: 'List commands to verify that a daily orders CSV landed and has more than one row.',
          interviewQuestion: 'Why do Azure data engineers still need Linux basics?',
          interviewAnswer: 'Because build agents, CLIs, logs, containers, self-hosted runtimes, and Databricks shell debugging all use Linux-style commands.',
          commonMistakes: [
            'Assuming a file exists without checking the path.',
            'Using full file downloads instead of lightweight inspection commands.',
            'Confusing local driver files with ADLS/cloud storage paths.',
          ],
          performanceConsiderations: 'Inspect samples and metadata first; avoid reading huge files into terminal output.',
          resumeTips: 'Used Linux shell and Azure CLI diagnostics to troubleshoot file landing and pipeline execution issues.',
        }),
        makeLesson({
          id: 'linux-logs-processes',
          title: 'Logs, Processes, and Exit Codes',
          difficulty: 'Intermediate',
          explanation: 'Linux logs, processes, and exit codes explain whether scripts are running, failing, or silently exiting.',
          why: 'Pipeline support often requires reading logs and understanding why automation stopped.',
          realWorldUsage: 'A self-hosted ingestion script exits with code 1 after a permission error. The engineer tails logs, confirms the failing path, and fixes the service account permission.',
          azureUsage: 'Self-hosted IR machines, Azure DevOps agents, containers, and VM-based ingestion tools commonly expose Linux logs and exit codes.',
          databricksUsage: 'Databricks driver logs and init scripts can fail due to package, permission, or environment problems that look like Linux process issues.',
          syntax: `tail -f pipeline.log
grep -i "error" pipeline.log
ps aux | grep ingest
echo $?`,
          example: 'A deployment script exits non-zero and the CI/CD job fails before deploying a broken notebook.',
          expectedOutput: 'Failures are diagnosable from logs and exit codes, not guesswork.',
          practiceTask: 'Describe how you would inspect a failing Linux-based ingestion job.',
          interviewQuestion: 'How do logs and exit codes support production data operations?',
          interviewAnswer: 'They make automation observable: logs explain what happened, exit codes tell orchestrators whether a step succeeded, and process checks show whether the job is still running.',
          commonMistakes: [
            'Ignoring non-zero exit codes in shell scripts.',
            'Writing logs without timestamps or run IDs.',
            'Searching only the last few lines when the root cause is earlier.',
          ],
          performanceConsiderations: 'Rotate logs and avoid writing excessive debug output for high-frequency jobs.',
          resumeTips: 'Improved production support by adding structured logs, exit-code checks, and shell diagnostics.',
        }),
        makeLesson({
          id: 'linux-env-secrets-cli',
          title: 'Environment Variables, CLI Tools, and Secrets',
          difficulty: 'Intermediate',
          explanation: 'Environment variables and CLI tools configure scripts without hardcoding paths, credentials, or environment names.',
          why: 'The same deployment or ingestion script should work in dev, test, and prod with different parameters.',
          realWorldUsage: 'A GitHub Actions job uses environment variables for workspace URL and reads secrets from Azure Key Vault instead of committing credentials.',
          azureUsage: 'Azure CLI, azcopy, Azure DevOps agents, and GitHub Actions commonly use environment variables and managed identities.',
          databricksUsage: 'Databricks CLI/REST deployment scripts use host, token or federated identity, job IDs, and workspace paths from environment variables.',
          syntax: `export ENV=prod
az account show
az storage fs file list --file-system bronze --account-name mystorage`,
          example: 'Use environment-specific variables to deploy the same Databricks job definition to test and prod.',
          expectedOutput: 'Scripts are portable and secrets are not hardcoded.',
          practiceTask: 'Identify which values should be parameters or secrets in an ADLS copy script.',
          interviewQuestion: 'Why should scripts avoid hardcoded environment values?',
          interviewAnswer: 'Hardcoded values break environment promotion, leak secrets, and make scripts difficult to reuse. Use parameters, environment variables, managed identity, and Key Vault.',
          commonMistakes: [
            'Committing tokens in shell scripts.',
            'Using prod paths in dev jobs.',
            'Not failing fast when required environment variables are missing.',
          ],
          performanceConsiderations: 'CLI calls should be batched where possible; repeated metadata calls in loops can slow deployments.',
          resumeTips: 'Parameterized Azure CLI and deployment scripts for repeatable dev/test/prod data platform operations.',
        }),
      ],
    },
  ],
};

export const etlFundamentalsModule = {
  sections: [
    {
      title: 'ETL and ELT Production Patterns',
      subtopics: [
        makeLesson({
          id: 'etl-vs-elt-core',
          title: 'ETL vs ELT',
          difficulty: 'Beginner',
          explanation: 'ETL transforms data before loading it into a target. ELT loads raw data first, then transforms it inside the lakehouse or warehouse.',
          why: 'Modern Azure platforms often use ELT because ADLS, Databricks, Synapse, and Fabric can store raw data cheaply and transform it with scalable compute.',
          realWorldUsage: 'A CRM API payload lands unchanged in Bronze, Databricks cleans it into Silver, and Fabric Warehouse serves Gold facts and dimensions.',
          azureUsage: 'ADF usually orchestrates extraction/loading; Databricks, Synapse, or Fabric performs transformations depending on workload.',
          databricksUsage: 'Databricks is commonly the ELT transformation engine for Bronze to Silver to Gold Delta tables.',
          syntax: `ETL: source -> transform -> target
ELT: source -> Bronze raw -> Silver clean -> Gold business`,
          example: 'Load raw orders JSON to ADLS first, then transform with PySpark after schema validation.',
          expectedOutput: 'A pipeline that preserves raw data and separates ingestion from transformation.',
          practiceTask: 'Classify an API-to-ADLS-to-Databricks pipeline as ETL or ELT and explain why.',
          interviewQuestion: 'When would you choose ELT over ETL?',
          interviewAnswer: 'Choose ELT when cheap scalable storage and compute allow raw preservation, replay, audit, and flexible transformations. Choose ETL when data must be transformed before landing due to privacy, size, or target constraints.',
          commonMistakes: [
            'Transforming away raw fields before audit/replay.',
            'Calling every pipeline ETL even when it is ELT.',
            'Putting complex transformations in ADF Copy Activity.',
          ],
          performanceConsiderations: 'ELT can reduce source pressure but may increase lakehouse compute cost if transformations are poorly designed.',
          resumeTips: 'Designed ELT pipelines with raw Bronze preservation, governed Silver transforms, and Gold serving models.',
        }),
        makeLesson({
          id: 'etl-batch-incremental',
          title: 'Full, Batch, and Incremental Loads',
          difficulty: 'Intermediate',
          explanation: 'Full loads reload everything. Batch loads process a bounded time slice. Incremental loads process only new or changed records.',
          why: 'Senior engineers choose the right load strategy to balance correctness, source pressure, runtime, and cost.',
          realWorldUsage: 'A 5M-row customer table can full reload nightly, but a 2B-row order history needs watermark or CDC-based incremental processing.',
          azureUsage: 'ADF Lookup and Copy activities can read watermarks; Databricks can apply incremental MERGE logic; Synapse/Fabric can serve validated outputs.',
          databricksUsage: 'Databricks applies deduplication, MERGE, replaceWhere, and audit checks for incremental Delta writes.',
          syntax: `WHERE updated_at > @last_successful_watermark
  AND updated_at <= @current_batch_watermark`,
          example: 'Use a watermark table to extract only orders updated since the last successful run.',
          expectedOutput: 'The pipeline processes a smaller reliable change window instead of scanning all history.',
          practiceTask: 'Choose a load strategy for customers, orders, and product reference data.',
          interviewQuestion: 'How do you design an incremental load safely?',
          interviewAnswer: 'Use a reliable change column or CDC sequence, store the last successful watermark, extract bounded windows, write idempotently, reconcile counts, and update state only after success.',
          commonMistakes: [
            'Using created_at when updates are possible.',
            'Updating watermark before the target write succeeds.',
            'Ignoring late-arriving records.',
          ],
          performanceConsiderations: 'Incremental loads reduce scan cost but need indexes/source filters and careful merge predicates.',
          resumeTips: 'Built incremental data loads with watermarks, idempotent writes, and reconciliation checks.',
        }),
        makeLesson({
          id: 'etl-idempotency-replay',
          title: 'Idempotency and Replay',
          difficulty: 'Advanced',
          explanation: 'An idempotent pipeline can rerun the same input without duplicating rows or changing correct results.',
          why: 'Retries, backfills, and incident recovery are normal in production data engineering.',
          realWorldUsage: 'A daily sales job fails halfway. The rerun replaces the affected date partition instead of appending duplicate rows.',
          azureUsage: 'ADF reruns activities and passes date/run parameters; Databricks performs replaceWhere or MERGE; audit tables record run status.',
          databricksUsage: 'Delta MERGE, partition replacement, checkpoints, and transaction history support replay-safe processing.',
          syntax: `run_id + business_date + idempotent_write + validation_gate`,
          example: 'Backfill only 2026-06-01 through 2026-06-07 and validate source-to-target totals before publishing.',
          expectedOutput: 'Reruns produce the same final table state every time.',
          practiceTask: 'Design idempotent rerun behavior for a failed order pipeline.',
          interviewQuestion: 'What makes an ETL pipeline idempotent?',
          interviewAnswer: 'A clear processing boundary, stable keys/partitions, retry-safe writes, audit state, and validation checks that prevent duplicate or skipped data.',
          commonMistakes: [
            'Blind append on every retry.',
            'No run ID or audit state.',
            'Rerunning full history when only one partition failed.',
          ],
          performanceConsiderations: 'Targeted replay reduces compute cost and recovery time compared with full reloads.',
          resumeTips: 'Implemented retry-safe pipeline patterns using run IDs, watermarks, partition replacement, and validation gates.',
        }),
      ],
    },
  ],
};

export const dataQualityModule = {
  sections: [
    {
      title: 'Data Quality Gates',
      subtopics: [
        makeLesson({
          id: 'dq-quality-dimensions',
          title: 'Quality Dimensions',
          difficulty: 'Beginner',
          explanation: 'Data quality dimensions describe what good data means: completeness, validity, uniqueness, consistency, accuracy, and freshness.',
          why: 'Data engineers need explicit checks because a pipeline can succeed while producing unusable data.',
          realWorldUsage: 'A customer table arrives on time but 35% of customer_id values are null, making it unusable for joins and reporting.',
          azureUsage: 'ADF, Databricks, Synapse, Fabric, and Power BI pipelines should publish quality metrics before data is trusted.',
          databricksUsage: 'Databricks notebooks can compute null, duplicate, range, freshness, and schema metrics before writing Silver or Gold tables.',
          syntax: `Completeness: required_column IS NOT NULL
Uniqueness: COUNT(*) = COUNT(DISTINCT business_key)
Freshness: max(updated_at) within SLA
Validity: amount >= 0`,
          example: 'Check that every order has order_id, customer_id, order_date, and non-negative net_sales.',
          expectedOutput: 'A pass/fail quality result with metric values and thresholds.',
          practiceTask: 'Define five quality checks for a Silver orders table.',
          interviewQuestion: 'What data quality checks would you add to a production pipeline?',
          interviewAnswer: 'Add required-key checks, duplicate checks, schema compatibility, freshness SLA, business rule validation, reconciliation totals, and drift/anomaly monitoring.',
          commonMistakes: [
            'Checking only row count.',
            'Not storing quality results historically.',
            'Using thresholds that business owners never approved.',
          ],
          performanceConsiderations: 'Run checks on changed partitions where possible and aggregate metrics for dashboards.',
          resumeTips: 'Added data quality gates for completeness, uniqueness, freshness, and reconciliation in production pipelines.',
        }),
        makeLesson({
          id: 'dq-validation-gates',
          title: 'Validation Gates',
          difficulty: 'Intermediate',
          explanation: 'A validation gate decides whether data can move to the next layer, update a watermark, or refresh downstream reports.',
          why: 'Bad data should fail closed before it reaches Gold tables or semantic models.',
          realWorldUsage: 'A Silver job detects duplicate order IDs and blocks the Gold refresh until support resolves the source issue.',
          azureUsage: 'ADF If Condition, Databricks notebook outputs, audit tables, Synapse stored procedures, and Fabric pipelines can enforce gates.',
          databricksUsage: 'Databricks can calculate validation metrics and return pass/fail status to ADF or Workflows.',
          syntax: `IF duplicate_order_count = 0
AND null_customer_key_count = 0
AND freshness_minutes <= 60
THEN publish_to_gold`,
          example: 'The pipeline writes Silver but does not update Gold if required-key nulls exceed the threshold.',
          expectedOutput: 'Trusted layers update only after agreed checks pass.',
          practiceTask: 'Design a validation gate before publishing a Gold fact table.',
          interviewQuestion: 'Where should data quality checks run in a medallion pipeline?',
          interviewAnswer: 'Run schema and raw capture checks at Bronze, conformance checks at Silver, and business/reconciliation checks before Gold publication. Block state updates or report refresh when critical gates fail.',
          commonMistakes: [
            'Logging quality failures but publishing anyway.',
            'Updating watermarks before validation.',
            'Putting all checks only at the end of the pipeline.',
          ],
          performanceConsiderations: 'Critical checks should be fast and targeted; deeper profiling can run asynchronously.',
          resumeTips: 'Built validation gates that prevented bad Silver data from publishing to Gold and Power BI.',
        }),
        makeLesson({
          id: 'dq-reconciliation',
          title: 'Reconciliation and Audit Metrics',
          difficulty: 'Advanced',
          explanation: 'Reconciliation compares source, intermediate, and target metrics to prove data was not lost, duplicated, or mis-modeled.',
          why: 'Senior engineers must prove numbers are trustworthy, especially for finance, operations, and executive reporting.',
          realWorldUsage: 'Source orders show $1.2M revenue. Gold fact_sales must match after exclusions, returns, and currency rules are applied.',
          azureUsage: 'Store audit results in ADLS/Fabric/Synapse and alert through Azure Monitor or Teams when variance exceeds tolerance.',
          databricksUsage: 'Databricks can write batch audit rows with source_count, target_count, checksum, duplicate_count, and status.',
          syntax: `source_count
target_count
sum_amount_source
sum_amount_target
variance_percent
validation_status`,
          example: 'Compare Bronze raw row count, Silver valid row count, rejected row count, and Gold fact row count for the same batch.',
          expectedOutput: 'A reconciliation record that explains whether the batch is safe to publish.',
          practiceTask: 'Create reconciliation metrics for a CDC customer load.',
          interviewQuestion: 'How do you prove a pipeline did not drop or duplicate data?',
          interviewAnswer: 'Use row counts, distinct business keys, checksums or measure totals, reject counts, duplicate checks, and source-to-target reconciliation by batch/window.',
          commonMistakes: [
            'Only checking target row count.',
            'Ignoring rejected or quarantined records.',
            'Not tying metrics to run_id and load window.',
          ],
          performanceConsiderations: 'Use partition-level reconciliation and approximate checks for huge tables when exact full scans are too expensive.',
          resumeTips: 'Implemented source-to-target reconciliation with audit metrics and automated failure thresholds.',
        }),
      ],
    },
  ],
};

export const interviewPreparationModule = {
  sections: [
    {
      title: 'Senior Interview Readiness',
      subtopics: [
        makeLesson({
          id: 'interview-answer-structure',
          title: 'Senior Answer Structure',
          difficulty: 'Beginner',
          explanation: 'A strong senior interview answer starts direct, then adds tradeoffs, Azure services, production risks, and validation.',
          why: 'Interviewers are not only checking facts. They want to hear how you think under production constraints.',
          realWorldUsage: 'For a CDC question, a senior answer covers source change capture, checkpointing, MERGE, deletes, replay, reconciliation, and monitoring.',
          azureUsage: 'Mention ADF, ADLS, Databricks, Synapse/Fabric, Key Vault, Azure Monitor, and Purview when relevant.',
          databricksUsage: 'Mention Spark UI, Delta MERGE, checkpoints, Unity Catalog, job clusters, and workflow monitoring when relevant.',
          syntax: `Direct answer -> design -> tradeoffs -> production controls -> validation`,
          example: 'Question: How do you optimize a slow Spark job? Answer starts with Spark UI evidence before suggesting fixes.',
          expectedOutput: 'Concise answer that sounds like real production experience.',
          practiceTask: 'Rewrite a one-line answer into the five-part senior structure.',
          interviewQuestion: 'What separates a senior data engineering interview answer from a junior answer?',
          interviewAnswer: 'Senior answers include tradeoffs, failure modes, cost, security, monitoring, validation, and stakeholder impact, not just definitions.',
          commonMistakes: [
            'Reciting textbook definitions only.',
            'Skipping production validation.',
            'Naming services without explaining tradeoffs.',
          ],
          performanceConsiderations: 'Mention performance only when tied to measurement: query plan, Spark UI, bytes scanned, runtime, or cost.',
          resumeTips: 'Frame interview stories around measurable impact, production reliability, and Azure platform ownership.',
        }),
        makeLesson({
          id: 'interview-sql-spark-round',
          title: 'SQL and Spark Technical Round',
          difficulty: 'Advanced',
          explanation: 'Senior SQL/Spark rounds test transformations, debugging, data quality, performance, and correctness under scale.',
          why: 'Most Azure DE interviews include SQL windows/joins and Spark optimization or pipeline debugging.',
          realWorldUsage: 'You may be asked to deduplicate CDC events, design SCD2, debug a skewed join, or validate duplicate revenue.',
          azureUsage: 'Explain how SQL appears in ADF lookup queries, Synapse/Fabric Warehouse transformations, and Power BI semantic models.',
          databricksUsage: 'Explain PySpark DataFrames, Delta MERGE, Spark UI, partitioning, AQE, broadcast joins, and job clusters.',
          syntax: `Problem -> assumptions -> query/code -> validation -> optimization`,
          example: 'Use ROW_NUMBER over business_key ordered by updated_at desc to keep latest CDC event per key.',
          expectedOutput: 'Correct query or design plus validation and performance explanation.',
          practiceTask: 'Prepare answers for deduplication, SCD2, skewed joins, and incremental MERGE.',
          interviewQuestion: 'How should you approach a SQL/Spark coding problem in an interview?',
          interviewAnswer: 'Clarify grain and edge cases, write the simplest correct solution, validate counts/duplicates/nulls, then discuss performance and productionization.',
          commonMistakes: [
            'Writing code before clarifying grain.',
            'Forgetting late-arriving or duplicate records.',
            'Ignoring performance until the interviewer asks.',
          ],
          performanceConsiderations: 'Mention indexes/pruning for SQL and shuffle/skew/partitioning for Spark.',
          resumeTips: 'Highlight SQL windows, PySpark optimization, CDC MERGE, and reconciliation patterns in project bullets.',
        }),
        makeLesson({
          id: 'interview-architecture-behavioral',
          title: 'Architecture and Behavioral Rounds',
          difficulty: 'Advanced',
          explanation: 'Architecture and behavioral rounds test system design, incident response, communication, and ownership.',
          why: 'Senior roles require designing systems and explaining tradeoffs to engineers, managers, and business stakeholders.',
          realWorldUsage: 'You might design an Azure lakehouse, explain a failed ADF deployment, or walk through a schema drift incident using STAR format.',
          azureUsage: 'Architecture answers should map ingestion, storage, transformation, serving, governance, CI/CD, monitoring, and cost controls to Azure services.',
          databricksUsage: 'Databricks answers should include workload fit, cluster/job design, Delta, Unity Catalog, observability, and cost governance.',
          syntax: `Architecture: requirements -> services -> data flow -> tradeoffs -> risks
Behavioral: situation -> action -> result -> lesson`,
          example: 'For an incident story, explain impact, triage, root cause, fix, prevention, and stakeholder communication.',
          expectedOutput: 'A structured answer that balances technical correctness and leadership behavior.',
          practiceTask: 'Prepare one story each for production incident, performance tuning, failed deployment, and stakeholder conflict.',
          interviewQuestion: 'How do you answer a senior system design question for data engineering?',
          interviewAnswer: 'Start with requirements and SLAs, choose services deliberately, describe data flow and contracts, address governance/security/cost, define observability, and explain failure recovery.',
          commonMistakes: [
            'Drawing services without requirements.',
            'Ignoring governance and cost.',
            'Using a behavioral story without measurable result.',
          ],
          performanceConsiderations: 'Architecture performance should include scale assumptions, bottlenecks, latency, concurrency, and cost tradeoffs.',
          resumeTips: 'Convert stories into bullets with scale, services, reliability improvements, and measurable outcomes.',
        }),
      ],
    },
  ],
};
