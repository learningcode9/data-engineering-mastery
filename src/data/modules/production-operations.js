function opsLesson({ id, title, explanation, why, realWorldUsage, azureUsage, databricksUsage, syntax, example, expectedOutput, interviewQuestion, interviewAnswer, practiceTask, commonMistakes, performanceConsiderations }) {
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
    hint: 'Use the incident sequence: acknowledge, assess impact, contain, diagnose, recover, validate, communicate, prevent recurrence.',
    solution: interviewAnswer,
    commonMistakes,
    productionContext: realWorldUsage,
    performanceTip: performanceConsiderations,
    performanceConsiderations,
    seniorEngineeringInsights: interviewAnswer,
  };
}

export const productionOperationsModule = {
  documentationMapping: [
    {
      concept: 'Production support for Azure data platforms',
      officialSource: 'Official Documentation References',
      sourceUrl: 'https://learn.microsoft.com/en-us/azure/architecture/framework/resiliency/overview',
      howThisLessonUsesIt: 'This module teaches production support as a disciplined operating model for incidents, reruns, hotfixes, communication, and prevention.',
    },
  ],
  sections: [
    {
      title: 'Incident Response',
      subtopics: [
        opsLesson({
          id: 'prod-incident-triage',
          title: 'Incident Triage and Impact Assessment',
          explanation: 'Incident triage determines what is broken, who is affected, how severe it is, and what action is needed now.',
          why: 'Senior data engineers are judged by how calmly and clearly they respond when data is late or wrong.',
          realWorldUsage: 'At 7 AM, revenue dashboard freshness is 3 hours behind. The on-call engineer acknowledges, checks latest successful Gold run, identifies impacted executives, and posts a first update.',
          azureUsage: 'Use ADF run history, Databricks workflows, Azure Monitor, Log Analytics, Fabric refresh history, and Power BI impact analysis.',
          databricksUsage: 'Check workflow runs, Spark UI, cluster events, Delta history, validation tables, and Unity Catalog lineage.',
          syntax: `Triage sequence:
  acknowledge -> severity -> affected tables/reports
  -> last good data -> upstream failure -> owner -> ETA`,
          example: 'Severity P1 if regulated or executive data is stale during business hours; P2 if a non-critical domain mart is delayed.',
          expectedOutput: 'A clear impact statement, owner, current status, and next update time.',
          interviewQuestion: 'Walk me through how you handle a production data incident.',
          interviewAnswer: 'Acknowledge quickly, assess business impact, identify last good data, contain bad outputs, diagnose upstream/downstream lineage, recover safely, validate results, communicate updates, and create prevention actions.',
          practiceTask: 'Write the first 15-minute response for a stale Gold revenue table.',
          commonMistakes: [
            'Debugging silently without acknowledging stakeholders.',
            'Refreshing dashboards with unvalidated data.',
            'Treating all failures as the same severity.',
          ],
          performanceConsiderations: 'During incidents, avoid expensive blind reruns. Use lineage and run history to narrow the affected window.',
        }),
        opsLesson({
          id: 'prod-hotfix-release',
          title: 'Hotfix Handling',
          explanation: 'A hotfix is a controlled emergency change that restores production safely without bypassing all engineering discipline.',
          why: 'Real teams sometimes need urgent fixes, but unreviewed portal edits create future outages.',
          realWorldUsage: 'A schema drift breaks Silver. The team patches the schema handling notebook, deploys through an expedited review, runs one backfill date, validates, and monitors.',
          azureUsage: 'Use CI/CD expedited approvals, release branches, Key Vault-safe parameters, and post-deploy smoke tests.',
          databricksUsage: 'Deploy notebook/package updates with pinned versions and rerun affected Databricks workflow tasks only.',
          syntax: `Hotfix flow:
  isolate fix -> peer review -> deploy minimal change
  -> validate affected data -> communicate -> follow-up cleanup`,
          example: 'A one-line column mapping fix is promoted with emergency approval and linked to an incident ticket.',
          expectedOutput: 'Production restored with an audit trail and no mystery edits.',
          interviewQuestion: 'How do you handle urgent production fixes without creating chaos?',
          interviewAnswer: 'Keep the change minimal, get expedited peer review, use the CI/CD path, validate the affected window, communicate risk, monitor after release, and schedule a normal follow-up cleanup if needed.',
          practiceTask: 'Plan a hotfix for a failed ADF pipeline caused by a renamed source column.',
          commonMistakes: [
            'Editing production directly and forgetting to backport to source control.',
            'Fixing more than the incident requires.',
            'Skipping validation because the fix is small.',
          ],
          performanceConsiderations: 'Limit reruns to the impacted partitions or CDC window to reduce recovery time and cost.',
        }),
      ],
    },
    {
      title: 'Recovery and Prevention',
      subtopics: [
        opsLesson({
          id: 'prod-rerun-backfill',
          title: 'Rerun, Replay, and Backfill Strategy',
          explanation: 'Recovery workflows reprocess affected data windows safely without duplicates, skipped changes, or broken downstream reports.',
          why: 'Every production data platform needs a safe way to recover from missed files, bad source data, failed CDC batches, and business logic fixes.',
          realWorldUsage: 'A bad product hierarchy update affects three days of Gold reports. The team pauses refresh, reprocesses those partitions, validates totals, then republishes.',
          azureUsage: 'ADF parameters, Databricks load_date/run_mode, Delta time travel, Synapse/Fabric validation tables, and audit logs support controlled recovery.',
          databricksUsage: 'Use replaceWhere, MERGE, checkpoints, Delta history, and validation jobs for retry-safe reprocessing.',
          syntax: `Recovery controls:
  affected_start_date
  affected_end_date
  run_mode = rerun|backfill|replay
  idempotent write pattern
  validation gate
  downstream refresh policy`,
          example: 'Reprocess business_date 2026-06-01 to 2026-06-03 and compare source/Silver/Gold revenue before refreshing Power BI.',
          expectedOutput: 'Only the affected window changes, and all downstream users see validated data.',
          interviewQuestion: 'How do you safely backfill a production data pipeline?',
          interviewAnswer: 'Define the affected window, pause conflicting schedules if needed, use idempotent writes, log run mode, validate counts/checksums, refresh downstream only after validation, and preserve audit evidence.',
          practiceTask: 'Design a backfill plan for a CDC replay that affects customer dimensions and sales facts.',
          commonMistakes: [
            'Blindly rerunning full history.',
            'Appending duplicates during backfill.',
            'Refreshing reports before validation passes.',
          ],
          performanceConsiderations: 'Chunk large backfills and schedule them around source-system capacity and platform cost windows.',
        }),
        opsLesson({
          id: 'prod-rca-postmortem',
          title: 'Root Cause Analysis and Prevention',
          explanation: 'RCA turns an incident into durable learning by identifying root cause, contributing factors, detection gaps, and prevention actions.',
          why: 'Senior engineers do not just fix today’s outage; they reduce the chance and impact of the next one.',
          realWorldUsage: 'A schema drift incident leads to a data contract, a schema compatibility test, a Bronze quarantine table, and a freshness alert.',
          azureUsage: 'Use incident timelines from Azure Monitor, ADF, Databricks, Purview/Fabric lineage, and deployment history.',
          databricksUsage: 'Use job run history, Spark UI evidence, Delta history, and validation metrics to support RCA.',
          syntax: `Postmortem sections:
  impact
  timeline
  root cause
  contributing factors
  detection gap
  recovery actions
  prevention owners/dates`,
          example: 'Root cause: source team removed customer_status. Detection gap: no contract test. Prevention: add schema compatibility gate and producer change process.',
          expectedOutput: 'Specific prevention actions with owners and dates, not blame.',
          interviewQuestion: 'What makes a good postmortem for a data incident?',
          interviewAnswer: 'It is blameless, evidence-based, impact-focused, includes a timeline, identifies detection and prevention gaps, assigns owners, and improves tests/alerts/runbooks.',
          practiceTask: 'Write RCA action items for a failed Power BI refresh caused by a bad Gold table schema change.',
          commonMistakes: [
            'Stopping at the immediate error instead of root cause.',
            'Writing vague actions like “be more careful.”',
            'Not assigning owners or due dates.',
          ],
          performanceConsiderations: 'Prevention should consider both reliability and cost; not every incident requires expensive always-on safeguards.',
        }),
      ],
    },
  ],
};
