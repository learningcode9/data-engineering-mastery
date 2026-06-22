export const adlsGen2Module = {
  "sections": [
    {
      "title": "Storage Foundations",
      "subtopics": [
        {
          "id": "adls-hierarchical-namespace",
          "title": "Hierarchical Namespace",
          "difficulty": "Intermediate",
          "explanation": "ADLS Gen2 is Azure Blob Storage with a hierarchical namespace that makes folders, paths, and file-level permissions first-class concepts.",
          "what": "ADLS Gen2 is Azure Blob Storage with a hierarchical namespace that makes folders, paths, and file-level permissions first-class concepts.",
          "why": "Senior Azure Data Engineers design reliable landing zones, medallion folders, and secure data domains on top of ADLS Gen2.",
          "realWorldUsage": "A retail pipeline lands raw API extracts in /bronze/crm/orders/load_date=2026-06-14 and promotes curated Delta tables to /silver and /gold paths.",
          "azureUsage": "ADF, Synapse, Fabric shortcuts, Databricks external locations, and Azure Functions all commonly read and write ADLS Gen2 paths.",
          "azureRelevance": "ADF, Synapse, Fabric shortcuts, Databricks external locations, and Azure Functions all commonly read and write ADLS Gen2 paths.",
          "databricksUsage": "Databricks commonly stores Delta tables on ADLS Gen2 through Unity Catalog external locations or managed storage roots.",
          "databricksRelevance": "Databricks commonly stores Delta tables on ADLS Gen2 through Unity Catalog external locations or managed storage roots.",
          "example": "abfss://bronze@contosolake.dfs.core.windows.net/crm/orders/load_date=2026-06-14/",
          "expectedOutput": "A predictable lake path that supports partition pruning, lifecycle policies, and access control.",
          "practice": "Design Bronze, Silver, and Gold folder paths for CRM orders, customers, and products.",
          "practiceTask": "Design Bronze, Silver, and Gold folder paths for CRM orders, customers, and products.",
          "interviewQuestion": "Why does hierarchical namespace matter in ADLS Gen2?",
          "interview": {
            "question": "Why does hierarchical namespace matter in ADLS Gen2?",
            "answer": "It enables directory semantics, atomic rename operations, ACLs, and lake-style path organization on top of Azure object storage."
          },
          "commonMistakes": [
            "Using random folder names that do not encode source, entity, or load date.",
            "Treating ADLS like a shared file dump instead of a governed data lake."
          ],
          "productionContext": "A retail pipeline lands raw API extracts in /bronze/crm/orders/load_date=2026-06-14 and promotes curated Delta tables to /silver and /gold paths.",
          "performanceTip": "Path design affects listing performance, partition pruning, and the number of files each engine must scan.",
          "performanceConsiderations": "Path design affects listing performance, partition pruning, and the number of files each engine must scan.",
          "seniorEngineeringInsights": "Seniors design ADLS paths as contracts: source, entity, layer, partition, retention, and ownership are explicit.",
          "seniorEngineerNote": "Seniors design ADLS paths as contracts: source, entity, layer, partition, retention, and ownership are explicit.",
          "hints": [
            "Design Bronze, Silver, and Gold folder paths for CRM orders, customers, and products.",
            "It enables directory semantics, atomic rename operations, ACLs, and lake-style path organization on top of Azure object storage."
          ]
        },
        {
          "id": "adls-containers-zones",
          "title": "Containers, Zones, and Naming",
          "difficulty": "Intermediate",
          "explanation": "Containers separate storage boundaries, while zones such as raw, bronze, silver, and gold separate data maturity.",
          "what": "Containers separate storage boundaries, while zones such as raw, bronze, silver, and gold separate data maturity.",
          "why": "Clear zone design prevents accidental access to raw data and makes operational ownership easier.",
          "realWorldUsage": "A finance lake might use separate containers for bronze, silver, gold, and quarantine so PII and failed records can be governed differently.",
          "azureUsage": "ADF linked services and datasets often point to specific containers and parameterized paths.",
          "azureRelevance": "ADF linked services and datasets often point to specific containers and parameterized paths.",
          "databricksUsage": "Unity Catalog external locations can map to storage paths with grants scoped by catalog, schema, or external location.",
          "databricksRelevance": "Unity Catalog external locations can map to storage paths with grants scoped by catalog, schema, or external location.",
          "example": "bronze/crm/orders/load_date=YYYY-MM-DD, silver/crm/orders, gold/sales/fact_sales",
          "expectedOutput": "A lake layout where users can identify data quality level and ownership from the path.",
          "practice": "Create a naming convention for containers and folders in a medallion lake.",
          "practiceTask": "Create a naming convention for containers and folders in a medallion lake.",
          "interviewQuestion": "How do you organize ADLS for a medallion architecture?",
          "interview": {
            "question": "How do you organize ADLS for a medallion architecture?",
            "answer": "Use explicit zones for raw/bronze/silver/gold, partition by processing or business dates, isolate sensitive domains, and document ownership and retention."
          },
          "commonMistakes": [
            "Putting all layers in one uncontrolled folder.",
            "Mixing raw files and curated Delta tables in the same path."
          ],
          "productionContext": "A finance lake might use separate containers for bronze, silver, gold, and quarantine so PII and failed records can be governed differently.",
          "performanceTip": "Consistent partition paths allow Spark, Synapse serverless, and Fabric shortcuts to prune data efficiently.",
          "performanceConsiderations": "Consistent partition paths allow Spark, Synapse serverless, and Fabric shortcuts to prune data efficiently.",
          "seniorEngineeringInsights": "Seniors align storage boundaries with security, retention, cost, and operational support models.",
          "seniorEngineerNote": "Seniors align storage boundaries with security, retention, cost, and operational support models.",
          "hints": [
            "Create a naming convention for containers and folders in a medallion lake.",
            "Use explicit zones for raw/bronze/silver/gold, partition by processing or business dates, isolate sensitive domains, and document ownership and retention."
          ]
        }
      ]
    },
    {
      "title": "Security and Governance",
      "subtopics": [
        {
          "id": "adls-rbac-acls",
          "title": "RBAC vs ACLs",
          "difficulty": "Intermediate",
          "explanation": "Azure RBAC controls access at management/resource scope; POSIX-style ACLs control directory and file access inside the lake.",
          "what": "Azure RBAC controls access at management/resource scope; POSIX-style ACLs control directory and file access inside the lake.",
          "why": "Real enterprise lakes need both platform access and path-level data access controls.",
          "realWorldUsage": "A BI group may have Storage Blob Data Reader on the account but only read ACLs on /gold/sales, not /bronze/hr.",
          "azureUsage": "Use Entra ID groups, managed identities, RBAC roles, and ACLs together; avoid account keys for production pipelines.",
          "azureRelevance": "Use Entra ID groups, managed identities, RBAC roles, and ACLs together; avoid account keys for production pipelines.",
          "databricksUsage": "Unity Catalog can abstract many permissions, but underlying ADLS access still matters for external locations and managed identities.",
          "databricksRelevance": "Unity Catalog can abstract many permissions, but underlying ADLS access still matters for external locations and managed identities.",
          "example": "ADF managed identity gets execute/read/write ACLs on /bronze/crm and /silver/crm, but analysts get read-only /gold.",
          "expectedOutput": "Least-privilege storage access with no shared keys in code or pipeline configs.",
          "practice": "Define access for ADF, Databricks jobs, analysts, and data stewards across Bronze/Silver/Gold.",
          "practiceTask": "Define access for ADF, Databricks jobs, analysts, and data stewards across Bronze/Silver/Gold.",
          "interviewQuestion": "How do RBAC and ACLs differ in ADLS Gen2?",
          "interview": {
            "question": "How do RBAC and ACLs differ in ADLS Gen2?",
            "answer": "RBAC grants Azure resource permissions; ACLs grant path-level filesystem permissions. Production lakes usually require both."
          },
          "commonMistakes": [
            "Granting Storage Blob Data Contributor at account scope to everyone.",
            "Using storage account keys instead of managed identity."
          ],
          "productionContext": "A BI group may have Storage Blob Data Reader on the account but only read ACLs on /gold/sales, not /bronze/hr.",
          "performanceTip": "Permission checks add overhead when listing many small paths; good folder structure reduces unnecessary listing.",
          "performanceConsiderations": "Permission checks add overhead when listing many small paths; good folder structure reduces unnecessary listing.",
          "seniorEngineeringInsights": "Seniors design access with Entra groups and automation so permissions are auditable and reproducible.",
          "seniorEngineerNote": "Seniors design access with Entra groups and automation so permissions are auditable and reproducible.",
          "hints": [
            "Define access for ADF, Databricks jobs, analysts, and data stewards across Bronze/Silver/Gold.",
            "RBAC grants Azure resource permissions; ACLs grant path-level filesystem permissions. Production lakes usually require both."
          ]
        },
        {
          "id": "adls-private-endpoints-key-vault",
          "title": "Private Access and Secrets",
          "difficulty": "Intermediate",
          "explanation": "Private endpoints keep storage traffic on private networks, while Key Vault and managed identities remove secrets from code.",
          "what": "Private endpoints keep storage traffic on private networks, while Key Vault and managed identities remove secrets from code.",
          "why": "Enterprise Azure data platforms must prevent public data exposure and credential leakage.",
          "realWorldUsage": "ADF copies vendor files into ADLS through a private endpoint and retrieves vendor API credentials from Key Vault at runtime.",
          "azureUsage": "Use private endpoints, firewall rules, managed identities, Key Vault references, and diagnostic logs for secure ingestion.",
          "azureRelevance": "Use private endpoints, firewall rules, managed identities, Key Vault references, and diagnostic logs for secure ingestion.",
          "databricksUsage": "Databricks workspaces can reach ADLS through private networking and access data through Unity Catalog credentials.",
          "databricksRelevance": "Databricks workspaces can reach ADLS through private networking and access data through Unity Catalog credentials.",
          "example": "ADF Managed Identity -> Key Vault secret -> REST API -> ADLS private endpoint Bronze path",
          "expectedOutput": "A pipeline that moves data without public storage access or hardcoded secrets.",
          "practice": "List the security controls required before a production ADF pipeline can write to ADLS.",
          "practiceTask": "List the security controls required before a production ADF pipeline can write to ADLS.",
          "interviewQuestion": "How do you secure ADLS access for production pipelines?",
          "interview": {
            "question": "How do you secure ADLS access for production pipelines?",
            "answer": "Use managed identities, least-privilege RBAC/ACLs, private endpoints, Key Vault for external secrets, and diagnostic logging."
          },
          "commonMistakes": [
            "Leaving public network access open for convenience.",
            "Checking connection strings into Git or ADF exports."
          ],
          "productionContext": "ADF copies vendor files into ADLS through a private endpoint and retrieves vendor API credentials from Key Vault at runtime.",
          "performanceTip": "Private endpoints may require DNS planning; poor private DNS setup causes intermittent pipeline failures that look like storage issues.",
          "performanceConsiderations": "Private endpoints may require DNS planning; poor private DNS setup causes intermittent pipeline failures that look like storage issues.",
          "seniorEngineeringInsights": "Seniors include network, identity, and audit requirements in the storage design before the first pipeline lands data.",
          "seniorEngineerNote": "Seniors include network, identity, and audit requirements in the storage design before the first pipeline lands data.",
          "hints": [
            "List the security controls required before a production ADF pipeline can write to ADLS.",
            "Use managed identities, least-privilege RBAC/ACLs, private endpoints, Key Vault for external secrets, and diagnostic logging."
          ]
        }
      ]
    },
    {
      "title": "Production Operations",
      "subtopics": [
        {
          "id": "adls-file-layout-small-files",
          "title": "File Layout and Small Files",
          "difficulty": "Intermediate",
          "explanation": "File layout controls how many files are written, how large they are, and how engines discover them.",
          "what": "File layout controls how many files are written, how large they are, and how engines discover them.",
          "why": "Small files are one of the most common causes of slow Spark, Synapse serverless, and Fabric queries.",
          "realWorldUsage": "A CDC stream writes thousands of tiny files per hour; a compaction job converts them into query-friendly Delta files.",
          "azureUsage": "Synapse serverless and Fabric scan files directly, so file count and partition layout affect both latency and cost.",
          "azureRelevance": "Synapse serverless and Fabric scan files directly, so file count and partition layout affect both latency and cost.",
          "databricksUsage": "Databricks uses OPTIMIZE, Auto Loader options, and Delta file compaction to control file size and metadata overhead.",
          "databricksRelevance": "Databricks uses OPTIMIZE, Auto Loader options, and Delta file compaction to control file size and metadata overhead.",
          "example": "Target file size: 128MB-1GB for analytical tables, partitioned by date or business domain.",
          "expectedOutput": "Fewer, larger files that still preserve useful partition pruning.",
          "practice": "Diagnose a Silver table with 400,000 files averaging 200KB and propose a remediation plan.",
          "practiceTask": "Diagnose a Silver table with 400,000 files averaging 200KB and propose a remediation plan.",
          "interviewQuestion": "Why are small files bad in ADLS-backed lakes?",
          "interview": {
            "question": "Why are small files bad in ADLS-backed lakes?",
            "answer": "They increase metadata listing, planning overhead, and file-open cost before the engine can process data."
          },
          "commonMistakes": [
            "Partitioning by high-cardinality keys such as customer_id.",
            "Letting every micro-batch create tiny files forever."
          ],
          "productionContext": "A CDC stream writes thousands of tiny files per hour; a compaction job converts them into query-friendly Delta files.",
          "performanceTip": "Compact small files and partition by common date filters; avoid over-partitioning.",
          "performanceConsiderations": "Compact small files and partition by common date filters; avoid over-partitioning.",
          "seniorEngineeringInsights": "Seniors monitor file count and average file size as production health metrics, not just query duration.",
          "seniorEngineerNote": "Seniors monitor file count and average file size as production health metrics, not just query duration.",
          "hints": [
            "Diagnose a Silver table with 400,000 files averaging 200KB and propose a remediation plan.",
            "They increase metadata listing, planning overhead, and file-open cost before the engine can process data."
          ]
        },
        {
          "id": "adls-lifecycle-retention",
          "title": "Lifecycle and Retention",
          "difficulty": "Intermediate",
          "explanation": "Lifecycle policies move or delete files based on age, path, access tier, and retention requirements.",
          "what": "Lifecycle policies move or delete files based on age, path, access tier, and retention requirements.",
          "why": "Data lake storage grows forever unless retention is designed deliberately.",
          "realWorldUsage": "Raw vendor files are kept hot for 30 days, cool for 180 days, archived for seven years, and quarantined files are deleted after 90 days.",
          "azureUsage": "ADLS lifecycle management can transition blobs across hot, cool, cold, and archive tiers or delete expired data automatically.",
          "azureRelevance": "ADLS lifecycle management can transition blobs across hot, cool, cold, and archive tiers or delete expired data automatically.",
          "databricksUsage": "Delta VACUUM and ADLS lifecycle policies must be coordinated so time travel and compliance retention are not broken.",
          "databricksRelevance": "Delta VACUUM and ADLS lifecycle policies must be coordinated so time travel and compliance retention are not broken.",
          "example": "bronze/raw: hot 30 days -> cool 180 days -> archive 7 years; temp/checkpoints: delete after 14 days.",
          "expectedOutput": "A cost-aware retention plan that preserves audit requirements without storing everything hot forever.",
          "practice": "Create a retention policy for raw files, Delta tables, checkpoints, and quarantine data.",
          "practiceTask": "Create a retention policy for raw files, Delta tables, checkpoints, and quarantine data.",
          "interviewQuestion": "How do you control ADLS storage cost over time?",
          "interview": {
            "question": "How do you control ADLS storage cost over time?",
            "answer": "Use lifecycle tiers, retention policies, compaction, cleanup of temp/checkpoint data, and governance around raw vs curated retention."
          },
          "commonMistakes": [
            "Archiving Delta files still needed by active tables.",
            "Deleting checkpoints needed for streaming recovery."
          ],
          "productionContext": "Raw vendor files are kept hot for 30 days, cool for 180 days, archived for seven years, and quarantined files are deleted after 90 days.",
          "performanceTip": "Archive is cheap but slow to rehydrate; do not archive data that operational pipelines need for normal reprocessing.",
          "performanceConsiderations": "Archive is cheap but slow to rehydrate; do not archive data that operational pipelines need for normal reprocessing.",
          "seniorEngineeringInsights": "Seniors separate compliance retention, operational replay windows, and analytical hot data into different policies.",
          "seniorEngineerNote": "Seniors separate compliance retention, operational replay windows, and analytical hot data into different policies.",
          "hints": [
            "Create a retention policy for raw files, Delta tables, checkpoints, and quarantine data.",
            "Use lifecycle tiers, retention policies, compaction, cleanup of temp/checkpoint data, and governance around raw vs curated retention."
          ]
        }
      ]
    }
  ]
};
