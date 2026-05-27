// Realistic SQL playground datasets.
// Each table has 12-40 rows designed to produce interesting results for
// filtering, joining, aggregation, window functions, and subqueries.

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS customers (
  customer_id   INTEGER PRIMARY KEY,
  customer_name TEXT    NOT NULL,
  email         TEXT,
  city          TEXT,
  state         TEXT,
  status        TEXT    DEFAULT 'active',
  created_at    TEXT
);

CREATE TABLE IF NOT EXISTS products (
  product_id     INTEGER PRIMARY KEY,
  product_name   TEXT NOT NULL,
  category       TEXT,
  price          REAL NOT NULL,
  stock_quantity INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  order_id    INTEGER PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(customer_id),
  product_id  INTEGER REFERENCES products(product_id),
  quantity    INTEGER NOT NULL DEFAULT 1,
  amount      REAL    NOT NULL,
  status      TEXT    DEFAULT 'pending',
  created_at  TEXT
);

CREATE TABLE IF NOT EXISTS bronze_orders (
  order_id        INTEGER,
  customer_id     INTEGER,
  product_id      INTEGER,
  amount          REAL,
  status          TEXT,
  source_system   TEXT,
  created_at      TEXT,
  updated_at      TEXT,
  ingestion_ts    TEXT,
  pipeline_run_id TEXT
);

CREATE TABLE IF NOT EXISTS silver_orders (
  order_id        INTEGER PRIMARY KEY,
  customer_id     INTEGER,
  product_id      INTEGER,
  amount          REAL,
  status          TEXT,
  created_at      TEXT,
  updated_at      TEXT,
  pipeline_run_id TEXT
);

CREATE TABLE IF NOT EXISTS dim_customer (
  customer_key          INTEGER PRIMARY KEY,
  customer_id           INTEGER,
  customer_name         TEXT,
  email                 TEXT,
  city                  TEXT,
  state                 TEXT,
  segment               TEXT,
  effective_start_date  TEXT,
  effective_end_date    TEXT,
  is_current            INTEGER
);

CREATE TABLE IF NOT EXISTS dim_product (
  product_key        INTEGER PRIMARY KEY,
  product_id         INTEGER,
  product_name       TEXT,
  category           TEXT,
  brand              TEXT,
  parent_product_key INTEGER,
  is_current         INTEGER
);

CREATE TABLE IF NOT EXISTS dim_date (
  date_key      TEXT PRIMARY KEY,
  calendar_date TEXT,
  fiscal_month  TEXT,
  fiscal_quarter TEXT,
  is_weekend    INTEGER
);

CREATE TABLE IF NOT EXISTS fact_sales (
  sales_id        INTEGER PRIMARY KEY,
  order_id        INTEGER,
  date_key        TEXT REFERENCES dim_date(date_key),
  customer_key    INTEGER REFERENCES dim_customer(customer_key),
  product_key     INTEGER REFERENCES dim_product(product_key),
  quantity        INTEGER,
  gross_sales     REAL,
  discount_amount REAL,
  net_sales       REAL,
  pipeline_run_id TEXT
);

CREATE TABLE IF NOT EXISTS pipeline_audit (
  run_id         TEXT PRIMARY KEY,
  pipeline_name  TEXT,
  status         TEXT,
  source_count   INTEGER,
  target_count   INTEGER,
  error_count    INTEGER,
  run_date       TEXT
);

CREATE TABLE IF NOT EXISTS cdc_events (
  event_id      INTEGER PRIMARY KEY,
  order_id      INTEGER,
  customer_id   INTEGER,
  amount        REAL,
  status        TEXT,
  op_type       TEXT,
  event_ts      TEXT,
  source_lsn    INTEGER
);

CREATE TABLE IF NOT EXISTS dim_region (
  region_key  INTEGER PRIMARY KEY,
  region_id   INTEGER,
  region_name TEXT,
  country     TEXT,
  territory   TEXT
);

CREATE TABLE IF NOT EXISTS dim_store (
  store_key  INTEGER PRIMARY KEY,
  store_id   INTEGER,
  store_name TEXT,
  store_type TEXT,
  region_key INTEGER REFERENCES dim_region(region_key),
  is_current INTEGER
);

CREATE TABLE IF NOT EXISTS dim_employee (
  employee_key  INTEGER PRIMARY KEY,
  employee_id   INTEGER,
  employee_name TEXT,
  role          TEXT,
  manager_key   INTEGER,
  region_key    INTEGER REFERENCES dim_region(region_key),
  is_current    INTEGER
);

CREATE TABLE IF NOT EXISTS bridge_customer_segment (
  customer_key         INTEGER REFERENCES dim_customer(customer_key),
  segment_key          INTEGER,
  segment_name         TEXT,
  effective_start_date TEXT,
  effective_end_date   TEXT,
  priority             TEXT
);

CREATE TABLE IF NOT EXISTS fact_inventory (
  inventory_id    INTEGER PRIMARY KEY,
  snapshot_date   TEXT,
  store_key       INTEGER REFERENCES dim_store(store_key),
  product_key     INTEGER REFERENCES dim_product(product_key),
  on_hand_qty     INTEGER,
  reserved_qty    INTEGER,
  available_qty   INTEGER,
  pipeline_run_id TEXT
);

CREATE TABLE IF NOT EXISTS fact_payments (
  payment_id        INTEGER PRIMARY KEY,
  order_id          INTEGER,
  customer_key      INTEGER REFERENCES dim_customer(customer_key),
  payment_date      TEXT,
  payment_method    TEXT,
  payment_status    TEXT,
  authorized_amount REAL,
  captured_amount   REAL,
  pipeline_run_id   TEXT
);

CREATE TABLE IF NOT EXISTS audit_pipeline_execution (
  execution_id     TEXT PRIMARY KEY,
  pipeline_name    TEXT,
  status           TEXT,
  started_at       TEXT,
  ended_at         TEXT,
  duration_seconds INTEGER,
  rows_read        INTEGER,
  rows_written     INTEGER,
  error_count      INTEGER
);

CREATE TABLE IF NOT EXISTS error_deadletter_queue (
  error_id        INTEGER PRIMARY KEY,
  pipeline_run_id TEXT,
  source_table    TEXT,
  business_key    TEXT,
  error_type      TEXT,
  error_message   TEXT,
  payload         TEXT,
  retry_count     INTEGER,
  created_at      TEXT
);

