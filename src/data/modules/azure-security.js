export const azureSecurityModule = {
  documentationMapping: [
    {
      concept: 'Managed Identity lifecycle and assignment',
      officialSource: 'Microsoft Entra Documentation — Managed Identities for Azure Resources',
      sourceUrl: 'https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview',
      howThisLessonUsesIt: 'System-assigned vs user-assigned identity trade-offs, the token acquisition flow via IMDS endpoint, and the lifecycle tie to the parent resource are explained using the official Managed Identity overview.',
    },
    {
      concept: 'Key Vault secrets and ADF linked service integration',
      officialSource: 'Microsoft Azure Documentation — Azure Key Vault Overview',
      sourceUrl: 'https://learn.microsoft.com/en-us/azure/key-vault/general/overview',
      howThisLessonUsesIt: 'Key Vault secret versioning, the Key Vault-backed ADF linked service pattern, Databricks secret scopes, and the RBAC vs Access Policies authorization models are taught using the official Key Vault documentation.',
    },
    {
      concept: 'Azure RBAC least-privilege access control',
      officialSource: 'Microsoft Azure Documentation — Azure Role-Based Access Control',
      sourceUrl: 'https://learn.microsoft.com/en-us/azure/role-based-access-control/overview',
      howThisLessonUsesIt: 'The control plane vs data plane distinction, scope hierarchy (management group → subscription → resource group → resource), built-in roles (Storage Blob Data Reader/Contributor), and deny assignments follow the official Azure RBAC documentation.',
    },
    {
      concept: 'Private Endpoints and private DNS zones',
      officialSource: 'Microsoft Azure Documentation — Private Endpoint Overview',
      sourceUrl: 'https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview',
      howThisLessonUsesIt: 'Network interface injection into the VNet, private DNS zone requirements for name resolution override, and the public access disable pattern for storage accounts are explained using the official Private Link documentation.',
    },
    {
      concept: 'Workload Identity Federation for OIDC-based CI/CD',
      officialSource: 'Microsoft Entra Documentation — Workload Identity Federation',
      sourceUrl: 'https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation',
      howThisLessonUsesIt: 'The federated credential configuration on an app registration, the GitHub Actions subject claim format, and the keyless authentication flow replacing service principal secrets are taught using the official Workload Identity Federation documentation.',
    },
  ],
  sections: [
    {
      title: 'Azure Managed Identity',
      subtopics: [
        {
          id: 'managed-identity-fundamentals',
          title: 'Managed Identity — System-Assigned vs User-Assigned',
          difficulty: 'Intermediate',
          explanation: `A Managed Identity is an Azure Active Directory identity automatically managed by Azure — no passwords, no rotation, no secrets stored anywhere. Two types:
- System-assigned: tied to one resource's lifecycle. When the resource is deleted, the identity is deleted. One-to-one: one resource, one identity.
- User-assigned: a standalone Azure resource. Assigned to multiple compute resources. When a VM or ADF is deleted, the identity persists. One-to-many: one identity, many resources.`,
          why: 'Before Managed Identity, every ADF pipeline, Databricks job, and Synapse notebook used a Service Principal with a client secret stored in Key Vault or environment variables. Service principals expire, rotate manually, and create credentials that can be leaked. Managed Identity eliminates all of that — the identity is Azure-managed, automatically rotates behind the scenes, and cannot be exported as a credential.',
          syntax: `# Check if Managed Identity is enabled on an ADF instance (Azure CLI):
az datafactory show --name myADF --resource-group myRG \
  --query identity

# Assign the ADF Managed Identity as Storage Blob Data Contributor:
az role assignment create \
  --assignee <managed-identity-principal-id> \
  --role "Storage Blob Data Contributor" \
  --scope "/subscriptions/<sub-id>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<storage-account>"

# Create a User-Assigned Managed Identity:
az identity create --name myPipelineIdentity --resource-group myRG

# Assign User-Assigned MI to a Databricks cluster (via ARM or Terraform):
resource "azurerm_databricks_workspace" "example" {
  ...
  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.example.id]
  }
}`,
          example: `# ADF Linked Service using Managed Identity (JSON definition):
{
  "name": "AzureBlobStorageLinkedService",
  "properties": {
    "type": "AzureBlobStorage",
    "typeProperties": {
      "serviceEndpoint": "https://mystorageaccount.blob.core.windows.net/",
      "accountKind": "StorageV2"
    },
    "connectVia": {
      "referenceName": "AutoResolveIntegrationRuntime",
      "type": "IntegrationRuntimeReference"
    }
  }
}
# NOTE: No accountKey, no SAS token, no connection string.
# ADF authenticates using its system-assigned Managed Identity.
# Required RBAC: "Storage Blob Data Contributor" on the storage account.

# Databricks accessing ADLS with Managed Identity via Unity Catalog:
# No access key needed — cluster identity has Storage Blob Data Reader via RBAC
df = spark.read.format("delta").load(
    "abfss://silver@mystorageaccount.dfs.core.windows.net/orders/"
)`,
          expectedOutput: `# az role assignment create output:
{
  "id": "/subscriptions/.../roleAssignments/...",
  "principalId": "8f4a21bc-...",
  "principalType": "ServicePrincipal",
  "roleDefinitionId": ".../roleDefinitions/ba92f5b4-...",
  "scope": "/subscriptions/.../storageAccounts/mystorageaccount"
}

# ADF pipeline test connection: SUCCESS
# Authentication type: Managed Identity
# No credentials required`,
          interview: {
            question: 'When would you use a system-assigned Managed Identity vs a user-assigned one in an Azure data platform?',
            answer: 'System-assigned: use when one resource needs to access other resources and the identity lifecycle should match the resource — e.g., a single ADF instance authenticating to its own storage account. If you delete ADF, the identity goes with it. User-assigned: use when multiple resources need the same permissions — e.g., 10 Databricks clusters, 2 ADF instances, and 3 Function Apps all accessing the same Key Vault. Create one User-Assigned MI, grant it access once, assign it to all 10 resources. Changing RBAC requires updating one identity not 15 separate ones.',
          },
          practice: 'You have a Databricks workspace and an ADLS Gen2 storage account in the same subscription. Describe the exact steps to let Databricks notebooks read from ADLS using Managed Identity — no storage keys, no SAS tokens.',
          hint: 'Enable Managed Identity on Databricks → get the principal ID → assign Storage Blob Data Reader on the storage account → access via abfss:// URI.',
          solution: `# Step 1: Enable system-assigned MI on Databricks workspace (if not enabled)
az databricks workspace update --name myWorkspace \
  --resource-group myRG --enable-managed-resource-group true

# Step 2: Get the Managed Identity principal ID
MI_ID=$(az databricks workspace show --name myWorkspace \
  --resource-group myRG --query identity.principalId -o tsv)

# Step 3: Assign Storage Blob Data Reader on ADLS Gen2
az role assignment create \
  --assignee $MI_ID \
  --role "Storage Blob Data Reader" \
  --scope "/subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/myadls"

# Step 4: In Databricks notebook — access with abfss://
df = spark.read.format("delta").load(
    "abfss://silver@myadls.dfs.core.windows.net/orders/"
)
# No accountKey, no SAS, no token — MI handles auth transparently`,
          commonMistakes: [
            'Granting Owner or Contributor instead of the specific data-plane role — "Storage Blob Data Contributor" not "Contributor". Control plane (Contributor) lets you manage the storage account resource. Data plane (Storage Blob Data Contributor) lets you read/write blob data. They are different permission scopes.',
            'Using system-assigned MI for shared infrastructure — if 10 pipelines need the same Key Vault access, system-assigned means 10 separate RBAC assignments. User-assigned means one.',
            'Forgetting RBAC propagation delay — new role assignments take 1–5 minutes to propagate globally. A pipeline that runs immediately after creating a role assignment will fail with 403.',
          ],
          productionContext: 'In enterprise Azure data platforms, every compute resource (ADF, Databricks, Synapse, Functions) authenticates exclusively via Managed Identity — zero service principal passwords in production. Service principals are reserved for workloads that cannot use Managed Identity (on-premise agents, GitHub Actions, third-party SaaS tools). This is the posture required by most Azure security benchmarks (CIS, NIST).',
          seniorNote: 'The shift from service principals to Managed Identity is a one-way door. Once a platform is built on MI, you never go back — there are no credentials to rotate, no expiry incidents, no credential leaks in logs. The senior move: build a Terraform module that provisions a User-Assigned MI, assigns all required RBAC roles, and attaches it to compute resources as a reusable pattern. Every new pipeline inherits correct permissions without an IAM ticket.',
        },
        {
          id: 'managed-identity-vs-service-principal',
          title: 'Managed Identity vs Service Principal',
          difficulty: 'Intermediate',
          explanation: `A Service Principal (SP) is an AAD application identity with a client ID + secret (or certificate). You create it, you manage the secret, you rotate it. A Managed Identity is also an AAD application identity, but Azure creates and manages the credential — you never see the private key and it rotates automatically.

Use Service Principal when: the workload runs outside Azure (GitHub Actions, on-premise Airflow, third-party tools). Use Managed Identity when: the workload runs on Azure compute (ADF, Databricks, Functions, VMs).`,
          why: 'Service principal secrets expire (typically 1–2 years) and must be rotated manually. Expired SPs are one of the most common causes of production pipeline outages. Managed Identities do not have this problem — Azure handles credential rotation internally. Every Azure DE team has a post-mortem from an expired service principal that silently failed a pipeline at 2 AM on a Sunday.',
          syntax: `# Service Principal — create and assign role (old pattern):
az ad sp create-for-rbac --name "my-adf-sp" \
  --role "Storage Blob Data Contributor" \
  --scopes /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/<storage>
# Returns: { "appId", "password", "tenant" }
# Problems: password expires, must store in Key Vault, must rotate, can leak in logs

# Managed Identity — no credential creation needed (modern pattern):
# Enable MI on ADF → get principal ID → assign role
az role assignment create \
  --assignee <adf-mi-principal-id> \
  --role "Storage Blob Data Contributor" \
  --scope /subscriptions/<sub>/resourceGroups/<rg>/...

# GitHub Actions — must still use Service Principal (not Azure compute):
- name: Azure Login
  uses: azure/login@v2
  with:
    client-id: \${{ secrets.AZURE_CLIENT_ID }}
    tenant-id: \${{ secrets.AZURE_TENANT_ID }}
    subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}`,
          example: `# Decision matrix:
# Workload          | Runs on Azure? | Use
# ADF pipeline      | Yes            | Managed Identity (system-assigned)
# Databricks job    | Yes            | Managed Identity (user-assigned if shared)
# GitHub Actions    | No             | Service Principal + OIDC (no secret)
# Azure Function    | Yes            | Managed Identity
# On-prem Airflow   | No             | Service Principal + Key Vault
# Terraform Cloud   | No             | Service Principal + short-lived OIDC

# Best practice for GitHub Actions — OIDC (no secret, federated credential):
# 1. Create SP with federated credential (OIDC) instead of password
az ad app create --display-name "github-actions-deployer"
az ad app federated-credential create \
  --id <app-id> \
  --parameters '{"name":"github-oidc","issuer":"https://token.actions.githubusercontent.com","subject":"repo:myorg/myrepo:ref:refs/heads/main","audiences":["api://AzureADTokenExchange"]}'
# 2. GitHub Actions uses OIDC — no stored secret, short-lived token per run`,
          expectedOutput: `# Service Principal credentials (AVOID storing these):
{
  "appId": "a1b2c3d4-...",     # store in Key Vault
  "displayName": "my-adf-sp",
  "password": "xKq8~...",     # DANGEROUS: expires 2025-12-01, can leak
  "tenant": "f5e4d3c2-..."
}

# Managed Identity assignment confirmation:
Role "Storage Blob Data Contributor" assigned to principal 8f4a21bc
No credentials created. No expiry. No rotation required.`,
          interview: {
            question: 'What is the risk of using a service principal with a client secret for ADF-to-ADLS authentication and how do you eliminate it?',
            answer: 'Three risks: (1) Secret expiry — client secrets have a max 2-year lifetime. When the secret expires, every pipeline using it fails simultaneously at an unpredictable date. (2) Secret leakage — secrets stored in Key Vault or environment variables can appear in pipeline logs, GitHub history, or config files if developers are careless. (3) Rotation complexity — rotating a secret requires updating every system that uses it simultaneously, which is operationally fragile. Eliminate it: use Managed Identity for ADF. Enable system-assigned MI, grant it Storage Blob Data Contributor, remove the Linked Service connection string. Zero credentials, zero expiry, zero rotation.',
          },
          practice: 'Your team has 5 ADF pipelines all using the same service principal to write to ADLS. The secret is expiring in 30 days. Design the migration to Managed Identity — include all steps, potential issues, and rollback plan.',
          hint: 'Steps: enable MI on each ADF → assign RBAC → update Linked Services to use MI → test → remove SP RBAC. Rollback: keep SP RBAC until all pipelines confirmed working.',
          solution: `# Migration plan: SP → Managed Identity for ADF → ADLS

# 1. Enable MI on each ADF instance (if not already enabled):
az datafactory update --name myADF --resource-group myRG \
  --identity '{"type":"SystemAssigned"}'

# 2. Get MI principal IDs for all 5 ADF instances:
for adf in adf1 adf2 adf3 adf4 adf5; do
  echo "$adf: $(az datafactory show -n $adf -g myRG --query identity.principalId -o tsv)"
done

# 3. Assign Storage Blob Data Contributor to each MI on ADLS:
for MI_ID in <mi-ids>; do
  az role assignment create --assignee $MI_ID \
    --role "Storage Blob Data Contributor" \
    --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/myadls
done

# 4. Update ADF Linked Services: change auth from Service Principal → Managed Identity
# In ADF UI: Linked Service → Edit → Auth type → System Assigned Managed Identity
# Or in ARM template: remove servicePrincipalId/servicePrincipalKey, add MSI auth

# 5. Test each pipeline in dev/staging before prod

# 6. Rollback plan: SP RBAC assignment stays until smoke tests pass.
# Keep SP in Key Vault for 30 days post-migration as rollback option.
# After 30 days confirmed clean: remove SP RBAC, delete SP.`,
          commonMistakes: [
            'Deleting the service principal before confirming all pipelines migrated — a hard-to-reverse outage.',
            'Granting Managed Identity access at the subscription level instead of storage account level — violates least privilege.',
          ],
          productionContext: 'Enterprise Azure security policies (often enforced via Azure Policy) now require Managed Identity for all compute-to-storage authentication. Auditors specifically check for service principals with secrets on production compute resources. During a security review, any ADF Linked Service using a connection string or SP secret will be flagged as a finding.',
          seniorNote: 'For GitHub Actions workflows deploying to Azure, use OIDC federation (Workload Identity Federation) instead of service principal secrets. The setup is more complex once but eliminates the secret entirely — GitHub gets a short-lived OIDC token per run. This pattern is now Microsoft\'s recommended approach for all external CI/CD → Azure authentication.',
        },
      ],
    },
    {
      title: 'Azure Key Vault',
      subtopics: [
        {
          id: 'key-vault-fundamentals',
          title: 'Key Vault — Secrets, References, and ADF Integration',
          difficulty: 'Intermediate',
          explanation: `Azure Key Vault stores three types of objects:
- Secrets: connection strings, API keys, passwords, SAS tokens
- Keys: cryptographic keys for encryption operations (HSM-backed)
- Certificates: X.509 certificates with automatic renewal

In data engineering, you primarily use Secrets to store third-party API keys, database passwords, and SFTP credentials — anything that cannot use Managed Identity.`,
          why: 'Secrets hardcoded in ADF pipelines, Databricks notebooks, or config files create immediate security and operational risk. Key Vault centralises secret storage, enables rotation without code changes, provides audit logs of every secret access, and supports soft delete + purge protection to prevent accidental deletion. The pattern is: code references Key Vault — code never sees the raw value.',
          syntax: `# Create a Key Vault secret:
az keyvault secret set \
  --vault-name myKeyVault \
  --name "salesforce-api-key" \
  --value "abc123xyz"

# Grant ADF Managed Identity access to Key Vault secrets:
az keyvault set-policy \
  --name myKeyVault \
  --object-id <adf-mi-principal-id> \
  --secret-permissions get list

# Modern approach — use RBAC instead of access policies:
az role assignment create \
  --assignee <adf-mi-principal-id> \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/myKeyVault

# Reference a Key Vault secret in ADF Linked Service (ARM JSON):
{
  "typeProperties": {
    "connectionString": {
      "type": "AzureKeyVaultSecret",
      "store": {
        "referenceName": "AzureKeyVaultLinkedService",
        "type": "LinkedServiceReference"
      },
      "secretName": "sql-connection-string"
    }
  }
}`,
          example: `# ADF Linked Service backed by Key Vault — complete pattern:

# 1. Store secret in Key Vault:
az keyvault secret set --vault-name prodKV \
  --name "postgres-conn-str" \
  --value "Server=prod-db.postgres.database.azure.com;Database=orders;User Id=svc_account;Password=<pass>;"

# 2. Create ADF Key Vault Linked Service (uses ADF's Managed Identity):
{
  "name": "AzureKeyVault_LS",
  "properties": {
    "type": "AzureKeyVault",
    "typeProperties": {
      "baseUrl": "https://prodKV.vault.azure.net/"
    }
  }
}

# 3. Create Postgres Linked Service — connection string from KV:
{
  "name": "Postgres_LS",
  "properties": {
    "type": "AzurePostgreSql",
    "typeProperties": {
      "connectionString": {
        "type": "AzureKeyVaultSecret",
        "store": { "referenceName": "AzureKeyVault_LS", "type": "LinkedServiceReference" },
        "secretName": "postgres-conn-str"
      }
    }
  }
}`,
          expectedOutput: `# Secret stored:
{
  "id": "https://prodKV.vault.azure.net/secrets/postgres-conn-str/abc123",
  "name": "postgres-conn-str",
  "enabled": true,
  "contentType": null
}

# ADF test connection: SUCCESS
# Authentication: Key Vault-backed (Managed Identity → KV → Secret)
# Secret value never exposed in ADF UI, logs, or ARM templates`,
          interview: {
            question: 'How does ADF retrieve a secret from Key Vault at pipeline runtime?',
            answer: 'ADF uses its system-assigned Managed Identity to authenticate to Key Vault. At pipeline runtime, when ADF needs the Linked Service connection string, it calls the Key Vault REST API (GET /secrets/my-secret) using its MI token. Key Vault validates the MI has "get" permission on the secret and returns the value. The value is used in memory for the connection — it never appears in the ADF activity output, pipeline logs, or JSON definitions. This is called a Key Vault-backed Linked Service.',
          },
          practice: 'You have an ADF pipeline that reads from Snowflake. Currently the Snowflake password is stored as a plaintext parameter in the ADF pipeline. Redesign this to use Key Vault. List every resource, permission, and configuration change required.',
          hint: 'Store password in KV → create KV Linked Service in ADF → update Snowflake Linked Service to reference KV → grant ADF MI "Key Vault Secrets User" on KV.',
          solution: `# Resources needed:
# - Azure Key Vault (existing or new)
# - ADF system-assigned Managed Identity (enable if not active)
# - Role assignment: ADF MI → "Key Vault Secrets User" → KV

# Step 1: Store the Snowflake password in Key Vault
az keyvault secret set --vault-name prodKV \
  --name "snowflake-password" \
  --value "<actual-password>"

# Step 2: Grant ADF Managed Identity access
ADF_MI=$(az datafactory show -n myADF -g myRG --query identity.principalId -o tsv)
az role assignment create \
  --assignee $ADF_MI \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/<sub>/.../vaults/prodKV

# Step 3: In ADF — create Key Vault Linked Service
# Type: Azure Key Vault
# Base URL: https://prodKV.vault.azure.net/
# Auth: Managed Identity

# Step 4: Update Snowflake Linked Service
# Change "Password" field from plaintext → AzureKeyVaultSecret
# SecretName: snowflake-password
# Store: AzureKeyVault_LS (reference)

# Step 5: Remove the ADF pipeline parameter storing the old password
# Delete the plaintext parameter — it no longer exists in the pipeline JSON`,
          commonMistakes: [
            'Using Key Vault Access Policies instead of RBAC — access policies are vault-wide, hard to audit, and do not appear in Azure Policy compliance reports. Key Vault RBAC (Key Vault Secrets User role) is the modern approach.',
            'Setting secrets without expiration dates — production secrets should have an expiry set and a Key Vault alert configured to notify 30 days before expiry.',
            'Storing entire connection strings in one secret — if only the password changes, you have to update the whole connection string. Store just the password and compose the connection string in code.',
          ],
          productionContext: 'Enterprise Key Vault configuration must have: soft-delete enabled (protects against accidental deletion, 7–90 day recovery window), purge protection enabled (prevents permanent deletion during soft-delete period), private endpoint (vault accessible only from VNet), diagnostic logs sent to Log Analytics (audit trail of every GET/SET/DELETE). Without purge protection, a malicious actor with Key Vault Contributor access can permanently delete all secrets.',
          seniorNote: 'Secret versioning in Key Vault is powerful but misunderstood. Each PUT to the same secret name creates a new version — the old version stays and can still be referenced. During secret rotation: set the new secret version, wait for new version to propagate, then disable (not delete) the old version. ADF Linked Services and Databricks scopes referencing the secret name (not version) will automatically pick up the new version. Reference the secret name without a version in all references to get automatic rotation benefit.',
        },
        {
          id: 'databricks-secret-scopes',
          title: 'Databricks Secret Scopes and Key Vault-backed Scopes',
          difficulty: 'Intermediate',
          explanation: `Databricks has its own secret management: Secret Scopes. Two types:
- Databricks-backed: secrets stored inside Databricks. Simple but siloed — different from Azure Key Vault.
- Azure Key Vault-backed: Databricks reads secrets from Key Vault using the workspace's Managed Identity. The same secrets accessible in ADF and Functions are accessible in Databricks notebooks — one source of truth.`,
          why: 'Without secret scopes, Databricks developers hardcode ADLS keys or Snowflake passwords in notebook cells. These secrets appear in notebook revisions, audit logs, and can be exported with the notebook export. Secret scopes make credentials invisible in code — dbutils.secrets.get("scope", "key") returns the value without displaying it in output or revision history.',
          syntax: `# Create an Azure Key Vault-backed secret scope:
# Via Databricks CLI:
databricks secrets create-scope \
  --scope my-kv-scope \
  --scope-backend-type AZURE_KEYVAULT \
  --resource-id /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.KeyVault/vaults/myKV \
  --dns-name https://myKV.vault.azure.net/

# Create a Databricks-backed scope:
databricks secrets create-scope --scope my-db-scope

# Add a secret to a Databricks-backed scope:
databricks secrets put-secret --scope my-db-scope --key sftp-password

# Grant scope access to a group:
databricks secrets put-acl --scope my-db-scope --principal data-engineers --permission READ

# In a notebook — use secrets (value never displayed in output):
password = dbutils.secrets.get(scope="my-kv-scope", key="snowflake-password")
# Output: [REDACTED] — Databricks automatically redacts secret values from output`,
          example: `# Production pattern: KV-backed scope for ADLS access credentials
# (for cases where Unity Catalog MI access is not available)

# 1. Create KV-backed scope in Databricks:
databricks secrets create-scope \
  --scope adls-secrets \
  --scope-backend-type AZURE_KEYVAULT \
  --resource-id /subscriptions/<sub>/.../vaults/prodKV \
  --dns-name https://prodKV.vault.azure.net/

# 2. In Key Vault, set the storage account key:
az keyvault secret set --vault-name prodKV \
  --name "adls-storage-key" \
  --value "<storage-account-key>"

# 3. In Databricks notebook — configure ADLS mount:
storage_key = dbutils.secrets.get(scope="adls-secrets", key="adls-storage-key")
spark.conf.set(
    "fs.azure.account.key.myadls.dfs.core.windows.net",
    storage_key
)
# Read data — key never visible in notebook output or revision history:
df = spark.read.parquet("abfss://bronze@myadls.dfs.core.windows.net/raw/")`,
          expectedOutput: `# Notebook cell output when reading a secret:
[REDACTED]   # Databricks automatically redacts secret values

# dbutils.secrets.list("adls-secrets") output:
[SecretMetadata(key='adls-storage-key'),
 SecretMetadata(key='snowflake-password')]
# Note: list shows key NAMES only, never values`,
          interview: {
            question: 'What is the difference between a Databricks-backed and Azure Key Vault-backed secret scope?',
            answer: 'Databricks-backed: secrets stored in Databricks internal storage. Simple to set up, no external dependencies. But isolated — different secrets from Key Vault, no sharing with ADF or Functions, no audit trail in Azure. Key Vault-backed: Databricks reads secrets from Azure Key Vault using the workspace Managed Identity. Same secrets available in all Azure services. Azure Monitor logs every secret access — audit trail in Log Analytics. Rotation in Key Vault automatically available in Databricks. The tradeoff: KV-backed requires more setup and a Key Vault dependency, but is the enterprise standard because of unified governance.',
          },
          practice: 'Your Databricks notebook currently reads a Snowflake password from a notebook widget (Python input box). Migrate this to a Key Vault-backed secret scope. Write the complete setup commands and the notebook code.',
          hint: 'Create KV-backed scope → store password in KV → dbutils.secrets.get in notebook → remove the widget.',
          solution: `# Step 1: Ensure Databricks workspace MI has Key Vault Secrets User on prodKV
DB_MI=$(az databricks workspace show -n myWorkspace -g myRG \
  --query identity.principalId -o tsv)
az role assignment create --assignee $DB_MI \
  --role "Key Vault Secrets User" \
  --scope /subscriptions/<sub>/.../vaults/prodKV

# Step 2: Store Snowflake password in Key Vault
az keyvault secret set --vault-name prodKV \
  --name "snowflake-password" \
  --value "<actual-password>"

# Step 3: Create KV-backed secret scope in Databricks
databricks secrets create-scope \
  --scope prod-secrets \
  --scope-backend-type AZURE_KEYVAULT \
  --resource-id /subscriptions/<sub>/.../vaults/prodKV \
  --dns-name https://prodKV.vault.azure.net/

# Step 4: Update notebook — remove widget, use secret scope
# OLD: password = dbutils.widgets.get("snowflake_password")  # REMOVE THIS
# NEW:
password = dbutils.secrets.get(scope="prod-secrets", key="snowflake-password")
options = {
    "sfUrl": "myaccount.snowflakecomputing.com",
    "sfUser": "svc_databricks",
    "sfPassword": password,  # value is [REDACTED] in all outputs
    "sfDatabase": "ANALYTICS",
    "sfWarehouse": "TRANSFORM_WH",
}
df = spark.read.format("snowflake").options(**options).option("dbtable", "orders").load()`,
          commonMistakes: [
            'Using notebook widgets or ipywidgets for passwords — values visible in the widget, notebook export, and revision history.',
            'Granting "READ" scope ACL to "ALL_USERS" instead of a specific group — means all workspace users can read production secrets.',
            'Creating Databricks-backed scopes for credentials that also need to be accessed by ADF — creates two separate copies of the same secret to maintain.',
          ],
          productionContext: 'In mature Azure data platforms, Databricks secret scopes are exclusively Key Vault-backed. Databricks-backed scopes are reserved for non-production environments where Key Vault setup adds friction. The Key Vault audit logs become the authoritative record of which service accessed which secret — critical for SOC 2 and ISO 27001 compliance.',
          seniorNote: 'Unity Catalog eliminates the need for secret scopes for storage access in most cases. When Unity Catalog external locations are properly configured (storage credential + external location), Databricks accesses ADLS via the service credential MI — no storage keys, no secret scopes needed for data reads. Secret scopes remain necessary for third-party credentials: Snowflake passwords, Salesforce tokens, SFTP keys — things that cannot use MI.',
        },
      ],
    },
    {
      title: 'RBAC and Access Control',
      subtopics: [
        {
          id: 'azure-rbac-least-privilege',
          title: 'Azure RBAC and Least Privilege',
          difficulty: 'Intermediate',
          explanation: `Azure RBAC assigns roles to principals (users, groups, service principals, managed identities) at a scope (subscription, resource group, individual resource). Every action in Azure requires both a role at the control plane (manage Azure resources) and data-plane permissions (read/write actual data).

Key data engineering roles:
- Storage Blob Data Reader: read blob data (control plane: none)
- Storage Blob Data Contributor: read + write blobs
- Storage Blob Data Owner: full access including ACLs (ADLS Gen2)
- Key Vault Secrets User: read secrets (get, list)
- Key Vault Secrets Officer: create, update, delete secrets
- Databricks Workspace Contributor: create clusters, notebooks
- Contributor (subscription/RG): manage all Azure resources — almost never appropriate for data pipeline identities`,
          why: 'Over-permissioned identities are the most common Azure security finding. An ADF pipeline that reads data does not need Storage Blob Data Contributor — it needs Storage Blob Data Reader. An ADF pipeline that writes to Bronze does not need access to Production Key Vault secrets. Each identity should have the minimum permissions required to do its specific job, at the most specific scope possible.',
          syntax: `# List all role assignments for a storage account:
az role assignment list \
  --scope /subscriptions/<sub>/resourceGroups/<rg>/providers/Microsoft.Storage/storageAccounts/myadls \
  --output table

# Assign least-privilege role (reader for pipelines that only read):
az role assignment create \
  --assignee <pipeline-mi-id> \
  --role "Storage Blob Data Reader" \
  --scope ".../storageAccounts/myadls/blobServices/default/containers/bronze"

# Remove over-permissioned assignment:
az role assignment delete \
  --assignee <mi-id> \
  --role "Contributor" \
  --scope "/subscriptions/<sub>/resourceGroups/prod-data-rg"

# Scope levels (most to least specific = least to most permissive):
# Container:        .../storageAccounts/myadls/blobServices/default/containers/bronze
# Storage account:  .../storageAccounts/myadls
# Resource group:   /subscriptions/<sub>/resourceGroups/prod-data-rg
# Subscription:     /subscriptions/<sub>`,
          example: `# Production RBAC design for a medallion architecture pipeline:

# ADF Copy Activity (Bronze write) — writes to Bronze only:
az role assignment create --assignee $ADF_MI \
  --role "Storage Blob Data Contributor" \
  --scope ".../containers/bronze"

# Databricks Bronze → Silver notebook — reads Bronze, writes Silver:
az role assignment create --assignee $DATABRICKS_MI \
  --role "Storage Blob Data Reader" \
  --scope ".../containers/bronze"
az role assignment create --assignee $DATABRICKS_MI \
  --role "Storage Blob Data Contributor" \
  --scope ".../containers/silver"

# Power BI Semantic Model — reads Gold only:
az role assignment create --assignee $POWERBI_SP \
  --role "Storage Blob Data Reader" \
  --scope ".../containers/gold"

# Result: Each component can only access what it needs.
# Bronze notebooks cannot accidentally write to Gold.
# Gold readers cannot see raw Bronze data.`,
          expectedOutput: `# az role assignment list --scope .../containers/bronze --output table:
Principal                          Role                        Scope
---------------------------------  --------------------------  ------
ADF-Prod-MI (ServicePrincipal)    Storage Blob Data Contrib.  Container: bronze
Databricks-Prod-MI (SP)           Storage Blob Data Reader    Container: bronze

# az role assignment list --scope .../containers/gold --output table:
PowerBI-SP (ServicePrincipal)     Storage Blob Data Reader    Container: gold
Databricks-Prod-MI (SP)           Storage Blob Data Contrib.  Container: gold`,
          interview: {
            question: 'What is the difference between control plane and data plane permissions in Azure storage?',
            answer: 'Control plane permissions (Contributor, Owner) allow managing the storage account resource itself — changing settings, creating containers, viewing access keys. Data plane permissions (Storage Blob Data Reader/Contributor) allow reading and writing actual blob data. A pipeline that needs to read blobs should have Storage Blob Data Reader — not Contributor. Granting Contributor to a pipeline is a critical security misconfiguration because Contributor also allows listing and exporting storage account keys, giving the pipeline owner-level access to all data.',
          },
          practice: 'You are designing RBAC for a team of 5 data engineers working on the same Databricks workspace and ADLS account. The Bronze container holds raw data (PII). Silver is cleaned. Gold is aggregated public metrics. Design the RBAC assignments so: junior engineers can only read Silver and write to their own scratch area; senior engineers can write to Silver and Gold; ADF pipeline can only write to Bronze; Power BI only reads Gold.',
          hint: 'Use AAD groups for human access (Data-Engineers-Junior, Data-Engineers-Senior). Use MIs for service access. Scope assignments to specific containers not the whole storage account.',
          solution: `# Human access — via AAD groups (not individual user assignments):
# Group: Data-Engineers-Junior
az role assignment create --assignee <juniors-group-id> \
  --role "Storage Blob Data Reader" --scope ".../containers/silver"
az role assignment create --assignee <juniors-group-id> \
  --role "Storage Blob Data Contributor" --scope ".../containers/scratch"

# Group: Data-Engineers-Senior
az role assignment create --assignee <seniors-group-id> \
  --role "Storage Blob Data Reader" --scope ".../containers/bronze"
az role assignment create --assignee <seniors-group-id> \
  --role "Storage Blob Data Contributor" --scope ".../containers/silver"
az role assignment create --assignee <seniors-group-id> \
  --role "Storage Blob Data Contributor" --scope ".../containers/gold"

# Service accounts — Managed Identities:
# ADF Pipeline MI: write Bronze only
az role assignment create --assignee $ADF_MI \
  --role "Storage Blob Data Contributor" --scope ".../containers/bronze"

# Databricks MI: read Bronze + Silver, write Silver + Gold
az role assignment create --assignee $DB_MI \
  --role "Storage Blob Data Reader" --scope ".../containers/bronze"
az role assignment create --assignee $DB_MI \
  --role "Storage Blob Data Contributor" --scope ".../containers/silver"
az role assignment create --assignee $DB_MI \
  --role "Storage Blob Data Contributor" --scope ".../containers/gold"

# Power BI SP: read Gold only
az role assignment create --assignee $PBI_SP \
  --role "Storage Blob Data Reader" --scope ".../containers/gold"`,
          commonMistakes: [
            'Assigning roles to individual users instead of AAD groups — when team members change, you have to update dozens of individual role assignments instead of one group membership.',
            'Over-scoping to subscription or resource group — a pipeline MI should have storage role at the specific container, not at the subscription.',
            'Using "Contributor" for any pipeline identity — Contributor grants storage account key access, bypassing all RBAC and enabling full data exfiltration.',
          ],
          productionContext: 'Azure Policy enforces RBAC compliance automatically. Common enterprise policies: deny assignment of Owner at subscription for non-admin principals, require role assignments through PIM (Privileged Identity Management) for sensitive roles, audit any assignment of Contributor or above to service principals. In regulated industries (banking, healthcare), all RBAC changes are logged and require a change ticket that maps the business justification.',
          seniorNote: 'The maturity progression for RBAC: Level 1 (starter): Contributor on everything — fast to set up, security nightmare. Level 2 (intermediate): data-plane roles at storage account level. Level 3 (mature): data-plane roles at container level via AAD groups. Level 4 (enterprise): Unity Catalog / Purview data access policies that grant access at the table and column level, with PIM for time-bound elevated access. For Azure DE interviews, articulate level 3 as baseline and level 4 as the target state.',
        },
        {
          id: 'unity-catalog-rbac',
          title: 'Unity Catalog and Fabric RBAC',
          difficulty: 'Advanced',
          explanation: `Unity Catalog (Databricks) adds a metastore-level governance layer above storage RBAC. Permissions are on catalog objects (catalogs, schemas, tables, columns) not on storage containers. Fabric RBAC uses workspace roles (Admin, Member, Contributor, Viewer) for item-level access plus OneLake Data Access Roles for row/column-level data access.

Unity Catalog permission hierarchy:
USE CATALOG → USE SCHEMA → SELECT (read) / MODIFY (write) / ALL PRIVILEGES`,
          why: 'Storage-level RBAC (Storage Blob Data Reader) is binary — access or no access at the container level. For analytics platforms, you need table-level and column-level access control: analysts can query the orders table but not the payments table; no user sees the credit_card_number column without PII access. Unity Catalog and Fabric Data Access Roles provide this — without them, you expose all data to everyone with storage access.',
          syntax: `-- Unity Catalog: grant table-level access
-- Grant analyst group SELECT on Gold tables only:
GRANT USE CATALOG ON CATALOG analytics TO GROUP analytics_team;
GRANT USE SCHEMA ON SCHEMA analytics.gold TO GROUP analytics_team;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics.gold TO GROUP analytics_team;

-- Restrict a specific column (column masking):
CREATE OR REPLACE FUNCTION mask_credit_card(cc_number STRING)
RETURNS STRING
RETURN CASE
    WHEN IS_MEMBER('pci_data_team') THEN cc_number
    ELSE CONCAT('****-****-****-', RIGHT(cc_number, 4))
END;

ALTER TABLE analytics.gold.payments
  ALTER COLUMN credit_card_number
  SET MASK mask_credit_card;

-- Row-level security (only see own region's data):
CREATE OR REPLACE ROW FILTER show_own_region
ON TABLE analytics.gold.sales
AS (region = current_user_region());

-- Fabric OneLake Data Access Role (workspace level):
-- New Role → "Analytics Read" → assign tables → assign members`,
          example: `-- Tiered access model with Unity Catalog:

-- Tier 1: All data engineers — can read everything in Silver
GRANT USE CATALOG ON CATALOG main TO GROUP data_engineers;
GRANT USE SCHEMA ON SCHEMA main.silver TO GROUP data_engineers;
GRANT SELECT ON ALL TABLES IN SCHEMA main.silver TO GROUP data_engineers;

-- Tier 2: Analytics team — Gold tables only, no PII columns
GRANT USE SCHEMA ON SCHEMA main.gold TO GROUP analytics;
GRANT SELECT ON ALL TABLES IN SCHEMA main.gold TO GROUP analytics;
-- Column masking hides SSN from non-PII group automatically

-- Tier 3: PII data team — all columns on sensitive tables
GRANT SELECT ON main.silver.customers_pii TO GROUP pii_access_team;

-- Service accounts for pipeline automation:
GRANT MODIFY ON ALL TABLES IN SCHEMA main.silver TO PRINCIPAL databricks_etl_sp;

-- Verify a user's effective permissions:
SHOW GRANTS ON TABLE main.gold.fct_orders;`,
          expectedOutput: `-- SHOW GRANTS output:
Principal             Privilege    Object
--------------------  -----------  ---------------------
GROUP:data_engineers  SELECT       SCHEMA main.silver
GROUP:analytics       SELECT       SCHEMA main.gold
GROUP:pii_access_team SELECT       TABLE main.silver.customers_pii
PRINCIPAL:etl_sp      MODIFY       SCHEMA main.silver`,
          interview: {
            question: 'What problem does Unity Catalog solve that storage-level RBAC cannot?',
            answer: 'Storage RBAC is coarse-grained — it controls access to containers and files. Unity Catalog is fine-grained — it controls access to tables, columns, and rows without exposing the underlying storage path. Key capabilities not possible with storage RBAC alone: (1) column masking — SSN visible to finance team, masked for analysts. (2) Row-level security — each team only sees their region\'s data. (3) Table-level grants — analysts see Gold tables but not Silver, even though both are in the same storage account. (4) Lineage — Unity Catalog tracks which pipeline wrote which table and which user queried it.',
          },
          practice: 'Design the Unity Catalog permission model for a healthcare data platform. Requirements: data engineers can read/write all layers; analysts can read Gold only; no user should see patient_id or ssn columns without explicit PII access; compliance team needs audit logs of every SSN access.',
          hint: 'Use GRANT for table access, column masking functions for PII columns, row filters if needed, and Unity Catalog audit logs to Log Analytics.',
          solution: `-- Healthcare Unity Catalog access model:

-- Catalog-level USE grants (needed to navigate hierarchy):
GRANT USE CATALOG ON CATALOG healthcare TO GROUP data_engineers;
GRANT USE CATALOG ON CATALOG healthcare TO GROUP analysts;
GRANT USE CATALOG ON CATALOG healthcare TO GROUP compliance;

-- Data engineers: read/write Bronze, Silver, Gold:
GRANT USE SCHEMA ON SCHEMA healthcare.bronze TO GROUP data_engineers;
GRANT USE SCHEMA ON SCHEMA healthcare.silver TO GROUP data_engineers;
GRANT USE SCHEMA ON SCHEMA healthcare.gold TO GROUP data_engineers;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA healthcare.silver TO GROUP data_engineers;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA healthcare.gold TO GROUP data_engineers;

-- Analysts: read Gold only:
GRANT USE SCHEMA ON SCHEMA healthcare.gold TO GROUP analysts;
GRANT SELECT ON ALL TABLES IN SCHEMA healthcare.gold TO GROUP analysts;

-- Column masking for PII:
CREATE FUNCTION mask_ssn(ssn STRING)
RETURNS STRING
RETURN CASE WHEN IS_MEMBER('pii_data_team') THEN ssn ELSE '***-**-****' END;

ALTER TABLE healthcare.gold.patient_summary
  ALTER COLUMN ssn SET MASK mask_ssn;
ALTER TABLE healthcare.gold.patient_summary
  ALTER COLUMN patient_id SET MASK
  (CASE WHEN IS_MEMBER('pii_data_team') THEN patient_id ELSE 'MASKED' END);

-- Audit logs: Unity Catalog sends all access events to Log Analytics
-- Query: SELECT * FROM system.access.audit WHERE event_type = 'SELECT'
--        AND table_name LIKE '%patient%' ORDER BY event_time DESC`,
          commonMistakes: [
            'Granting ALL PRIVILEGES to analytics groups "to keep it simple" — this includes DROP TABLE and ALTER TABLE, which can destroy production data.',
            'Setting up Unity Catalog permissions but leaving ADLS container public — storage RBAC and UC permissions are independent; UC grants do not override permissive storage access.',
            'Not testing column masking with the actual analyst user account — masking function logic bugs are easy to miss in development with admin accounts.',
          ],
          productionContext: 'Fabric OneLake Data Access Roles are the Fabric equivalent of Unity Catalog permissions. They are newer and less mature — as of 2024, they support table-level access but column masking is still limited. For enterprise Fabric deployments, use Fabric workspace roles for item-level access and combine with Fabric security features or Purview policies for column-level control.',
          seniorNote: 'Unity Catalog audit logs are a compliance asset. Every SELECT, INSERT, MERGE on every table is logged with the principal, timestamp, and affected row count — sent automatically to the system.access catalog. For SOC 2 and HIPAA, you can prove exactly who accessed PII data and when. Build a Databricks SQL query or Power BI report on the audit log — compliance teams will love you for it.',
        },
      ],
    },
    {
      title: 'Private Networking and Secure Access',
      subtopics: [
        {
          id: 'private-endpoints',
          title: 'Private Endpoints and Network Isolation',
          difficulty: 'Advanced',
          explanation: `A Private Endpoint puts a resource (Key Vault, Storage Account, Databricks) on your VNet with a private IP address. Traffic from that VNet to the resource travels the Azure backbone — it never crosses the public internet. DNS in the VNet resolves the service hostname to the private IP.

Data engineering resources commonly protected with private endpoints:
- Azure Data Lake Storage: prevents public reads of sensitive data
- Azure Key Vault: prevents public secret access
- Databricks workspace: controls who can reach the UI and API
- SQL/Synapse: prevents database port exposure to internet`,
          why: 'Default Azure resource configuration exposes public endpoints accessible from anywhere on the internet. A misconfigured storage account firewall (or no firewall at all) exposes all blob data to public reads. Private endpoints make resources reachable only from inside your VNet — a stolen access key cannot be used from outside the network perimeter.',
          syntax: `# Create a private endpoint for ADLS Gen2:
az network private-endpoint create \
  --name adls-private-ep \
  --resource-group myRG \
  --vnet-name myVNet \
  --subnet data-subnet \
  --private-connection-resource-id /subscriptions/<sub>/.../storageAccounts/myadls \
  --group-id dfs \
  --connection-name adls-private-connection

# Create private DNS zone and link to VNet:
az network private-dns zone create \
  --name privatelink.dfs.core.windows.net \
  --resource-group myRG
az network private-dns link vnet create \
  --zone-name privatelink.dfs.core.windows.net \
  --resource-group myRG \
  --name adls-dns-link \
  --virtual-network myVNet \
  --registration-enabled false

# Disable public access on storage account:
az storage account update \
  --name myadls \
  --resource-group myRG \
  --public-network-access Disabled`,
          example: `# Full secure ADLS configuration:

# 1. Disable public network access:
az storage account update --name myadls --resource-group myRG \
  --public-network-access Disabled
# Now: myadls.blob.core.windows.net is unreachable from internet

# 2. Private endpoint routes VNet traffic to private IP (e.g., 10.0.1.5)
# DNS in VNet: myadls.blob.core.windows.net → 10.0.1.5 (private IP)
# From outside VNet: DNS resolves to public IP → connection rejected

# 3. ADF using Self-Hosted Integration Runtime in the VNet:
# ADF IR runs in a VM inside the VNet
# IR VM → private DNS → 10.0.1.5 → ADLS (private connection)
# ADF control plane orchestrates; data path stays private

# 4. Databricks using VNet injection:
# Databricks clusters run in subnets of your VNet
# Spark executors → private DNS → ADLS private endpoint → private connection
# No traffic leaves your VNet for data plane operations`,
          expectedOutput: `# Test from inside VNet (success):
nslookup myadls.dfs.core.windows.net
Answer: myadls.dfs.core.windows.net → 10.0.1.5 (private IP) ✓

# Test from internet (expected failure after private endpoint):
nslookup myadls.dfs.core.windows.net
Answer: myadls.dfs.core.windows.net → 52.x.x.x (public IP)
# curl https://myadls.dfs.core.windows.net/bronze?... → 403 Forbidden ✓`,
          interview: {
            question: 'Your ADF pipeline fails with "connection refused" after the network team enables a private endpoint on ADLS. What are the likely causes?',
            answer: 'Three causes: (1) ADF Integration Runtime is not inside the VNet — the default Azure IR runs on Azure-managed infrastructure outside your VNet and cannot reach private endpoints. Fix: deploy a Self-Hosted Integration Runtime on a VM inside the VNet, or use Managed VNet IR. (2) DNS resolution not updated — the VNet private DNS zone is not linked to the VNet where ADF runs. The hostname still resolves to the public IP which is now blocked. Fix: link the private DNS zone to the ADF\'s VNet. (3) Firewall/NSG rule blocks port 443 from the IR subnet to the storage account private endpoint subnet. Fix: add NSG rule permitting TCP/443 from IR subnet to storage subnet.',
          },
          practice: 'Design the network architecture for an Azure data platform where ADF reads from an on-premise SQL Server and writes to ADLS with public access disabled. List every network component needed.',
          hint: 'ADF needs a Self-Hosted IR on a VM in your VNet. VM needs line-of-sight to on-premise via VPN or ExpressRoute. ADLS needs private endpoint in that VNet. Private DNS zone for storage.',
          solution: `# Network components required:

# 1. VNet: 10.0.0.0/16 — data platform VNet
#    Subnets:
#    - integration-runtime: 10.0.1.0/24 (SHIR VM lives here)
#    - private-endpoints: 10.0.2.0/24 (private endpoint NICs)
#    - databricks-public: 10.0.3.0/24
#    - databricks-private: 10.0.4.0/24

# 2. On-premise connectivity:
#    Option A: VPN Gateway (S2S VPN) — simpler, lower bandwidth
#    Option B: ExpressRoute — enterprise, dedicated circuit, lower latency
#    Route: on-prem SQL Server → VPN/ER → integration-runtime subnet

# 3. Self-Hosted Integration Runtime (SHIR):
#    VM in integration-runtime subnet
#    ADF SHIR installed: downloads pipeline task from ADF control plane
#    Connects to on-prem SQL: direct TCP 1433 via VPN/ER
#    Connects to ADLS: via private endpoint in private-endpoints subnet

# 4. ADLS Private Endpoint:
#    Private endpoint NIC in private-endpoints subnet (IP: 10.0.2.5)
#    Private DNS Zone: privatelink.blob.core.windows.net → 10.0.2.5
#    ADLS public access: Disabled

# 5. NSG rules:
#    integration-runtime subnet → private-endpoints subnet: TCP 443 ALLOW
#    integration-runtime subnet → on-prem: TCP 1433 ALLOW
#    Deny all other inbound to private-endpoints subnet`,
          commonMistakes: [
            'Creating a private endpoint without disabling public access — public endpoint remains open, private endpoint adds a private path but does not remove the public risk.',
            'Forgetting the private DNS zone — without it, DNS resolves to the public IP, which is now blocked, causing a confusing 403 instead of a clear connection refused.',
            'Placing the Self-Hosted IR outside the VNet that has the private endpoint — the IR cannot reach the private IP from a different VNet without VNet peering.',
          ],
          productionContext: 'Enterprise Azure data platforms require private endpoints on all data storage and Key Vault resources — this is a hard requirement in most financial, healthcare, and government cloud security baselines. Azure Policy "Deny" rules prevent creating storage accounts without private endpoints or with public access enabled. Design the network architecture before provisioning resources; retrofitting private endpoints on existing resources is significantly more complex.',
          seniorNote: 'Managed VNet for ADF (available in ADF v2) eliminates the need to manage Self-Hosted IR VMs. ADF provisions isolated managed VNet infrastructure and creates managed private endpoints to ADLS, SQL, and Key Vault on your behalf. You approve the endpoint connections, and ADF handles all the networking. This is the preferred approach for new ADF deployments — no VMs to patch, no IR upgrades to manage.',
        },
      ],
    },
    {
      title: 'Data Governance and Purview',
      subtopics: [
        {
          id: 'purview-governance',
          title: 'Microsoft Purview — Lineage, Classification, and Auditing',
          difficulty: 'Advanced',
          explanation: `Microsoft Purview is an enterprise data governance service that provides:
- Data Catalog: register and document data assets across ADLS, Synapse, Fabric, SQL Server
- Data Map: automated scanning and classification of sensitive data
- Data Lineage: end-to-end tracking of data flow from source to dashboard
- Auditing: logs of who accessed what data and when
- Sensitivity Labels: classify data as Confidential, PII, Financial

In data engineering, Purview is the governance layer above the technical implementation — it answers "where is all our customer data?" and "who accessed the payments table last week?"`,
          why: 'GDPR requires knowing where PII data is stored, who can access it, and the ability to delete it on request. Purview automates PII discovery (scanning tables for columns matching SSN, credit card, email patterns) and tracks lineage from source to mart. Without Purview, a "delete all data for customer X" GDPR request requires manually checking every table in every system — an expensive, error-prone process.',
          syntax: `# Register ADLS Gen2 as a data source in Purview (Azure CLI):
az purview account create \
  --account-name myPurviewAccount \
  --resource-group myRG \
  --location eastus

# Create a scan rule set for ADLS with PII classification:
# In Purview Studio: Sources → Register → ADLS Gen2 → Configure scan
# Select: System Classification Rules (includes SSN, Credit Card, Email)
# Schedule: Daily

# Grant Purview MI access to scan ADLS:
PURVIEW_MI=$(az purview account show -n myPurviewAccount -g myRG \
  --query identity.principalId -o tsv)
az role assignment create \
  --assignee $PURVIEW_MI \
  --role "Storage Blob Data Reader" \
  --scope /subscriptions/<sub>/.../storageAccounts/myadls`,
          example: `# Purview lineage for a Fabric/ADF pipeline — what gets tracked automatically:

# ADF Copy Activity: raw_orders.csv (ADLS Bronze) → orders table (Synapse)
# Purview records: ADLS Bronze/raw_orders.csv → Synapse.orders  (CopyActivity lineage)

# Databricks notebook: orders → cleaned_orders
# Purview records: Synapse.orders → ADLS Silver/cleaned_orders  (Spark lineage)

# Power BI report consuming Gold:
# Purview records: ADLS Gold/daily_revenue → Power BI Dataset → Dashboard

# Full lineage visible in Purview:
# raw_orders.csv → orders (Synapse) → cleaned_orders (Silver) → daily_revenue (Gold) → Dashboard

# GDPR erasure workflow with Purview:
# 1. Search Purview catalog: "customer_id = 12345" → finds 7 tables across 3 systems
# 2. Purview shows exact table names and schemas
# 3. Run DELETE from each table where customer_id = 12345
# 4. For Delta Lake: run VACUUM after retention window to physically remove files
# 5. Document in Purview: add compliance note to each affected asset`,
          expectedOutput: `# Purview classification scan result:
Asset: ADLS/silver/customers/customers.parquet
Classified columns:
  - email (Microsoft.Sensitive.Email — 100% confidence, 14,382 values)
  - phone_number (Microsoft.Sensitive.PhoneNumber — 98% confidence)
  - ssn (Microsoft.Sensitive.U.S.SocialSecurityNumber — 99% confidence)

Sensitivity label: Highly Confidential — PII
Owner: data-engineering-team
Last scanned: 2024-01-15 06:23:45 UTC`,
          interview: {
            question: 'How does Microsoft Purview help a data engineering team respond to a GDPR data subject access request?',
            answer: 'A GDPR subject access request (SAR) requires knowing every system storing data for a specific person and providing or deleting it within 30 days. Without Purview, you manually check every table in every pipeline — unreliable at scale. With Purview: (1) Scan all data sources automatically — Purview discovers and catalogs all tables across ADLS, Databricks, Synapse, Fabric. (2) Column-level classification identifies columns containing PII (email, customer_id, SSN). (3) Lineage shows every table that was derived from a source record. (4) Search the catalog for customer identifier columns — find all 7 tables with customer_id in 10 seconds, not 10 hours. (5) Document deletion actions in the catalog as compliance evidence.',
          },
          practice: 'Design the Purview governance setup for a financial data platform. The platform has ADLS Gen2 (Bronze/Silver/Gold), Azure Databricks, Microsoft Fabric, and SQL Database. List the data sources to register, scan frequency, classification rules, and who should own each asset.',
          hint: 'Register each data source → create scan rule sets with financial + PII classification → schedule daily scans → assign data owners by domain (Finance owns Gold, DE team owns Bronze/Silver).',
          solution: `# Purview governance setup — financial data platform:

# 1. Register data sources:
Sources:
  - ADLS Gen2 (myadls) → scan Bronze, Silver, Gold containers
  - Azure Databricks → scan Unity Catalog tables
  - Microsoft Fabric → scan Lakehouse and Warehouse items
  - Azure SQL Database → scan source operational tables

# 2. Scan configurations:
ADLS:
  Scan: daily at 02:00 UTC (after nightly pipeline completes)
  Classification rules:
    - System rules: Credit Card, SSN, ABA Routing, SWIFT, Bank Account
    - Custom rules: "account_id" pattern (internal financial identifier)
  Scope: all containers

# 3. Sensitivity labels (align with Microsoft Purview Information Protection):
Label: Highly Confidential — Financial PII (SSN, card numbers, account IDs)
Label: Confidential — Internal (revenue, margin data)
Label: General (aggregated public metrics)

# 4. Data asset ownership:
Bronze assets: owned by data-engineering team
Silver assets: owned by data-engineering team
Gold - Finance schema: owned by finance-analytics team
Gold - Marketing schema: owned by marketing-analytics team

# 5. Lineage integration:
Enable: ADF → Purview connector (automatic lineage from Copy Activities)
Enable: Databricks → Purview lineage (Unity Catalog integration)
Enable: Fabric → Purview integration (workspace scan)`,
          commonMistakes: [
            'Running Purview scans during peak pipeline hours — scans are resource-intensive on ADLS; schedule them in low-activity windows (early morning after nightly loads complete).',
            'Over-classifying all columns as PII — causes alert fatigue and makes the catalog unusable. Tune classification rules to match your actual PII definition.',
            'Not assigning data owners — Purview becomes a read-only catalog with nobody accountable for accuracy. Assign owners by domain.',
          ],
          productionContext: 'Purview is increasingly required by enterprise cloud governance frameworks (CAF, NIST). Azure Policy can enforce that all new data resources in a subscription are registered in Purview automatically. For regulated industries, Purview audit logs (who accessed what data, when) are the evidence base for compliance reports. Without them, security reviews become manual spreadsheet exercises.',
          seniorNote: 'Purview lineage has a practical limitation: it only captures lineage from Azure-native connectors (ADF, Synapse, Fabric). Custom Python scripts, Databricks notebooks without Unity Catalog integration, and third-party ETL tools produce blind spots. The senior approach: design pipelines to use Purview-compatible tools where possible (ADF for copy activities, Unity Catalog for Databricks), and add custom lineage via the Purview API for pipeline stages it cannot detect automatically.',
        },
      ],
    },
    {
      title: 'Secrets in CI/CD',
      subtopics: [
        {
          id: 'cicd-secrets-management',
          title: 'Secrets in GitHub Actions and Azure DevOps',
          difficulty: 'Intermediate',
          explanation: `CI/CD pipelines deploy infrastructure and application code that needs access to Azure resources. Managing secrets in CI/CD has two layers:
1. Pipeline secrets: credentials the CI/CD runner uses to deploy to Azure (SP client secret, OIDC token)
2. Application secrets: credentials that end up in deployed applications (database passwords, API keys)

Both must be handled securely — leaked pipeline credentials can mean full Azure subscription compromise; leaked application secrets mean production data access.`,
          why: 'CI/CD pipelines are a high-value attack target. A GitHub Actions workflow with hardcoded Azure credentials can be triggered by any contributor to the repo (or exploited via a compromised dependency). Secret scanning tools (GitHub Secret Scanning, TruffleHog) automatically detect and block commits containing credentials — but only if they are enabled. The modern standard: pipelines use OIDC (no stored secrets), application secrets live in Key Vault and are never in code.',
          syntax: `# GitHub Actions — Azure login with OIDC (no stored client secret):
- name: Azure Login (OIDC — no secret stored)
  uses: azure/login@v2
  with:
    client-id: \${{ secrets.AZURE_CLIENT_ID }}      # App registration client ID
    tenant-id: \${{ secrets.AZURE_TENANT_ID }}
    subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}
# Note: no client-secret needed — OIDC federation handles auth

# Azure DevOps — Service Connection with Workload Identity Federation:
# Service Connection → Azure Resource Manager → Workload Identity Federation
# No password stored in DevOps — federated credential on AAD app registration

# Reference Key Vault secrets in GitHub Actions:
- name: Get Key Vault secrets
  uses: azure/get-keyvault-secrets@v1
  with:
    keyvault: prodKV
    secrets: 'snowflake-password, salesforce-token'
  id: kvSecrets

- name: Run deployment script
  env:
    SNOWFLAKE_PASSWORD: \${{ steps.kvSecrets.outputs.snowflake-password }}
  run: python deploy_dbt.py
# Secret value masked in workflow logs: ***`,
          example: `# Complete GitHub Actions workflow for dbt deployment:
# .github/workflows/dbt-deploy.yml
name: dbt Production Deploy
on:
  push:
    branches: [main]

permissions:
  id-token: write   # Required for OIDC
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Azure Login (OIDC — no stored password)
        uses: azure/login@v2
        with:
          client-id: \${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: \${{ secrets.AZURE_TENANT_ID }}
          subscription-id: \${{ secrets.AZURE_SUBSCRIPTION_ID }}

      - name: Fetch Snowflake credentials from Key Vault
        uses: azure/get-keyvault-secrets@v1
        with:
          keyvault: prodKeyVault
          secrets: snowflake-account, snowflake-user, snowflake-password
        id: kv

      - name: Run dbt
        env:
          SNOWFLAKE_ACCOUNT: \${{ steps.kv.outputs.snowflake-account }}
          SNOWFLAKE_USER: \${{ steps.kv.outputs.snowflake-user }}
          SNOWFLAKE_PASSWORD: \${{ steps.kv.outputs.snowflake-password }}
        run: |
          pip install dbt-snowflake
          dbt run --profiles-dir . --target prod
          dbt test --profiles-dir . --target prod`,
          expectedOutput: `# GitHub Actions run log — secrets are masked:
Run python deploy_dbt.py
  Snowflake password: ***  (masked automatically)
  dbt run completed: 12 models OK
  dbt test completed: 34 tests PASS

# Secret scanning detection (if secret accidentally committed):
GitHub Secret Scanning: ALERT
  Detected: AWS_SECRET_ACCESS_KEY in commit abc123
  File: config/settings.py, line 14
  Status: Secret revoked and rotated automatically`,
          interview: {
            question: 'What is the risk of storing an Azure Service Principal client secret as a GitHub Actions secret, and what is the modern alternative?',
            answer: 'The risk: a GitHub Actions secret with an SP client secret is a long-lived credential (valid for up to 2 years) stored in GitHub\'s secrets store. If the GitHub organisation is compromised, all SP secrets are exposed. The secret must be manually rotated before expiry and the rotation must be coordinated with all workflows that use it. The modern alternative: OIDC federation (Workload Identity Federation). GitHub requests a short-lived OIDC token from GitHub\'s identity provider for each run. The Azure SP has a federated credential configured to trust tokens from github.com for that specific repo and branch. No secret is stored anywhere — each run gets a different token valid for minutes only.',
          },
          practice: 'Your Azure DevOps pipeline currently uses a service connection backed by a service principal with a client secret. The secret expires in 60 days. Migrate to Workload Identity Federation. List every step.',
          hint: 'Create/update SP with federated credential → update DevOps service connection to Workload Identity type → test pipeline → rotate/remove old secret.',
          solution: `# Migrate Azure DevOps service connection to Workload Identity Federation

# Step 1: Update existing service connection in Azure DevOps
# Azure DevOps → Project Settings → Service Connections
# Select existing service connection → Edit
# Change: Credential type → "Workload Identity Federation (automatic)"
# Azure DevOps automatically creates the federated credential on the AAD app registration

# Alternative — manual setup:
# Step 1: Create federated credential on AAD app registration
az ad app federated-credential create \
  --id <app-id> \
  --parameters '{
    "name": "azdevops-deploy",
    "issuer": "https://vstoken.dev.azure.com/<org-id>",
    "subject": "sc://<org>/<project>/<service-connection-name>",
    "audiences": ["api://AzureADTokenExchange"]
  }'

# Step 2: Update service connection in DevOps to use WIF
# No client secret stored — DevOps gets short-lived OIDC tokens

# Step 3: Test the pipeline
# Run a pipeline job → should succeed without client secret

# Step 4: Remove the old client secret
az ad app credential delete \
  --id <app-id> \
  --key-id <old-secret-key-id>

# Step 5: Verify no other pipelines/tools were using the old secret`,
          commonMistakes: [
            'Storing production Key Vault secrets as GitHub Actions secrets "for convenience" — secrets in GitHub bypass Key Vault audit logs and rotation workflows.',
            'Using the same service principal for all environments (dev/staging/prod) — a compromised dev pipeline credential gives prod access.',
            'Not enabling GitHub Secret Scanning and Push Protection — without these, a developer accidentally commits a credential and it takes days to detect.',
          ],
          productionContext: 'GitHub Advanced Security (secret scanning + push protection) should be enabled on all repos containing deployment code. Push protection blocks commits containing known credential patterns before they ever reach the remote. Azure DevOps has equivalent "Credential Scanner" tasks that run in the pipeline and fail the build on detected secrets. Both should be mandatory in enterprise repos.',
          seniorNote: 'Secret rotation strategy: for any secret that cannot use OIDC (third-party SaaS API keys, SFTP passwords), implement event-driven rotation using Azure Functions + Key Vault event notifications. When a secret is within 30 days of expiry, Key Vault fires an event to an Event Grid topic → Azure Function generates a new credential at the target system → stores new secret in Key Vault → sends notification to the team. Near-zero-touch rotation that prevents expiry outages.',
        },
      ],
    },
    {
      title: 'Production Incident Scenarios',
      subtopics: [
        {
          id: 'security-incidents',
          title: 'Real Security Incident Patterns and Responses',
          difficulty: 'Advanced',
          explanation: `Security incidents in Azure data platforms follow repeatable patterns. Understanding them allows faster diagnosis and preventive design. The most common incidents in data engineering are:
1. Leaked storage access key (most common, high blast radius)
2. Over-permissioned service principal exploited
3. Expired SP causing pipeline outage
4. Key Vault access policy removed accidentally
5. Accidental public blob exposure
6. RBAC propagation delay causing intermittent 403s`,
          why: 'Data engineers are not typically security engineers, but they are the first responders when a pipeline fails with an authentication error or when a security team flags an exposure. Knowing the exact diagnostic steps and remediation for each pattern reduces incident duration from hours to minutes.',
          syntax: `# INCIDENT 1: Leaked storage key — immediate response
# Rotate the storage account key immediately (invalidates old key):
az storage account keys renew \
  --account-name myadls \
  --resource-group myRG \
  --key primary
# All connections using old key will fail instantly.
# Update any Linked Services, Databricks mounts, and apps using the key.

# Diagnostic: find who used the leaked key (Azure Monitor):
# Query: StorageBlobLogs
# | where AuthenticationType == "SharedKey"
# | where TimeGenerated > ago(48h)
# | project TimeGenerated, CallerIpAddress, Uri, OperationName

# INCIDENT 2: SP client secret expired — find affected pipelines
# Check ADF for failed runs with auth error:
az datafactory pipeline-run query-by-factory \
  --factory-name myADF \
  --resource-group myRG \
  --last-updated-after "2024-01-14T00:00:00Z" \
  --filters "[{\"operand\": \"Status\", \"operator\": \"Equals\", \"values\": [\"Failed\"]}]"`,
          example: `# INCIDENT 3: Accidental public blob exposure — detect and remediate

# Step 1: Detect if storage account has public access enabled
az storage account show --name myadls --resource-group myRG \
  --query "allowBlobPublicAccess"
# Returns: true  (PROBLEM — blobs accessible without auth)

# Step 2: Check which containers have public access level
az storage container list --account-name myadls \
  --query "[?properties.publicAccess != 'None'].{name:name, access:properties.publicAccess}" \
  --output table

# Step 3: Disable public access on the account (blocks all public access):
az storage account update --name myadls --resource-group myRG \
  --allow-blob-public-access false

# Step 4: Set all containers to private access level:
for container in bronze silver gold; do
  az storage container set-permission \
    --name $container \
    --account-name myadls \
    --public-access off
done

# Step 5: Check access logs for suspicious activity during exposure window
# Azure Monitor → StorageBlobLogs
# | where AuthenticationType == "Anonymous"
# | where TimeGenerated > ago(72h)
# | project TimeGenerated, CallerIpAddress, Uri, StatusCode
# | where StatusCode == 200  -- successful anonymous reads

# INCIDENT 4: RBAC propagation delay — intermittent 403s
# Symptom: ADF pipeline fails with 403 immediately after role assignment
# Cause: RBAC changes take 1-5 minutes to propagate globally
# Fix: retry the pipeline after 5 minutes, or add retry logic in pipeline
# Long-term fix: provision RBAC 10+ minutes before pipeline runs in deployment scripts`,
          expectedOutput: `# INCIDENT 1 — leaked key audit log query result:
TimeGenerated           | CallerIpAddress  | Uri                    | OperationName
2024-01-15 14:23:11 UTC | 185.x.x.x        | /bronze/customers.csv  | GetBlob
2024-01-15 14:23:15 UTC | 185.x.x.x        | /silver/orders.parquet | GetBlob
2024-01-15 14:23:22 UTC | 185.x.x.x        | /gold/revenue.parquet  | GetBlob
# IP 185.x.x.x is NOT in your network — external access confirmed
# Files accessed: customers.csv, orders.parquet, revenue.parquet
# Response: rotate key (done), notify DPO (72hr GDPR window started)`,
          interview: {
            question: 'Walk through your response to discovering that a storage account access key was leaked in a GitHub commit 6 hours ago.',
            answer: 'Immediate containment (0–5 minutes): rotate the storage key via az storage account keys renew — this instantly invalidates the leaked key. All legitimate services using the old key will break, but that is acceptable. Recovery (5–30 minutes): identify all Linked Services, Databricks mounts, and apps that used the old key. Update them to use the new key or, better, migrate to Managed Identity. Detection scope (30–60 minutes): query StorageBlobLogs for operations using SharedKey authentication in the past 24 hours, filtered to IP addresses outside your network. Confirm what data was accessed. Notification (1 hour): if PII data was accessed by an external IP, notify the Data Protection Officer — GDPR 72-hour breach notification window has started. Prevention (day 2): migrate all storage access to Managed Identity, enable GitHub Push Protection to block future credential commits, add Azure Policy to deny storage accounts from exposing access keys to non-admin principals.',
          },
          practice: 'Your monitoring alert fires: a Databricks job that ran successfully for 6 months is suddenly failing with "AuthorizationFailed: insufficient privileges". The job reads from ADLS Silver and writes to ADLS Gold. Diagnose the three most likely causes and how you would confirm each.',
          hint: 'RBAC removed, MI disabled, ADLS firewall changed. Check: role assignments, MI status, storage network rules.',
          solution: `# Three most likely causes and diagnostics:

# Cause 1: RBAC role assignment was removed
az role assignment list \
  --assignee <databricks-mi-id> \
  --scope ".../storageAccounts/myadls" \
  --output table
# If "Storage Blob Data Contributor" not listed for Gold container → confirm cause
# Fix: re-add the role assignment
# Root cause: someone ran az role assignment delete or Terraform apply removed it

# Cause 2: Databricks workspace Managed Identity was disabled or workspace deleted/recreated
az databricks workspace show --name myWorkspace --resource-group myRG \
  --query "identity"
# If identity is null or principalId changed → confirm cause
# Note: re-creating a workspace creates a NEW MI with a different principal ID
# All role assignments for the old MI are now orphaned
# Fix: re-assign all required RBAC roles to the new MI principal ID

# Cause 3: ADLS storage account network firewall changed
az storage account show --name myadls --resource-group myRG \
  --query "networkRuleSet"
# If defaultAction changed from "Allow" to "Deny" and Databricks subnet
# is not in the VNet rules → confirm cause
# Fix: add Databricks managed VNet subnets to ADLS firewall allowed VNets

# Additional: check Azure Activity Log for changes in the past 24-48 hours
az monitor activity-log list \
  --resource-id /subscriptions/<sub>/.../storageAccounts/myadls \
  --start-time 2024-01-14T00:00:00Z \
  --query "[?operationName.value contains 'Microsoft.Authorization/roleAssignments']"`,
          commonMistakes: [
            'Rotating a leaked key without checking audit logs first — you need to know what was accessed before rotating, or you lose the ability to determine breach scope.',
            'Not updating GDPR breach notification procedures — if PII data was accessed by an external party, legal has 72 hours from discovery to notify regulators. A 6-hour investigation delay before notification starts the clock earlier than you want.',
            'Fixing the broken pipeline without documenting how the RBAC was removed — without root cause analysis, the same change gets made again in 2 weeks.',
          ],
          productionContext: 'Every enterprise Azure data platform should have these security baselines enabled: (1) Microsoft Defender for Storage — alerts on anomalous blob access patterns, leaked keys detected in public repos, and malware uploads. (2) Azure Policy — prevents insecure configurations from being deployed (e.g., deny storage accounts with public access, deny compute with public IPs). (3) Azure Monitor alerts — fire when storage keys are regenerated (indicates possible leak response) or when RBAC assignments change on production resources. These reduce incident detection time from days to minutes.',
          seniorNote: 'Security in data platforms is a shared responsibility model between the security team and the DE team. The security team sets policies and monitors alerts; the DE team designs resources to be secure by default and responds to DE-specific incidents. Senior DEs distinguish themselves by proactively following up on security findings, designing Managed Identity patterns that eliminate credential classes entirely, and building post-mortems with systemic fixes (not just "we rotated the key"). The most valuable posture: make secure the path of least resistance — a Terraform module that provisions ADF with MI, Key Vault with private endpoint, and RBAC all pre-configured makes secure the default, not the exception.',
        },
      ],
    },
  ],
};
