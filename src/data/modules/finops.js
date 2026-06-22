export const finopsModule = {
  documentationMapping: [
    {
      concept: 'FinOps for data platforms',
      officialSource: 'Official Documentation References',
      sourceUrl: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/overview-cost-management',
      howThisLessonUsesIt: 'This module frames cost management as an operating discipline for Fabric, Databricks, Synapse, and ADLS workloads.',
    },
  ],
  sections: [
    {
      title: 'Capacity and Compute Economics',
      subtopics: [
        {
          id: 'finops-fabric-capacity',
          title: 'Fabric Capacity Management',
          difficulty: 'Intermediate',
          explanation: 'Fabric capacity is shared compute. The real skill is sizing and protecting it so one team does not throttle another.',
          why: 'A senior DE should know how to read utilization, identify throttling, and isolate noisy workloads before simply buying a bigger SKU.',
          syntax: `Fabric FinOps checklist:
  - Review utilization and throttling metrics
  - Identify overlapping refresh windows
  - Separate noisy workspaces when needed
  - Set alerts before users feel contention
  - Document who owns each capacity`,
          example: 'A finance workspace and a notebook-heavy engineering workspace share one F64. Stagger refreshes and move the heavy notebook to another capacity so business reports stay responsive.',
          productionContext: 'This is a shared service problem: a noisy notebook can slow Power BI refreshes, semantic model queries, and ingestion jobs if it is left on the same capacity.',
          expectedOutput: 'A capacity plan that explains where throttling comes from and what action keeps the SLA safe at the lowest cost.',
          interview: {
            question: 'How would you stop Fabric throttling without wasting budget?',
            answer: 'Show the metrics first, then explain whether the better fix is workload isolation, scheduling changes, or a right-sized F SKU. Buying more capacity is the last option, not the first.',
          },
          practice: 'Describe how you would protect a business-critical semantic model from a heavy engineering notebook that runs every morning.',
          hint: 'Talk about noisy neighbors, refresh windows, and ownership boundaries.',
          solution: `# Mitigation plan
1. Inspect Fabric capacity metrics for throttling and peak utilization.
2. Move non-critical notebook work to a separate workspace or capacity.
3. Stagger refreshes so model and notebook peaks do not overlap.
4. Set alerts for utilization and throttling thresholds.
5. Revisit the F SKU only after the workload shape is understood.`,
        },
        {
          id: 'finops-databricks-cost',
          title: 'Databricks Cost Optimization',
          difficulty: 'Intermediate',
          explanation: 'Databricks cost is mostly compute cost, so the goal is to run the right cluster type for the shortest time with the least shuffle.',
          why: 'Senior engineers should know job clusters, autoscaling, and file layout because those choices determine both speed and DBU spend.',
          syntax: `Databricks cost levers:
  - Job clusters for scheduled work
  - All-purpose clusters only for exploration
  - Auto-termination for idle dev clusters
  - Autoscaling only when it reduces wall time
  - Compact files to avoid expensive shuffles`,
          example: 'A 45-minute nightly ETL job moves from an always-on all-purpose cluster to a job cluster with auto-termination, cutting idle DBU spend dramatically.',
          productionContext: 'The same Spark job can be cheap or expensive depending on whether the team leaves clusters running, over-allocates executors, or creates tiny files that force extra scans and shuffles.',
          expectedOutput: 'A cost plan that explains why the chosen cluster type, size, and file strategy still meets the SLA.',
          interview: {
            question: 'How would you reduce Databricks spend for a daily ETL pipeline?',
            answer: 'Use a job cluster, right-size executors, enable autoscaling only if it helps, auto-terminate idle environments, and tune partitioning and file size so the job does less work.',
          },
          practice: 'Explain how you would move a notebook from an all-purpose dev cluster into a cheaper production job cluster.',
          hint: 'Mention startup time, idleness, and why production jobs should not share the dev cluster.',
          solution: `# Cost-focused deployment pattern
1. Keep development on an all-purpose cluster.
2. Run production on a job cluster.
3. Enable auto-termination for interactive clusters.
4. Revisit partitioning, joins, and file size to reduce shuffle.
5. Measure DBU usage before and after the change.`,
        },
      ],
    },
    {
      title: 'Storage and Controls',
      subtopics: [
        {
          id: 'finops-synapse-cost',
          title: 'Synapse Cost Controls',
          difficulty: 'Intermediate',
          explanation: 'Synapse cost control is about pausing idle compute, right-sizing DWUs, and choosing the cheapest engine that still meets the SLA.',
          why: 'Dedicated pools charge for compute while they are running, so a senior DE should know how to stop paying for idle time.',
          syntax: `Synapse cost controls:
  - Pause when the pool is idle
  - Scale DWUs for known demand
  - Use workload management for concurrency
  - Keep storage and compute decisions separate
  - Use Serverless SQL when the workload is ad hoc`,
          example: 'A warehouse that only serves a morning report should not run overnight; pause it after the last load and resume before the business starts querying.',
          productionContext: 'Leaving a pool on all night is one of the most common and easiest-to-fix budget leaks in Azure analytics platforms.',
          expectedOutput: 'A Synapse operating model that explains when to pause, when to scale, and when to use serverless instead.',
          interview: {
            question: 'How do you control Synapse spend without hurting analysts?',
            answer: 'Pause idle dedicated pools, scale to the workload window, use workload management to protect concurrency, and move ad hoc exploration to serverless SQL when possible.',
          },
          practice: 'Describe how you would keep a Synapse pool ready for business hours while minimizing overnight spend.',
          hint: 'Talk about pause/resume, predictable workloads, and serverless as the cheaper exploration path.',
          solution: `# Synapse operating plan
1. Classify workloads by SLA and concurrency.
2. Pause dedicated pools when the warehouse is idle.
3. Scale DWUs up only for known heavy windows.
4. Route ad hoc exploration to serverless SQL.
5. Monitor query patterns before changing the SKU.`,
        },
        {
          id: 'finops-storage-lifecycle',
          title: 'Storage Lifecycle Management',
          difficulty: 'Intermediate',
          explanation: 'Storage lifecycle management moves data to cheaper tiers based on age, access, and retention rules.',
          why: 'A senior DE should know when raw data can move from hot to cool or archive without breaking reprocessing or compliance.',
          syntax: `ADLS lifecycle policy:
  - Hot  → active Bronze/Silver data
  - Cool → historical but still recoverable
  - Archive → compliance or rarely touched backups
  - Retention rules → delete when policy allows`,
          example: 'Raw Bronze files older than 30 days move to Cool, and compliance exports move to Archive after the legal hold window ends.',
          productionContext: 'Without lifecycle automation, hot storage quietly becomes a cost sink because nobody wants to delete data manually.',
          expectedOutput: 'A storage policy that shows where each tier is used and how long data remains in each tier.',
          interview: {
            question: 'When would you use Cool or Archive storage for a data lake?',
            answer: 'Use Cool for historical data that is still recoverable, Archive for long-retention data that is rarely accessed, and keep active Bronze/Silver data hot only while it is operationally useful.',
          },
          practice: 'Explain how you would set a lifecycle policy for a Bronze landing zone with a 30-day reprocessing window.',
          hint: 'Mention retrieval latency, minimum retention, and compliance.',
          solution: `# Lifecycle policy example
1. Keep the active Bronze window in Hot.
2. Move older raw files to Cool after the reprocess window closes.
3. Move long-term archives to Archive only when access is rare.
4. Attach retention and deletion rules to each container.`,
        },
      ],
    },
  ],
  miniProjects: [
    {
      title: 'FinOps Runbook for an Azure Data Platform',
      goal: 'Document how you would detect, explain, and reduce spend without breaking the SLA.',
      tasks: [
        'Identify the most expensive capacity, cluster, or pool.',
        'Describe the lowest-risk cost fix.',
        'List the alerting and ownership changes that prevent the same issue later.',
      ],
      expectedOutput: 'A one-page operating note showing cost drivers, mitigation steps, and ownership.',
    },
  ],
};
