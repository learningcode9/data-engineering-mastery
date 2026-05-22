-- ============================================================
-- Data Engineering Mastery — Seed Data
-- Run after migrations: supabase db reset
-- ============================================================

-- ─── Incident scenarios ───────────────────────────────────────────────────────
-- These are read-only reference rows (publicly visible via RLS).
-- They power the Incident Simulator without requiring user auth.

insert into public.incidents (id, title, severity, status, affected_system, business_impact) values

(
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Spark OOM — wide join on patient cohort',
  'P1',
  'active',
  'Azure Databricks — ML feature pipeline',
  'Patient risk scores unavailable for morning clinical rounds. '
  '15 hospital clients blocked. Risk of regulatory non-compliance if delayed past 08:00 UTC.'
),

(
  'a1b2c3d4-0002-0002-0002-000000000002',
  'Kafka consumer lag — fraud scoring pipeline',
  'P2',
  'active',
  'Confluent Kafka — clickstream + fraud scoring',
  'Fraud detection running 47 minutes behind real-time. '
  'Transactions processed during the lag window require manual review. '
  'Compliance flag risk if lag exceeds 90 minutes.'
),

(
  'a1b2c3d4-0003-0003-0003-000000000003',
  'Schema drift — ADF orders pipeline failure',
  'P2',
  'active',
  'Azure Data Factory — orders Silver layer',
  'Orders pipeline has been failing for 30 minutes due to an unmapped column '
  '(discount_percent) added to the source ERP table. Finance dashboard stale. '
  'Board meeting in 45 minutes requires live revenue data.'
),

(
  'a1b2c3d4-0004-0004-0004-000000000004',
  'ADF copy activity failure — raw to Bronze',
  'P3',
  'active',
  'Azure Data Factory — raw ingestion pipeline',
  'The nightly ADF copy activity from the on-prem SQL Server to ADLS Bronze layer '
  'failed silently after 3 retries. Downstream Silver and Gold transforms have '
  'stale data from the previous run. Affects 6 business reports.'
),

(
  'a1b2c3d4-0005-0005-0005-000000000005',
  'Delta small file problem — orders_silver table',
  'P2',
  'active',
  'Azure Databricks Delta Lake — orders_silver',
  'Delta table has accumulated 840K small files (< 1 MB average) after switching '
  'to 5-minute micro-batch writes. MERGE operations are timing out. '
  'BI team reporting Power BI query timeouts. SLA breach on 4 reports.'
);
