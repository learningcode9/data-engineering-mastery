function obsLesson({ id, title, explanation, why, realWorldUsage, azureUsage, databricksUsage, syntax, example, expectedOutput, interviewQuestion, interviewAnswer, practiceTask, commonMistakes, performanceConsiderations }) {
  return {
    id,
    title,
    difficulty: 'Advanced',
    explanation,
    what: explanation,
    why,
    realWorldUsage,
    azureUsage,
    azureRelevance: azureUsage,
    databricksUsage,
    databricksRelevance: databricksUsage,
    syntax,
    example,
    expectedOutput,
    interview: { question: interviewQuestion, answer: interviewAnswer },
    interviewQuestion,
    practice: practiceTask,
    practiceTask,
    hint: 'Map the signal to freshness, volume, schema, distribution, lineage, ownership, or SLA.',
    solution: interviewAnswer,
    commonMistakes,
    productionContext: realWorldUsage,
    performanceTip: performanceConsiderations,
    performanceConsiderations,
    seniorEngineeringInsights: interviewAnswer,
  };
}

export const dataObservabilityModule = {
  documentationMapping: [
    {
      concept: 'Data observability for Azure platforms',
      officialSource: 'Official Documentation References',
      sourceUrl: 'https://learn.microsoft.com/en-us/azure/architecture/databases/guide/dataops-for-the-modern-data-warehouse',
      howThisLessonUsesIt: 'This module treats observability as an operating layer across pipeline health, data freshness, quality drift, lineage, ownership, and incident response.',
    },
  ],
  sections: [
    {
      title: 'Observability Foundations',
      subtopics: [
        obsLesson({
          id: 'observability-pillars',
          title: 'Freshness, Volume, Schema, Distribution, and Lineage',
          explanation: 'Data observability monitors whether data is on time, complete, structurally compatible, statistically believable, and traceable to upstream sources.',
          why: 'A pipeline can succeed while producing stale, incomplete, or semantically wrong data. Senior engineers detect data downtime before stakeholders do.',
          realWorldUsage: 'A Gold revenue table is technically refreshed, but customer_id nulls jump from 1% to 38%. Observability catches the distribution drift before finance reports go out.',
          azureUsage: 'Use Azure Monitor, Log Analytics, Purview lineage, ADF run logs, Fabric monitoring, and audit Delta tables for a complete signal set.',
          databricksUsage: 'Databricks workflows can write quality metrics to Delta, use Unity Catalog lineage, and expose job/query/system table telemetry.',
          syntax: `Signals:
  Freshness: max(updated_at) within SLA
  Volume: row count within expected range
  Schema: no breaking columns/types
  Distribution: nulls/outliers/drift
  Lineage: upstream/downstream impact known`,
          example: 'A daily data health table stores table_name, metric_name, metric_value, expected_range, status, run_id, and owner.',
          expectedOutput: 'Each production table has health signals that can alert the correct owner.',
          interviewQuestion: 'What is data observability and how is it different from pipeline monitoring?',
          interviewAnswer: 'Pipeline monitoring checks whether jobs ran. Data observability checks whether the data is fresh, complete, valid, statistically reasonable, and traceable. Mature platforms need both.',
          practiceTask: 'Define observability checks for a Gold sales table that feeds executive dashboards.',
          commonMistakes: [
            'Monitoring only success/failure status.',
            'Alerting without ownership or severity.',
            'Ignoring lineage, making impact analysis slow.',
          ],
          performanceConsiderations: 'Compute observability metrics incrementally where possible; avoid expensive full-table scans for every run.',
        }),
        obsLesson({
          id: 'observability-alert-design',
          title: 'Alert Design and Severity',
          explanation: 'Good alerts are actionable, owned, severity-based, and tied to business impact instead of noisy technical symptoms.',
          why: 'Noisy alerts train teams to ignore the system. Missing critical alerts causes data outages to reach users.',
          realWorldUsage: 'A Gold table freshness breach during business hours pages on-call, while a low-priority Bronze schema additive change creates a Teams notification.',
          azureUsage: 'Azure Monitor, Action Groups, Log Analytics queries, Teams webhooks, and incident tools can route alerts by severity.',
          databricksUsage: 'Databricks workflow failures, validation metrics, and job duration breaches can feed alert rules or incident tables.',
          syntax: `Severity model:
  P1: executive/regulated data wrong or stale
  P2: important domain SLA breach
  P3: non-blocking drift or warning
  P4: informational trend`,
          example: 'If gold.daily_revenue freshness > 60 minutes after SLA, page the owner. If source volume drops 10% but still within expected holiday range, suppress or downgrade.',
          expectedOutput: 'Alerts route to the right team with enough context to act.',
          interviewQuestion: 'How do you design data alerts that are useful instead of noisy?',
          interviewAnswer: 'Tie alerts to business impact, define severity, include owner/run/table/context, suppress known events, use multi-signal checks, and review alert quality after incidents.',
          practiceTask: 'Create a severity model for freshness, schema, volume, and quality failures.',
          commonMistakes: [
            'Alerting every small variance as a page.',
            'Sending alerts without table owner or run context.',
            'Not tuning thresholds for seasonality.',
          ],
          performanceConsiderations: 'Alert rules should query summarized metric tables, not scan raw data repeatedly.',
        }),
      ],
    },
    {
      title: 'Operational Debugging',
      subtopics: [
        obsLesson({
          id: 'observability-lineage-debugging',
          title: 'Lineage-Driven Debugging',
          explanation: 'Lineage connects sources, pipelines, tables, semantic models, and dashboards so incidents can be traced upstream and downstream quickly.',
          why: 'When a dashboard is wrong, the first question is what changed upstream and who is impacted downstream.',
          realWorldUsage: 'A Power BI metric is stale. Lineage shows it depends on gold.fact_sales, silver.orders_clean, and the CRM API ingestion pipeline that failed overnight.',
          azureUsage: 'Microsoft Purview, Fabric lineage, ADF lineage, and Power BI impact analysis provide different parts of the Azure lineage story.',
          databricksUsage: 'Unity Catalog lineage helps trace notebook/query/table dependencies in Databricks lakehouse workloads.',
          syntax: `Incident flow:
  alert -> affected table -> upstream pipeline/source
  -> downstream dashboards/users -> owner/runbook`,
          example: 'An alert on gold.customer_360 links to the failed ADF source pipeline, Databricks job run, and impacted executive dashboard.',
          expectedOutput: 'Shorter mean time to identify root cause and impacted consumers.',
          interviewQuestion: 'How does lineage help during a production data incident?',
          interviewAnswer: 'Lineage identifies upstream causes and downstream impact, helping teams prioritize, contact stakeholders, and avoid blind debugging across hundreds of tables.',
          practiceTask: 'Describe how you would trace a stale dashboard back to the failing source in an Azure lakehouse.',
          commonMistakes: [
            'Documenting lineage manually and never updating it.',
            'Only tracking table-to-table lineage, not pipeline/report ownership.',
            'Ignoring custom code lineage gaps.',
          ],
          performanceConsiderations: 'Lineage collection should be automated from platform metadata where possible to avoid manual maintenance cost.',
        }),
        obsLesson({
          id: 'observability-quality-drift',
          title: 'Quality Drift and Anomaly Detection',
          explanation: 'Quality drift checks detect unusual changes in null rates, value distributions, duplicate rates, and business metrics.',
          why: 'Wrong data often looks structurally valid. Distribution checks catch issues that schema checks miss.',
          realWorldUsage: 'The order_status column still exists, but 70% of rows suddenly become UNKNOWN after a source release.',
          azureUsage: 'Store quality metrics in ADLS/Fabric/Log Analytics and expose health dashboards to data owners.',
          databricksUsage: 'Spark jobs can compute null rates, distinct counts, quantiles, and anomaly scores per batch before publishing Gold.',
          syntax: `Quality metrics:
  null_rate(customer_id)
  duplicate_rate(order_id)
  distinct_count(order_status)
  min/max/avg(amount)
  variance vs 7-day baseline`,
          example: 'A Silver job fails the batch if null customer_id jumps above the approved 5% threshold.',
          expectedOutput: 'Bad data is stopped or flagged before it reaches semantic models.',
          interviewQuestion: 'How do you detect silent data quality problems?',
          interviewAnswer: 'Track distribution metrics over time, compare against baselines and business calendars, correlate multiple signals, and route alerts with ownership and severity.',
          practiceTask: 'Define drift checks for customer, orders, and payment tables.',
          commonMistakes: [
            'Using static thresholds without seasonality.',
            'Checking row count only.',
            'Failing the pipeline without preserving the bad batch for analysis.',
          ],
          performanceConsiderations: 'Use approximate metrics or partition-level checks for very large tables where exact profiling is too expensive.',
        }),
      ],
    },
  ],
};