CREATE TABLE IF NOT EXISTS employees (
  employee_id   INTEGER PRIMARY KEY,
  employee_name TEXT NOT NULL,
  department    TEXT,
  salary        REAL,
  manager_id    INTEGER REFERENCES employees(employee_id),
  hire_date     TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
  transaction_id   INTEGER PRIMARY KEY,
  customer_id      INTEGER REFERENCES customers(customer_id),
  amount           REAL    NOT NULL,
  transaction_date TEXT,
  payment_method   TEXT
);

CREATE TABLE IF NOT EXISTS events (
  event_id         INTEGER PRIMARY KEY,
  user_id          INTEGER REFERENCES customers(customer_id),
  event_type       TEXT    NOT NULL,
  page_url         TEXT,
  session_id       TEXT,
  occurred_at      TEXT,
  duration_seconds INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shipments (
  shipment_id  INTEGER PRIMARY KEY,
  order_id     INTEGER REFERENCES orders(order_id),
  carrier      TEXT,
  tracking_num TEXT,
  status       TEXT    DEFAULT 'processing',
  shipped_at   TEXT,
  delivered_at TEXT
);

CREATE TABLE IF NOT EXISTS inventory (
  inventory_id   INTEGER PRIMARY KEY,
  product_id     INTEGER REFERENCES products(product_id),
  warehouse      TEXT    NOT NULL,
  quantity       INTEGER NOT NULL DEFAULT 0,
  reorder_level  INTEGER DEFAULT 25,
  last_restocked TEXT
);
`;

export const SEED_SQL = `
-- customers
INSERT INTO customers VALUES
 (1,  'Alice Johnson',  'alice@email.com',   'Austin',   'TX', 'active',    '2022-03-15'),
 (2,  'Bob Smith',      'bob@email.com',      'Dallas',   'TX', 'active',    '2022-05-22'),
 (3,  'Carol Davis',    'carol@email.com',    'Austin',   'TX', 'inactive',  '2022-06-10'),
 (4,  'David Lee',      'david@email.com',    'Houston',  'TX', 'active',    '2022-08-01'),
 (5,  'Eva Martinez',   'eva@email.com',      'Dallas',   'TX', 'active',    '2022-09-18'),
 (6,  'Frank Wilson',   NULL,                 'Seattle',  'WA', 'active',    '2022-11-05'),
 (7,  'Grace Chen',     'grace@email.com',    'Denver',   'CO', 'active',    '2023-01-20'),
 (8,  'Henry Brown',    'henry@email.com',    'Chicago',  'IL', 'suspended', '2023-02-14'),
 (9,  'Isabella White', 'isabella@email.com', 'Seattle',  'WA', 'active',    '2023-04-07'),
 (10, 'James Taylor',   NULL,                 'Portland', 'OR', 'active',    '2023-05-30'),
 (11, 'Kate Anderson',  'kate@email.com',     'Austin',   'TX', 'inactive',  '2023-07-12'),
 (12, 'Liam Garcia',    'liam@email.com',     'Houston',  'TX', 'active',    '2023-08-25'),
 (13, 'Mia Robinson',   'mia@email.com',      'Dallas',   'TX', 'active',    '2023-10-03'),
 (14, 'Noah Harris',    'noah@email.com',     'Denver',   'CO', 'suspended', '2023-11-15'),
 (15, 'Olivia Clark',   'olivia@email.com',   'Chicago',  'IL', 'active',    '2024-01-08');

-- products
INSERT INTO products VALUES
 (1,  'SQL Fundamentals',      'Education', 99.00,  150),
 (2,  'Python for Data',       'Education', 79.00,  200),
 (3,  'Cloud Lab Pro',         'Lab',       149.00, 80),
 (4,  'Data Notebook',         'Tools',     39.00,  500),
 (5,  'Pipeline Kit',          'Tools',     59.00,  300),
 (6,  'Machine Learning 101',  'Education', 129.00, 120),
 (7,  'Spark Cluster Lab',     'Lab',       199.00, 60),
 (8,  'dbt Accelerator',       'Tools',     89.00,  180),
 (9,  'Azure Data Factory',    'Cloud',     249.00, 40),
 (10, 'AWS Glue Workshop',     'Cloud',     219.00, 55),
 (11, 'Advanced SQL Patterns', 'Education', 109.00, 100),
 (12, 'Kafka Streams Lab',     'Lab',       179.00, 70);

-- orders
INSERT INTO orders VALUES
 (101, 1,  1,  1, 99.00,  'delivered',  '2024-01-10'),
 (102, 1,  3,  1, 149.00, 'delivered',  '2024-01-22'),
 (103, 2,  2,  1, 79.00,  'shipped',    '2024-01-28'),
 (104, 2,  5,  2, 118.00, 'pending',    '2024-02-04'),
 (105, 3,  4,  1, 39.00,  'cancelled',  '2024-02-10'),
 (106, 4,  6,  1, 129.00, 'delivered',  '2024-02-15'),
 (107, 4,  9,  1, 249.00, 'shipped',    '2024-02-20'),
 (108, 5,  1,  1, 99.00,  'delivered',  '2024-02-28'),
 (109, 5,  11, 1, 109.00, 'delivered',  '2024-03-05'),
 (110, 6,  7,  1, 199.00, 'shipped',    '2024-03-12'),
 (111, 7,  2,  1, 79.00,  'delivered',  '2024-03-18'),
 (112, 7,  8,  1, 89.00,  'pending',    '2024-03-25'),
 (113, 8,  10, 1, 219.00, 'refunded',   '2024-04-02'),
 (114, 9,  3,  1, 149.00, 'delivered',  '2024-04-08'),
 (115, 9,  6,  2, 258.00, 'shipped',    '2024-04-15'),
 (116, 10, 4,  3, 117.00, 'delivered',  '2024-04-22'),
 (117, 10, 12, 1, 179.00, 'pending',    '2024-04-28'),
 (118, 11, 5,  1, 59.00,  'cancelled',  '2024-05-03'),
 (119, 12, 1,  2, 198.00, 'delivered',  '2024-05-10'),
 (120, 12, 9,  1, 249.00, 'shipped',    '2024-05-18'),
 (121, 13, 2,  1, 79.00,  'delivered',  '2024-05-25'),
 (122, 13, 6,  1, 129.00, 'delivered',  '2024-06-02'),
 (123, 14, 7,  1, 199.00, 'pending',    '2024-06-08'),
 (124, 15, 11, 1, 109.00, 'delivered',  '2024-06-15'),
 (125, 1,  8,  1, 89.00,  'shipped',    '2024-06-22'),
 (126, 4,  12, 1, 179.00, 'delivered',  '2024-07-01'),
 (127, 7,  10, 1, 219.00, 'shipped',    '2024-07-08'),
 (128, 9,  4,  2, 78.00,  'delivered',  '2024-07-15'),
 (129, 12, 7,  1, 199.00, 'pending',    '2024-07-22'),
 (130, 15, 3,  1, 149.00, 'delivered',  '2024-07-30');

-- warehouse-oriented SQL track tables
INSERT INTO bronze_orders VALUES
 (101, 1, 1,  99.00,  'delivered', 'shopify', '2024-01-10', '2024-01-10 09:10:00', '2024-01-10 09:12:00', 'run_2024_01_10'),
 (102, 1, 3, 149.00,  'delivered', 'shopify', '2024-01-22', '2024-01-22 10:30:00', '2024-01-22 10:31:00', 'run_2024_01_22'),
 (102, 1, 3, 149.00,  'delivered', 'shopify', '2024-01-22', '2024-01-22 10:31:00', '2024-01-22 10:33:00', 'run_2024_01_22_retry'),
 (103, 2, 2,  79.00,  'shipped',   'shopify', '2024-01-28', '2024-01-28 08:20:00', '2024-01-28 08:21:00', 'run_2024_01_28'),
 (104, 3, 4,  39.00,  'cancelled', 'shopify', '2024-02-10', '2024-02-10 12:00:00', '2024-02-10 12:05:00', 'run_2024_02_10'),
 (105, 4, 6, 129.00,  'delivered', 'pos',     '2024-02-15', '2024-02-15 13:00:00', '2024-02-15 13:02:00', 'run_2024_02_15'),
 (106, 5, 1,  99.00,  'delivered', 'pos',     '2024-02-28', '2024-02-28 15:20:00', '2024-02-28 15:24:00', 'run_2024_02_28'),
 (107, 6, 7, 199.00,  'shipped',   'shopify', '2024-03-12', '2024-03-12 11:11:00', '2024-03-12 11:12:00', 'run_2024_03_12'),
 (108, 7, 8,  89.00,  'pending',   'shopify', '2024-03-25', '2024-03-25 16:10:00', '2024-03-25 16:12:00', 'run_2024_03_25'),
 (109, 9, 3, 149.00,  'delivered', 'pos',     '2024-04-08', '2024-04-08 09:00:00', '2024-04-08 09:03:00', 'run_2024_04_08');

INSERT INTO silver_orders VALUES
 (101, 1, 1,  99.00,  'delivered', '2024-01-10', '2024-01-10 09:10:00', 'run_2024_01_10'),
 (102, 1, 3, 149.00,  'delivered', '2024-01-22', '2024-01-22 10:31:00', 'run_2024_01_22_retry'),
 (103, 2, 2,  79.00,  'shipped',   '2024-01-28', '2024-01-28 08:20:00', 'run_2024_01_28'),
 (104, 3, 4,  39.00,  'cancelled', '2024-02-10', '2024-02-10 12:00:00', 'run_2024_02_10'),
 (105, 4, 6, 129.00,  'delivered', '2024-02-15', '2024-02-15 13:00:00', 'run_2024_02_15'),
 (106, 5, 1,  99.00,  'delivered', '2024-02-28', '2024-02-28 15:20:00', 'run_2024_02_28'),
 (107, 6, 7, 199.00,  'shipped',   '2024-03-12', '2024-03-12 11:11:00', 'run_2024_03_12'),
 (108, 7, 8,  89.00,  'pending',   '2024-03-25', '2024-03-25 16:10:00', 'run_2024_03_25');

INSERT INTO dim_customer VALUES
 (1001, 1, 'Alice Johnson', 'alice@email.com', 'Austin',  'TX', 'Consumer', '2023-01-01', '9999-12-31', 1),
 (1002, 2, 'Bob Smith',     'bob@email.com',   'Dallas',  'TX', 'SMB',      '2023-01-01', '9999-12-31', 1),
 (1003, 3, 'Carol Davis',   'carol@email.com', 'Austin',  'TX', 'Consumer', '2023-01-01', '2024-02-01', 0),
 (1004, 3, 'Carol Davis',   'carol@email.com', 'Houston', 'TX', 'Consumer', '2024-02-02', '9999-12-31', 1),
 (1005, 4, 'David Lee',     'david@email.com', 'Houston', 'TX', 'Enterprise','2023-01-01','9999-12-31', 1),
 (1006, 5, 'Eva Martinez',  'eva@email.com',   'Dallas',  'TX', 'SMB',      '2023-01-01', '9999-12-31', 1),
 (1007, 6, 'Frank Wilson',  NULL,              'Seattle', 'WA', 'Consumer', '2023-01-01', '9999-12-31', 1),
 (1008, 7, 'Grace Chen',    'grace@email.com', 'Denver',  'CO', 'Consumer', '2023-01-01', '9999-12-31', 1),
 (1009, 9, 'Isabella White','isabella@email.com','Seattle','WA','Enterprise','2023-01-01','9999-12-31', 1);

INSERT INTO dim_product VALUES
 (2001, 1, 'SQL Fundamentals', 'Education', 'Academy', NULL, 1),
 (2002, 2, 'Python for Data',  'Education', 'Academy', NULL, 1),
 (2003, 3, 'Cloud Lab Pro',    'Lab',       'CloudOps', NULL, 1),
 (2004, 4, 'Data Notebook',    'Tools',     'Workspace', NULL, 1),
 (2005, 6, 'Machine Learning 101', 'Education', 'Academy', NULL, 1),
 (2006, 7, 'Spark Cluster Lab', 'Lab',      'CloudOps', NULL, 1),
 (2007, 8, 'dbt Accelerator',  'Tools',     'Workspace', NULL, 1);

INSERT INTO dim_date VALUES
 ('2024-01-10', '2024-01-10', 'FY24-M01', 'FY24-Q1', 0),
 ('2024-01-22', '2024-01-22', 'FY24-M01', 'FY24-Q1', 0),
 ('2024-01-28', '2024-01-28', 'FY24-M01', 'FY24-Q1', 1),
 ('2024-02-10', '2024-02-10', 'FY24-M02', 'FY24-Q1', 1),
 ('2024-02-15', '2024-02-15', 'FY24-M02', 'FY24-Q1', 0),
 ('2024-02-28', '2024-02-28', 'FY24-M02', 'FY24-Q1', 0),
 ('2024-03-12', '2024-03-12', 'FY24-M03', 'FY24-Q1', 0),
 ('2024-03-25', '2024-03-25', 'FY24-M03', 'FY24-Q1', 0);

INSERT INTO fact_sales VALUES
 (1, 101, '2024-01-10', 1001, 2001, 1,  99.00,  0.00,  99.00, 'run_2024_01_10'),
 (2, 102, '2024-01-22', 1001, 2003, 1, 149.00,  0.00, 149.00, 'run_2024_01_22_retry'),
 (3, 103, '2024-01-28', 1002, 2002, 1,  79.00,  0.00,  79.00, 'run_2024_01_28'),
 (4, 104, '2024-02-10', 1004, 2004, 1,  39.00,  0.00,  39.00, 'run_2024_02_10'),
 (5, 105, '2024-02-15', 1005, 2005, 1, 129.00, 10.00, 119.00, 'run_2024_02_15'),
 (6, 106, '2024-02-28', 1006, 2001, 1,  99.00,  0.00,  99.00, 'run_2024_02_28'),
 (7, 107, '2024-03-12', 1007, 2006, 1, 199.00, 20.00, 179.00, 'run_2024_03_12'),
 (8, 108, '2024-03-25', 1008, 2007, 1,  89.00,  0.00,  89.00, 'run_2024_03_25');

INSERT INTO pipeline_audit VALUES
 ('run_2024_01_10', 'orders_bronze_to_silver', 'success', 1, 1, 0, '2024-01-10'),
 ('run_2024_01_22', 'orders_bronze_to_silver', 'failed',  1, 0, 1, '2024-01-22'),
 ('run_2024_01_22_retry', 'orders_bronze_to_silver', 'success', 2, 1, 0, '2024-01-22'),
 ('run_2024_02_10', 'orders_bronze_to_silver', 'success', 1, 1, 0, '2024-02-10'),
 ('run_2024_03_25', 'orders_bronze_to_silver', 'success', 1, 1, 0, '2024-03-25');

INSERT INTO cdc_events VALUES
 (1, 102, 1, 149.00, 'pending',   'I', '2024-01-22 10:30:00', 10001),
 (2, 102, 1, 149.00, 'delivered', 'U', '2024-01-22 10:31:00', 10002),
 (3, 103, 2,  79.00, 'shipped',   'I', '2024-01-28 08:20:00', 10003),
 (4, 104, 3,  39.00, 'cancelled', 'I', '2024-02-10 12:00:00', 10004),
 (5, 108, 7,  89.00, 'deleted',   'D', '2024-03-26 01:00:00', 10005);

INSERT INTO dim_region VALUES
 (301, 10, 'Texas', 'US', 'South'),
 (302, 20, 'Pacific Northwest', 'US', 'West'),
 (303, 30, 'Mountain', 'US', 'West');

INSERT INTO dim_store VALUES
 (401, 100, 'Austin Flagship', 'Retail', 301, 1),
 (402, 101, 'Dallas Outlet', 'Outlet', 301, 1),
 (403, 102, 'Seattle Digital', 'Online', 302, 1),
 (404, 103, 'Denver Lab Store', 'Retail', 303, 1);

INSERT INTO dim_employee VALUES
 (501, 9001, 'Nora Patel', 'Store Manager', NULL, 301, 1),
 (502, 9002, 'Luis Romero', 'Sales Associate', 501, 301, 1),
 (503, 9003, 'Mina Ito', 'Ops Lead', NULL, 302, 1),
 (504, 9004, 'Andre Fox', 'Inventory Analyst', 503, 303, 1);

INSERT INTO bridge_customer_segment VALUES
 (1001, 1, 'Consumer', '2024-01-01', '9999-12-31', 'primary'),
 (1002, 2, 'SMB', '2024-01-01', '9999-12-31', 'primary'),
 (1005, 3, 'Enterprise', '2024-01-01', '9999-12-31', 'primary'),
 (1005, 4, 'Strategic', '2024-02-01', '9999-12-31', 'secondary');

INSERT INTO fact_inventory VALUES
 (1, '2024-03-25', 401, 2001, 75, 12, 63, 'inv_2024_03_25'),
 (2, '2024-03-25', 401, 2003, 18, 6, 12, 'inv_2024_03_25'),
 (3, '2024-03-25', 402, 2001, 40, 3, 37, 'inv_2024_03_25'),
 (4, '2024-03-25', 403, 2007, 10, 8, 2, 'inv_2024_03_25'),
 (5, '2024-03-26', 401, 2001, 71, 10, 61, 'inv_2024_03_26');

INSERT INTO fact_payments VALUES
 (7001, 101, 1001, '2024-01-10', 'card', 'captured', 99.00, 99.00, 'pay_2024_01_10'),
 (7002, 102, 1001, '2024-01-22', 'card', 'captured', 149.00, 149.00, 'pay_2024_01_22'),
 (7003, 104, 1004, '2024-02-10', 'wallet', 'refunded', 39.00, 0.00, 'pay_2024_02_10'),
 (7004, 105, 1005, '2024-02-15', 'invoice', 'captured', 129.00, 119.00, 'pay_2024_02_15'),
 (7005, 999, 1009, '2024-04-08', 'card', 'captured', 149.00, 149.00, 'pay_orphan_2024_04_08');

INSERT INTO audit_pipeline_execution VALUES
 ('exec_001', 'bronze_orders_ingest', 'success', '2024-03-25 01:00:00', '2024-03-25 01:04:00', 240, 10, 10, 0),
 ('exec_002', 'silver_orders_merge', 'success', '2024-03-25 01:05:00', '2024-03-25 01:08:00', 180, 10, 8, 0),
 ('exec_003', 'gold_sales_publish', 'warning', '2024-03-25 01:10:00', '2024-03-25 01:18:00', 480, 8, 8, 1),
 ('exec_004', 'payments_reconciliation', 'failed', '2024-04-08 02:00:00', '2024-04-08 02:02:00', 120, 5, 4, 1);

INSERT INTO error_deadletter_queue VALUES
 (1, 'run_2024_01_22', 'bronze_orders', '102', 'duplicate_key', 'Duplicate order_id in retry batch', '{"order_id":102}', 1, '2024-01-22 10:35:00'),
 (2, 'pay_orphan_2024_04_08', 'fact_payments', '999', 'orphan_fact', 'Payment references missing order_id', '{"order_id":999}', 0, '2024-04-08 02:02:00'),
 (3, 'gold_sales_publish', 'fact_sales', 'customer_key:null', 'null_business_key', 'Customer key missing after dimension lookup', '{"customer_id":9}', 2, '2024-04-08 09:05:00');

-- employees (manager_id is NULL for top-level managers)
INSERT INTO employees VALUES
 (1,  'Sarah Mitchell',  'Engineering', 135000.00, NULL, '2019-03-01'),
 (2,  'Tom Baker',       'Engineering', 120000.00, 1,    '2020-06-15'),
 (3,  'Amy Nguyen',      'Engineering', 115000.00, 1,    '2020-09-01'),
 (4,  'Chris Kim',       'Engineering', 98000.00,  2,    '2021-02-20'),
 (5,  'Dana Patel',      'Engineering', 95000.00,  2,    '2021-04-10'),
 (6,  'Eric Johnson',    'Engineering', 88000.00,  3,    '2022-01-15'),
 (7,  'Fiona Lee',       'Engineering', 82000.00,  3,    '2022-07-01'),
 (8,  'George Wang',     'Sales',       140000.00, NULL, '2018-11-01'),
 (9,  'Hannah Davis',    'Sales',       95000.00,  8,    '2020-03-15'),
 (10, 'Ivan Cruz',       'Sales',       87000.00,  8,    '2020-08-20'),
 (11, 'Julia Adams',     'Sales',       78000.00,  9,    '2021-06-01'),
 (12, 'Kevin Brown',     'Sales',       72000.00,  9,    '2022-02-14'),
 (13, 'Laura Chen',      'Marketing',   118000.00, NULL, '2019-07-01'),
 (14, 'Michael Park',    'Marketing',   92000.00,  13,   '2021-01-10'),
 (15, 'Nina Rodriguez',  'Marketing',   86000.00,  13,   '2021-09-05'),
 (16, 'Oscar Thompson',  'Marketing',   74000.00,  14,   '2022-11-01'),
 (17, 'Paula White',     'Support',     98000.00,  NULL, '2019-05-15'),
 (18, 'Quinn Harris',    'Support',     68000.00,  17,   '2021-03-20'),
 (19, 'Rachel Torres',   'Support',     65000.00,  17,   '2022-08-01'),
 (20, 'Sam Wilson',      'Support',     62000.00,  17,   '2023-01-15');

-- events (30 rows — streaming analytics)
INSERT INTO events VALUES
 (1,  1,  'page_view', '/home',           'sess_a1', '2024-01-10 09:12:00', 45),
 (2,  1,  'click',     '/products',       'sess_a1', '2024-01-10 09:12:48', 3),
 (3,  2,  'page_view', '/home',           'sess_b1', '2024-01-15 14:05:00', 60),
 (4,  2,  'search',    '/search?q=sql',   'sess_b1', '2024-01-15 14:06:10', 12),
 (5,  2,  'purchase',  '/checkout',       'sess_b1', '2024-01-15 14:08:30', 90),
 (6,  3,  'page_view', '/products',       'sess_c1', '2024-02-02 11:00:00', 30),
 (7,  3,  'click',     '/products/1',     'sess_c1', '2024-02-02 11:00:45', 5),
 (8,  4,  'sign_up',   '/register',       'sess_d1', '2024-02-14 16:30:00', 120),
 (9,  4,  'page_view', '/dashboard',      'sess_d1', '2024-02-14 16:32:15', 55),
 (10, 5,  'page_view', '/home',           'sess_e1', '2024-03-01 08:45:00', 40),
 (11, 5,  'click',     '/blog/sql-tips',  'sess_e1', '2024-03-01 08:45:45', 8),
 (12, 5,  'page_view', '/blog/sql-tips',  'sess_e1', '2024-03-01 08:46:00', 180),
 (13, 6,  'page_view', '/pricing',        'sess_f1', '2024-03-10 13:20:00', 95),
 (14, 7,  'page_view', '/home',           'sess_g1', '2024-03-18 10:05:00', 35),
 (15, 7,  'search',    '/search?q=spark', 'sess_g1', '2024-03-18 10:05:40', 18),
 (16, 8,  'page_view', '/products',       'sess_h1', '2024-04-02 15:15:00', 50),
 (17, 9,  'page_view', '/home',           'sess_i1', '2024-04-08 09:30:00', 28),
 (18, 9,  'purchase',  '/checkout',       'sess_i1', '2024-04-08 09:35:10', 75),
 (19, 10, 'page_view', '/blog',           'sess_j1', '2024-04-22 12:00:00', 90),
 (20, 10, 'click',     '/blog/dbt-guide', 'sess_j1', '2024-04-22 12:01:35', 7),
 (21, 1,  'page_view', '/dashboard',      'sess_a2', '2024-05-07 11:20:00', 65),
 (22, 1,  'click',     '/account',        'sess_a2', '2024-05-07 11:21:10', 4),
 (23, 11, 'page_view', '/home',           'sess_k1', '2024-05-15 14:45:00', 22),
 (24, 12, 'page_view', '/products',       'sess_l1', '2024-05-20 10:10:00', 48),
 (25, 12, 'purchase',  '/checkout',       'sess_l1', '2024-05-20 10:14:30', 110),
 (26, 13, 'page_view', '/home',           'sess_m1', '2024-06-02 09:00:00', 33),
 (27, 13, 'search',    '/search?q=kafka', 'sess_m1', '2024-06-02 09:01:05', 15),
 (28, 14, 'sign_up',   '/register',       'sess_n1', '2024-06-08 17:30:00', 130),
 (29, 15, 'page_view', '/pricing',        'sess_o1', '2024-07-01 10:55:00', 70),
 (30, 15, 'logout',    '/logout',         'sess_o1', '2024-07-01 11:10:00', 2);

-- shipments (25 rows — logistics tracking)
INSERT INTO shipments VALUES
 (201, 101, 'FedEx', 'FX0000101', 'delivered',  '2024-01-11', '2024-01-14'),
 (202, 102, 'UPS',   'UP0000102', 'delivered',  '2024-01-23', '2024-01-26'),
 (203, 103, 'USPS',  'US0000103', 'delivered',  '2024-01-29', '2024-02-02'),
 (204, 104, 'FedEx', 'FX0000104', 'in_transit', '2024-02-05', NULL),
 (205, 105, 'DHL',   'DH0000105', 'returned',   '2024-02-11', '2024-02-18'),
 (206, 106, 'UPS',   'UP0000106', 'delivered',  '2024-02-16', '2024-02-19'),
 (207, 107, 'FedEx', 'FX0000107', 'in_transit', '2024-02-21', NULL),
 (208, 108, 'USPS',  'US0000108', 'delivered',  '2024-03-01', '2024-03-04'),
 (209, 109, 'UPS',   'UP0000109', 'delivered',  '2024-03-06', '2024-03-09'),
 (210, 110, 'DHL',   'DH0000110', 'in_transit', '2024-03-13', NULL),
 (211, 111, 'FedEx', 'FX0000111', 'delivered',  '2024-03-19', '2024-03-22'),
 (212, 112, 'FedEx', 'FX0000112', 'processing', NULL,         NULL),
 (213, 113, 'UPS',   'UP0000113', 'returned',   '2024-04-03', '2024-04-10'),
 (214, 114, 'USPS',  'US0000114', 'delivered',  '2024-04-09', '2024-04-13'),
 (215, 115, 'DHL',   'DH0000115', 'in_transit', '2024-04-16', NULL),
 (216, 116, 'FedEx', 'FX0000116', 'delivered',  '2024-04-23', '2024-04-26'),
 (217, 117, 'UPS',   'UP0000117', 'processing', NULL,         NULL),
 (218, 118, 'USPS',  'US0000118', 'returned',   '2024-05-04', '2024-05-09'),
 (219, 119, 'DHL',   'DH0000119', 'delivered',  '2024-05-11', '2024-05-15'),
 (220, 120, 'FedEx', 'FX0000120', 'in_transit', '2024-05-19', NULL),
 (221, 121, 'UPS',   'UP0000121', 'delivered',  '2024-05-26', '2024-05-29'),
 (222, 122, 'USPS',  'US0000122', 'delivered',  '2024-06-03', '2024-06-07'),
 (223, 123, 'DHL',   'DH0000123', 'processing', NULL,         NULL),
 (224, 124, 'FedEx', 'FX0000124', 'delivered',  '2024-06-16', '2024-06-19'),
 (225, 125, 'UPS',   'UP0000125', 'in_transit', '2024-06-23', NULL);

-- inventory (20 rows — warehouse stock levels)
INSERT INTO inventory VALUES
 (1,  1,  'East',    120, 30, '2024-03-15'),
 (2,  1,  'West',     30, 30, '2024-01-10'),
 (3,  2,  'East',    180, 40, '2024-04-01'),
 (4,  2,  'Central',  20, 40, '2024-02-20'),
 (5,  3,  'East',     55, 20, '2024-05-10'),
 (6,  3,  'West',     25, 20, '2024-03-05'),
 (7,  4,  'Central', 400, 50, '2024-06-01'),
 (8,  5,  'East',    210, 50, '2024-05-25'),
 (9,  5,  'South',    90, 50, '2024-04-18'),
 (10, 6,  'West',    100, 25, '2024-03-30'),
 (11, 7,  'East',     40, 15, '2024-06-15'),
 (12, 7,  'Central',  20, 15, '2024-05-01'),
 (13, 8,  'East',    160, 35, '2024-04-10'),
 (14, 9,  'Central',  28, 10, '2024-07-01'),
 (15, 10, 'West',     42, 20, '2024-06-20'),
 (16, 11, 'East',     85, 25, '2024-05-15'),
 (17, 11, 'South',    15, 25, '2024-02-28'),
 (18, 12, 'East',     55, 20, '2024-06-05'),
 (19, 12, 'West',     15, 20, '2024-04-22'),
 (20, 6,  'South',    20, 25, '2024-07-10');

-- transactions (40 rows across 12 months)
INSERT INTO transactions VALUES
 (1001, 1,  99.00,  '2024-01-05', 'credit_card'),
 (1002, 2,  149.00, '2024-01-08', 'paypal'),
 (1003, 3,  39.00,  '2024-01-12', 'debit_card'),
 (1004, 4,  259.00, '2024-01-18', 'credit_card'),
 (1005, 5,  89.00,  '2024-01-25', 'bank_transfer'),
 (1006, 6,  199.00, '2024-02-02', 'credit_card'),
 (1007, 7,  79.00,  '2024-02-09', 'paypal'),
 (1008, 8,  219.00, '2024-02-14', 'debit_card'),
 (1009, 9,  149.00, '2024-02-20', 'credit_card'),
 (1010, 10, 117.00, '2024-02-28', 'bank_transfer'),
 (1011, 1,  89.00,  '2024-03-04', 'credit_card'),
 (1012, 11, 59.00,  '2024-03-10', 'paypal'),
 (1013, 12, 198.00, '2024-03-17', 'credit_card'),
 (1014, 13, 79.00,  '2024-03-22', 'debit_card'),
 (1015, 14, 199.00, '2024-03-29', 'bank_transfer'),
 (1016, 15, 109.00, '2024-04-05', 'credit_card'),
 (1017, 2,  118.00, '2024-04-11', 'paypal'),
 (1018, 4,  249.00, '2024-04-18', 'credit_card'),
 (1019, 7,  89.00,  '2024-04-25', 'debit_card'),
 (1020, 9,  258.00, '2024-05-01', 'credit_card'),
 (1021, 1,  99.00,  '2024-05-07', 'bank_transfer'),
 (1022, 5,  109.00, '2024-05-13', 'credit_card'),
 (1023, 10, 179.00, '2024-05-20', 'paypal'),
 (1024, 12, 249.00, '2024-05-27', 'debit_card'),
 (1025, 13, 129.00, '2024-06-03', 'credit_card'),
 (1026, 15, 109.00, '2024-06-10', 'bank_transfer'),
 (1027, 4,  179.00, '2024-06-17', 'credit_card'),
 (1028, 7,  219.00, '2024-07-01', 'paypal'),
 (1029, 9,  78.00,  '2024-07-08', 'credit_card'),
 (1030, 12, 199.00, '2024-07-15', 'debit_card'),
 (1031, 1,  149.00, '2024-08-01', 'credit_card'),
 (1032, 2,  99.00,  '2024-08-08', 'bank_transfer'),
 (1033, 5,  199.00, '2024-08-15', 'credit_card'),
 (1034, 6,  179.00, '2024-08-22', 'paypal'),
 (1035, 10, 149.00, '2024-09-05', 'credit_card'),
 (1036, 13, 79.00,  '2024-09-12', 'debit_card'),
 (1037, 4,  249.00, '2024-10-01', 'credit_card'),
 (1038, 9,  149.00, '2024-10-15', 'bank_transfer'),
 (1039, 12, 199.00, '2024-11-01', 'credit_card'),
 (1040, 15, 89.00,  '2024-11-18', 'paypal');
`;

// Used for schema display in the UI and for error hints ("available columns: ...")
export const TABLE_SCHEMAS = {
  customers: {
    columns: ['customer_id', 'customer_name', 'email', 'city', 'state', 'status', 'created_at'],
    types:   ['INTEGER',     'TEXT',           'TEXT',  'TEXT', 'TEXT',  'TEXT',   'TEXT'],
    pk:      'customer_id',
    rowCount: 15,
    note:    '15 customers across 5 cities — includes NULL emails and inactive/suspended statuses',
  },
  products: {
    columns: ['product_id', 'product_name', 'category', 'price', 'stock_quantity'],
    types:   ['INTEGER',    'TEXT',          'TEXT',     'REAL',  'INTEGER'],
    pk:      'product_id',
    rowCount: 12,
    note:    '12 products in 4 categories (Education, Lab, Tools, Cloud) — prices $39–$249',
  },
  bronze_orders: {
    columns: ['order_id', 'customer_id', 'product_id', 'amount', 'status', 'source_system', 'created_at', 'updated_at', 'ingestion_ts', 'pipeline_run_id'],
    types:   ['INTEGER',  'INTEGER',     'INTEGER',    'REAL',   'TEXT',   'TEXT',          'TEXT',       'TEXT',       'TEXT',         'TEXT'],
    rowCount: 10,
    note:    'Raw order landing table with duplicate retry rows, source metadata, and ingestion timestamps',
  },
  silver_orders: {
    columns: ['order_id', 'customer_id', 'product_id', 'amount', 'status', 'created_at', 'updated_at', 'pipeline_run_id'],
    types:   ['INTEGER',  'INTEGER',     'INTEGER',    'REAL',   'TEXT',   'TEXT',       'TEXT',       'TEXT'],
    pk:      'order_id',
    rowCount: 8,
    note:    'Deduplicated Silver orders after Bronze cleanup and incremental merge',
  },
  dim_customer: {
    columns: ['customer_key', 'customer_id', 'customer_name', 'email', 'city', 'state', 'segment', 'effective_start_date', 'effective_end_date', 'is_current'],
    types:   ['INTEGER',      'INTEGER',     'TEXT',          'TEXT',  'TEXT', 'TEXT',  'TEXT',    'TEXT',                 'TEXT',               'INTEGER'],
    pk:      'customer_key',
    rowCount: 9,
    note:    'SCD Type 2 customer dimension with surrogate keys and current-row flag',
  },
  dim_product: {
    columns: ['product_key', 'product_id', 'product_name', 'category', 'brand', 'parent_product_key', 'is_current'],
    types:   ['INTEGER',     'INTEGER',    'TEXT',         'TEXT',     'TEXT',  'INTEGER',            'INTEGER'],
    pk:      'product_key',
    rowCount: 7,
    note:    'Conformed product dimension used by the sales fact and BI marts',
  },
  dim_date: {
    columns: ['date_key', 'calendar_date', 'fiscal_month', 'fiscal_quarter', 'is_weekend'],
    types:   ['TEXT',     'TEXT',          'TEXT',         'TEXT',           'INTEGER'],
    pk:      'date_key',
    rowCount: 8,
    note:    'Conformed date dimension with fiscal calendar attributes',
  },
  fact_sales: {
    columns: ['sales_id', 'order_id', 'date_key', 'customer_key', 'product_key', 'quantity', 'gross_sales', 'discount_amount', 'net_sales', 'pipeline_run_id'],
    types:   ['INTEGER',  'INTEGER',  'TEXT',     'INTEGER',      'INTEGER',     'INTEGER',  'REAL',        'REAL',            'REAL',      'TEXT'],
    pk:      'sales_id',
    fks:     { date_key: 'dim_date.date_key', customer_key: 'dim_customer.customer_key', product_key: 'dim_product.product_key' },
    rowCount: 8,
    note:    'Gold sales fact at order-product grain with additive revenue measures',
  },
  pipeline_audit: {
    columns: ['run_id', 'pipeline_name', 'status', 'source_count', 'target_count', 'error_count', 'run_date'],
    types:   ['TEXT',   'TEXT',          'TEXT',   'INTEGER',      'INTEGER',      'INTEGER',     'TEXT'],
    pk:      'run_id',
    rowCount: 5,
    note:    'Pipeline control table for run status, reconciliation counts, and operational debugging',
  },
  cdc_events: {
    columns: ['event_id', 'order_id', 'customer_id', 'amount', 'status', 'op_type', 'event_ts', 'source_lsn'],
    types:   ['INTEGER',  'INTEGER',  'INTEGER',     'REAL',   'TEXT',   'TEXT',    'TEXT',     'INTEGER'],
    pk:      'event_id',
    rowCount: 5,
    note:    'CDC event stream with insert/update/delete operations and source ordering',
  },
  dim_region: {
    columns: ['region_key', 'region_id', 'region_name', 'country', 'territory'],
    types:   ['INTEGER',    'INTEGER',   'TEXT',        'TEXT',    'TEXT'],
    pk:      'region_key',
    rowCount: 3,
    note:    'Conformed geography dimension used by stores, employees, and regional marts',
  },
  dim_store: {
    columns: ['store_key', 'store_id', 'store_name', 'store_type', 'region_key', 'is_current'],
    types:   ['INTEGER',   'INTEGER',  'TEXT',       'TEXT',       'INTEGER',    'INTEGER'],
    pk:      'store_key',
    fks:     { region_key: 'dim_region.region_key' },
    rowCount: 4,
    note:    'Store dimension for inventory and retail performance reporting',
  },
  dim_employee: {
    columns: ['employee_key', 'employee_id', 'employee_name', 'role', 'manager_key', 'region_key', 'is_current'],
    types:   ['INTEGER',      'INTEGER',     'TEXT',          'TEXT', 'INTEGER',     'INTEGER',    'INTEGER'],
    pk:      'employee_key',
    fks:     { manager_key: 'dim_employee.employee_key', region_key: 'dim_region.region_key' },
    rowCount: 4,
    note:    'Employee dimension with manager hierarchy and regional ownership',
  },
  bridge_customer_segment: {
    columns: ['customer_key', 'segment_key', 'segment_name', 'effective_start_date', 'effective_end_date', 'priority'],
    types:   ['INTEGER',      'INTEGER',     'TEXT',         'TEXT',                 'TEXT',               'TEXT'],
    fks:     { customer_key: 'dim_customer.customer_key' },
    rowCount: 4,
    note:    'Bridge table for multi-segment customer membership without duplicating facts',
  },
  fact_inventory: {
    columns: ['inventory_id', 'snapshot_date', 'store_key', 'product_key', 'on_hand_qty', 'reserved_qty', 'available_qty', 'pipeline_run_id'],
    types:   ['INTEGER',      'TEXT',          'INTEGER',   'INTEGER',     'INTEGER',     'INTEGER',      'INTEGER',       'TEXT'],
    pk:      'inventory_id',
    fks:     { store_key: 'dim_store.store_key', product_key: 'dim_product.product_key' },
    rowCount: 5,
    note:    'Daily inventory snapshot fact for availability, stockout, and replenishment analysis',
  },
  fact_payments: {
    columns: ['payment_id', 'order_id', 'customer_key', 'payment_date', 'payment_method', 'payment_status', 'authorized_amount', 'captured_amount', 'pipeline_run_id'],
    types:   ['INTEGER',    'INTEGER',  'INTEGER',      'TEXT',         'TEXT',           'TEXT',           'REAL',              'REAL',            'TEXT'],
    pk:      'payment_id',
    fks:     { customer_key: 'dim_customer.customer_key' },
    rowCount: 5,
    note:    'Payment fact with one intentional orphan order for production debugging practice',
  },
  audit_pipeline_execution: {
    columns: ['execution_id', 'pipeline_name', 'status', 'started_at', 'ended_at', 'duration_seconds', 'rows_read', 'rows_written', 'error_count'],
    types:   ['TEXT',         'TEXT',          'TEXT',   'TEXT',       'TEXT',     'INTEGER',          'INTEGER',   'INTEGER',      'INTEGER'],
    pk:      'execution_id',
    rowCount: 4,
    note:    'Enterprise pipeline execution audit with timing, throughput, and error metrics',
  },
  error_deadletter_queue: {
    columns: ['error_id', 'pipeline_run_id', 'source_table', 'business_key', 'error_type', 'error_message', 'payload', 'retry_count', 'created_at'],
    types:   ['INTEGER',  'TEXT',            'TEXT',         'TEXT',         'TEXT',       'TEXT',          'TEXT',    'INTEGER',     'TEXT'],
    pk:      'error_id',
    rowCount: 3,
    note:    'Dead-letter queue for bad records, retry strategy, and incident root-cause analysis',
  },
  orders: {
    columns: ['order_id', 'customer_id', 'product_id', 'quantity', 'amount', 'status', 'created_at'],
    types:   ['INTEGER',  'INTEGER',      'INTEGER',    'INTEGER',  'REAL',   'TEXT',   'TEXT'],
    pk:      'order_id',
    fks:     { customer_id: 'customers.customer_id', product_id: 'products.product_id' },
    rowCount: 30,
    note:    '30 orders Jan–Jul 2024 — statuses: pending, shipped, delivered, cancelled, refunded',
  },
  employees: {
    columns: ['employee_id', 'employee_name', 'department', 'salary', 'manager_id', 'hire_date'],
    types:   ['INTEGER',     'TEXT',           'TEXT',       'REAL',   'INTEGER',    'TEXT'],
    pk:      'employee_id',
    fks:     { manager_id: 'employees.employee_id' },
    rowCount: 20,
    note:    '20 employees across 4 departments — self-referential manager hierarchy, salaries $62k–$140k',
  },
  transactions: {
    columns: ['transaction_id', 'customer_id', 'amount', 'transaction_date', 'payment_method'],
    types:   ['INTEGER',        'INTEGER',      'REAL',   'TEXT',             'TEXT'],
    pk:      'transaction_id',
    fks:     { customer_id: 'customers.customer_id' },
    rowCount: 40,
    note:    '40 transactions Jan–Nov 2024 — 4 payment methods, multiple transactions per customer',
  },
  events: {
    columns: ['event_id', 'user_id', 'event_type', 'page_url', 'session_id', 'occurred_at', 'duration_seconds'],
    types:   ['INTEGER',  'INTEGER', 'TEXT',        'TEXT',     'TEXT',       'TEXT',         'INTEGER'],
    pk:      'event_id',
    fks:     { user_id: 'customers.customer_id' },
    rowCount: 30,
    note:    '30 web analytics events — types: page_view, click, search, purchase, sign_up, logout',
  },
  shipments: {
    columns: ['shipment_id', 'order_id', 'carrier', 'tracking_num', 'status', 'shipped_at', 'delivered_at'],
    types:   ['INTEGER',     'INTEGER',  'TEXT',     'TEXT',         'TEXT',   'TEXT',        'TEXT'],
    pk:      'shipment_id',
    fks:     { order_id: 'orders.order_id' },
    rowCount: 25,
    note:    '25 shipments for orders 101–125 — carriers: FedEx, UPS, USPS, DHL; NULL delivered_at means in-flight',
  },
  inventory: {
    columns: ['inventory_id', 'product_id', 'warehouse', 'quantity', 'reorder_level', 'last_restocked'],
    types:   ['INTEGER',      'INTEGER',    'TEXT',       'INTEGER',  'INTEGER',       'TEXT'],
    pk:      'inventory_id',
    fks:     { product_id: 'products.product_id' },
    rowCount: 20,
    note:    '20 inventory records across 4 warehouses (East, West, Central, South) — low quantity rows exist for reorder analysis',
  },
};
