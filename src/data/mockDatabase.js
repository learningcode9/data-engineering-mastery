// Mock relational tables for the SQL playground.
// Realistic data for practice challenges across 5 tables.

export const MOCK_DB = {
  customers: {
    columns: ['customer_id', 'customer_name', 'city', 'status', 'signup_date'],
    rows: [
      { customer_id: 1, customer_name: 'Alice Johnson', city: 'Austin',  status: 'active',   signup_date: '2023-01-10' },
      { customer_id: 2, customer_name: 'Bob Smith',     city: 'Dallas',  status: 'active',   signup_date: '2023-02-15' },
      { customer_id: 3, customer_name: 'Carol Davis',   city: 'Austin',  status: 'inactive', signup_date: '2023-03-05' },
      { customer_id: 4, customer_name: 'David Lee',     city: 'Houston', status: 'active',   signup_date: '2023-04-20' },
      { customer_id: 5, customer_name: 'Eva Martinez',  city: 'Dallas',  status: 'active',   signup_date: '2023-05-11' },
      { customer_id: 6, customer_name: 'Frank Chen',    city: 'Austin',  status: 'inactive', signup_date: '2023-06-01' },
      { customer_id: 7, customer_name: 'Grace Kim',     city: 'Houston', status: 'active',   signup_date: '2023-07-22' },
    ],
  },
  orders: {
    columns: ['order_id', 'customer_id', 'amount', 'status', 'created_at'],
    rows: [
      { order_id: 101, customer_id: 1, amount: 150,  status: 'shipped',   created_at: '2024-01-15' },
      { order_id: 102, customer_id: 2, amount:  89,  status: 'pending',   created_at: '2024-01-16' },
      { order_id: 103, customer_id: 1, amount: 230,  status: 'shipped',   created_at: '2024-01-17' },
      { order_id: 104, customer_id: 3, amount:  55,  status: 'cancelled', created_at: '2024-01-18' },
      { order_id: 105, customer_id: 4, amount: 320,  status: 'shipped',   created_at: '2024-01-19' },
      { order_id: 106, customer_id: 2, amount: 175,  status: 'shipped',   created_at: '2024-01-20' },
      { order_id: 107, customer_id: 5, amount:  42,  status: 'pending',   created_at: '2024-01-21' },
      { order_id: 108, customer_id: 4, amount: 200,  status: 'shipped',   created_at: '2024-01-22' },
      { order_id: 109, customer_id: 1, amount:  95,  status: 'pending',   created_at: '2024-01-23' },
      { order_id: 110, customer_id: 7, amount: 410,  status: 'shipped',   created_at: '2024-01-24' },
    ],
  },
  products: {
    columns: ['product_id', 'product_name', 'category', 'price', 'stock'],
    rows: [
      { product_id: 1, product_name: 'SQL Course',       category: 'Education', price:  99, stock: 100 },
      { product_id: 2, product_name: 'Python Basics',    category: 'Education', price:  79, stock: 100 },
      { product_id: 3, product_name: 'Cloud Lab',        category: 'Lab',       price: 149, stock:  50 },
      { product_id: 4, product_name: 'Data Notebook',    category: 'Tools',     price:  39, stock: 200 },
      { product_id: 5, product_name: 'Pipeline Kit',     category: 'Tools',     price:  59, stock: 150 },
      { product_id: 6, product_name: 'Spark Mastery',    category: 'Education', price: 129, stock:  75 },
      { product_id: 7, product_name: 'Interview Prep',   category: 'Education', price:  49, stock: 200 },
      { product_id: 8, product_name: 'Delta Lake Guide', category: 'Lab',       price:  89, stock:  60 },
    ],
  },
  employees: {
    columns: ['employee_id', 'name', 'department', 'salary', 'manager_id'],
    rows: [
      { employee_id: 1, name: 'Sarah Wong',   department: 'Engineering', salary: 120000, manager_id: null },
      { employee_id: 2, name: 'James Park',   department: 'Engineering', salary:  95000, manager_id: 1    },
      { employee_id: 3, name: 'Maria Santos', department: 'Data',        salary: 110000, manager_id: 1    },
      { employee_id: 4, name: 'Tom Bradley',  department: 'Data',        salary:  88000, manager_id: 3    },
      { employee_id: 5, name: 'Lisa Chen',    department: 'Analytics',   salary: 105000, manager_id: 1    },
      { employee_id: 6, name: 'Chris Murphy', department: 'Analytics',   salary:  92000, manager_id: 5    },
      { employee_id: 7, name: 'Priya Patel',  department: 'Engineering', salary: 115000, manager_id: 1    },
      { employee_id: 8, name: 'Derek Wilson', department: 'Data',        salary:  78000, manager_id: 3    },
    ],
  },
  pipeline_runs: {
    columns: ['run_id', 'pipeline_name', 'status', 'rows_processed', 'duration_secs', 'run_date'],
    rows: [
      { run_id:  1, pipeline_name: 'orders_etl',     status: 'success', rows_processed: 15420, duration_secs: 45, run_date: '2024-01-15' },
      { run_id:  2, pipeline_name: 'customers_sync', status: 'success', rows_processed:  3201, duration_secs: 12, run_date: '2024-01-15' },
      { run_id:  3, pipeline_name: 'orders_etl',     status: 'failed',  rows_processed:     0, duration_secs:  3, run_date: '2024-01-16' },
      { run_id:  4, pipeline_name: 'products_load',  status: 'success', rows_processed:   850, duration_secs:  8, run_date: '2024-01-16' },
      { run_id:  5, pipeline_name: 'orders_etl',     status: 'success', rows_processed: 16001, duration_secs: 48, run_date: '2024-01-17' },
      { run_id:  6, pipeline_name: 'customers_sync', status: 'failed',  rows_processed:     0, duration_secs:  2, run_date: '2024-01-17' },
      { run_id:  7, pipeline_name: 'products_load',  status: 'success', rows_processed:   851, duration_secs:  9, run_date: '2024-01-18' },
      { run_id:  8, pipeline_name: 'orders_etl',     status: 'success', rows_processed: 14900, duration_secs: 42, run_date: '2024-01-18' },
      { run_id:  9, pipeline_name: 'customers_sync', status: 'success', rows_processed:  3300, duration_secs: 13, run_date: '2024-01-19' },
      { run_id: 10, pipeline_name: 'orders_etl',     status: 'success', rows_processed: 17200, duration_secs: 51, run_date: '2024-01-19' },
    ],
  },
};
