function lesson({
  id,
  title,
  difficulty = 'Advanced',
  explanation,
  why,
  realWorldUsage,
  azureUsage,
  databricksUsage,
  syntax,
  example,
  expectedOutput,
  interviewQuestion,
  interviewAnswer,
  practiceTask,
  commonMistakes,
  performanceConsiderations,
}) {
  return {
    id,
    title,
    difficulty,
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
    hint: 'Think dev/test/prod, secrets, approvals, validation, rollback, and monitoring after deployment.',
    solution: interviewAnswer,
    commonMistakes,
    productionContext: realWorldUsage,
    performanceTip: performanceConsiderations,
    performanceConsiderations,
    seniorEngineeringInsights: interviewAnswer,
  };
}

export const cicdDataEngineeringModule = {
  documentationMapping: [
    {
      concept: 'CI/CD for Azure data engineering',
      officialSource: 'Official Documentation References',
      sourceUrl: 'https://learn.microsoft.com/en-us/devops/',
      howThisLessonUsesIt: 'This module frames Azure DevOps, GitHub Actions, ADF deployments, Databricks releases, infrastructure as code, approvals, rollback, and validation as one production release discipline.',
    },
  ],
  sections: [
    {
      title: 'Release Foundations',
      subtopics: [
        lesson({
          id: 'cicd-dev-test-prod',
          title: 'Dev → Test → Prod Promotion',
          explanation: 'Data platform CI/CD promotes reviewed code and configuration through controlled environments instead of editing production resources manually.',
          why: 'Senior Azure Data Engineers must prove changes are reviewed, testable, reversible, and environment-safe.',
          realWorldUsage: 'A pipeline change is merged through a pull request, deployed to test, smoke-tested with sample data, approved, deployed to prod, and monitored during the first run.',
          azureUsage: 'Azure DevOps or GitHub Actions deploy ADF, Databricks jobs, Synapse/Fabric artifacts, and infrastructure parameters across environments.',
          databricksUsage: 'Databricks notebooks/jobs should be versioned, parameterized, and deployed with environment-specific workspace paths and secrets.',
          syntax: `feature branch -> pull request -> test deploy -> smoke validation
-> approval -> prod deploy -> post-deploy monitoring`,
          example: 'A Bronze ingestion fix is tested in dev, deployed to test with test storage accounts, then promoted to prod with prod Key Vault and ADLS parameters.',
          expectedOutput: 'The same reviewed release artifact moves across environments with only parameters changing.',
          interviewQuestion: 'How do you promote an Azure data pipeline safely from development to production?',
          interviewAnswer: 'Use Git, pull requests, automated validation, environment parameters, secrets from Key Vault/OIDC, approval gates, smoke tests, rollback artifacts, and monitor the first production run.',
          practiceTask: 'Design a release flow for an ADF + Databricks daily orders pipeline.',
          commonMistakes: [
            'Editing production pipelines directly.',
            'Using different code in test and prod.',
            'Skipping post-deploy validation because the deployment succeeded.',
          ],
          performanceConsiderations: 'Deployment validation should include runtime and cost regression checks for critical jobs.',
        }),
        lesson({
          id: 'cicd-secrets-oidc-key-vault',
          title: 'Secrets, OIDC, and Key Vault',
          explanation: 'Modern CI/CD avoids long-lived deployment secrets by using workload identity federation/OIDC and stores application secrets in Key Vault.',
          why: 'Deployment pipelines are high-value attack targets; leaking a service principal secret can compromise the data platform.',
          realWorldUsage: 'GitHub Actions requests a short-lived Azure token through OIDC, deploys resources, and references Key Vault secrets without storing credentials in the repo.',
          azureUsage: 'Use Azure AD federated credentials, managed identities, Key Vault references, RBAC, and secret scanning.',
          databricksUsage: 'Databricks jobs should consume secrets through approved secret scopes or Key Vault-backed patterns, not notebook literals.',
          syntax: `CI/CD identity:
  GitHub/Azure DevOps OIDC -> Azure AD federated credential
  Deployment permissions -> least privilege RBAC
  Runtime secrets -> Key Vault references`,
          example: 'A release pipeline deploys ADF linked services that reference Key Vault URIs; no connection-string value appears in Git.',
          expectedOutput: 'No stored cloud credentials in source control or pipeline variables.',
          interviewQuestion: 'How do you secure CI/CD credentials for Azure data platform deployments?',
          interviewAnswer: 'Use OIDC/workload identity federation for deployment identity, Key Vault for runtime secrets, least-privilege RBAC, secret scanning, approval gates, and audit logs.',
          practiceTask: 'Explain how GitHub Actions should authenticate to deploy ADF without a client secret.',
          commonMistakes: [
            'Storing service principal secrets as pipeline variables.',
            'Granting subscription owner access to deployment identities.',
            'Hardcoding Key Vault secret values in linked services.',
          ],
          performanceConsiderations: 'Security controls should not add manual steps that teams bypass; automate token exchange and parameter injection.',
        }),
      ],
    },
    {
      title: 'Platform Deployments',
      subtopics: [
        lesson({
          id: 'cicd-adf-deployment',
          title: 'ADF Pipeline Deployment',
          explanation: 'ADF CI/CD deploys JSON pipeline artifacts and ARM/Bicep parameters through controlled environment promotion.',
          why: 'ADF UI changes become production risk unless they are versioned, reviewed, parameterized, and deployed consistently.',
          realWorldUsage: 'A new Copy Activity is saved to a feature branch, reviewed as JSON, deployed to test with test linked-service parameters, then promoted to prod.',
          azureUsage: 'ADF Git integration, ARM templates, Bicep, Azure DevOps release pipelines, Key Vault references, and trigger control are central.',
          databricksUsage: 'ADF deployments often include Databricks notebook activity parameters and linked-service references.',
          syntax: `ADF release:
  stop triggers -> deploy factory artifacts -> override parameters
  -> validate linked services -> start triggers -> smoke run`,
          example: 'A release stops the daily trigger, deploys pipeline changes, validates the test connection, restarts the trigger, and runs one smoke load.',
          expectedOutput: 'ADF prod reflects reviewed JSON artifacts with prod-specific parameters and active triggers.',
          interviewQuestion: 'What are the risky parts of deploying ADF pipelines?',
          interviewAnswer: 'Triggers, linked-service parameters, secrets, environment-specific paths, integration runtimes, and missing smoke tests are the common risk areas. Stop/start triggers deliberately and validate connections after deploy.',
          practiceTask: 'List a release checklist for an ADF pipeline that reads from REST and writes ADLS Bronze.',
          commonMistakes: [
            'Deploying triggers accidentally enabled in the wrong environment.',
            'Committing real connection strings.',
            'Forgetting to validate integration runtime connectivity.',
          ],
          performanceConsiderations: 'Post-deploy smoke runs should be small but representative enough to catch path, credential, and schema problems.',
        }),
        lesson({
          id: 'cicd-databricks-deployment',
          title: 'Databricks Notebook and Job Deployment',
          explanation: 'Databricks CI/CD promotes notebooks, packages, workflow definitions, permissions, and job parameters as deployable artifacts.',
          why: 'Production Databricks should not depend on manual notebook edits, hidden widget defaults, or unpinned libraries.',
          realWorldUsage: 'A PySpark transformation is packaged, deployed to a test workspace, run against a test date, approved, then released to prod with prod job parameters.',
          azureUsage: 'Azure DevOps/GitHub Actions can deploy Databricks artifacts using CLI/API, environment variables, and Azure-managed identities where supported.',
          databricksUsage: 'Use Git-backed source, pinned dependencies, Workflow definitions, cluster policy references, secret scopes, and smoke jobs.',
          syntax: `Databricks release:
  package/test code -> deploy workspace/job definition
  -> run smoke job -> approve -> deploy prod -> monitor run`,
          example: 'A Silver customer notebook release includes the notebook, job JSON, cluster policy ID, library versions, and validation notebook.',
          expectedOutput: 'Prod workflow runs reviewed code and known dependencies with auditable deployment history.',
          interviewQuestion: 'How do you deploy Databricks notebooks and jobs safely?',
          interviewAnswer: 'Version source in Git, package reusable code, pin dependencies, deploy workflows through CI/CD, parameterize environments, use Key Vault/secrets, run smoke tests, require approval, and monitor the first prod run.',
          practiceTask: 'Design a Databricks deployment pipeline for a CDC MERGE notebook.',
          commonMistakes: [
            'Editing production notebooks directly.',
            'Using unpinned libraries that change between runs.',
            'Not deploying job definitions and permissions with code.',
          ],
          performanceConsiderations: 'Include runtime regression checks for heavy jobs; a correct deploy can still double DBU cost.',
        }),
        lesson({
          id: 'cicd-infrastructure-as-code',
          title: 'Infrastructure as Code for Data Platforms',
          explanation: 'Infrastructure as Code defines Azure data resources, permissions, networking, and diagnostics in repeatable templates.',
          why: 'Senior engineers use IaC to make environments reproducible and auditable instead of manually clicking resources into existence.',
          realWorldUsage: 'A Bicep/Terraform deployment creates ADLS containers, Key Vault, private endpoints, diagnostic settings, and ADF with environment-specific parameters.',
          azureUsage: 'Terraform, Bicep, ARM templates, Azure DevOps, GitHub Actions, policy assignments, and RBAC are the common Azure stack.',
          databricksUsage: 'Databricks workspaces, jobs, permissions, SQL warehouses, and cluster policies can be managed as code through provider/API tooling.',
          syntax: `IaC baseline:
  resource definitions
  parameter files per environment
  RBAC assignments
  private endpoints
  diagnostic settings
  tags and cost ownership`,
          example: 'Dev/test/prod storage accounts are created from one module with different names, network rules, and retention settings.',
          expectedOutput: 'A repeatable environment that can be reviewed, recreated, and audited.',
          interviewQuestion: 'What should be included in IaC for an Azure data platform?',
          interviewAnswer: 'Core resources, RBAC, networking, Key Vault, diagnostics, tags, policies, environment parameters, and deployment outputs needed by pipelines and jobs.',
          practiceTask: 'List the IaC resources for a secure ADLS + ADF + Databricks landing zone.',
          commonMistakes: [
            'Only deploying compute and forgetting diagnostics/RBAC.',
            'Hardcoding environment names and secrets.',
            'Letting manual portal changes drift from code.',
          ],
          performanceConsiderations: 'IaC should include cost tags and SKU/auto-shutdown defaults so performance and spend are governed from creation.',
        }),
      ],
    },
  ],
};
