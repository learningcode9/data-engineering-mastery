export const DIFF_STYLE = {
  beginner:     { bg: '#d1fae520', color: '#4ade80', border: '#16653040' },
  intermediate: { bg: '#fef3c720', color: '#fcd34d', border: '#92400e40' },
  advanced:     { bg: '#fee2e220', color: '#fca5a5', border: '#991b1b40' },
};

export const COL_TYPES = {
  customer_id: 'INT PK', customer_name: 'VARCHAR', city: 'VARCHAR', status: 'VARCHAR', signup_date: 'DATE',
  order_id: 'INT PK', amount: 'DECIMAL', created_at: 'DATE',
  product_id: 'INT PK', product_name: 'VARCHAR', category: 'VARCHAR', price: 'DECIMAL', stock: 'INT',
  employee_id: 'INT PK', name: 'VARCHAR', department: 'VARCHAR', salary: 'DECIMAL', manager_id: 'INT FK',
  run_id: 'INT PK', pipeline_name: 'VARCHAR', rows_processed: 'INT', duration_secs: 'INT', run_date: 'DATE',
  source_system: 'VARCHAR', updated_at: 'TIMESTAMP', ingestion_ts: 'TIMESTAMP', pipeline_run_id: 'VARCHAR',
  source_count: 'INT', target_count: 'INT', error_count: 'INT',
  customer_key: 'INT PK', email: 'VARCHAR', state: 'VARCHAR', segment: 'VARCHAR',
  effective_start_date: 'DATE', effective_end_date: 'DATE', is_current: 'BOOLEAN',
  product_key: 'INT PK', brand: 'VARCHAR', parent_product_key: 'INT FK',
  date_key: 'DATE PK', calendar_date: 'DATE', fiscal_month: 'VARCHAR', fiscal_quarter: 'VARCHAR', is_weekend: 'BOOLEAN',
  sales_id: 'INT PK', quantity: 'INT', gross_sales: 'DECIMAL', discount_amount: 'DECIMAL', net_sales: 'DECIMAL',
  event_id: 'INT PK', op_type: 'VARCHAR', event_ts: 'TIMESTAMP', source_lsn: 'INT',
  inventory_id: 'INT PK', store_key: 'INT FK', region_key: 'INT FK', snapshot_date: 'DATE', on_hand_qty: 'INT', reserved_qty: 'INT', available_qty: 'INT',
  payment_id: 'INT PK', payment_date: 'DATE', payment_method: 'VARCHAR', payment_status: 'VARCHAR', authorized_amount: 'DECIMAL', captured_amount: 'DECIMAL',
  employee_key: 'INT PK', employee_id: 'INT', employee_name: 'VARCHAR', role: 'VARCHAR', manager_key: 'INT FK',
  store_id: 'INT', store_name: 'VARCHAR', store_type: 'VARCHAR', region_id: 'INT',
  region_name: 'VARCHAR', country: 'VARCHAR', territory: 'VARCHAR',
  segment_key: 'INT FK', segment_name: 'VARCHAR', priority: 'VARCHAR',
  execution_id: 'VARCHAR PK', started_at: 'TIMESTAMP', ended_at: 'TIMESTAMP', duration_seconds: 'INT', rows_read: 'INT', rows_written: 'INT',
  error_id: 'INT PK', source_table: 'VARCHAR', business_key: 'VARCHAR', error_type: 'VARCHAR', error_message: 'VARCHAR', payload: 'VARCHAR', retry_count: 'INT',
};
