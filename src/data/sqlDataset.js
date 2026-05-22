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
