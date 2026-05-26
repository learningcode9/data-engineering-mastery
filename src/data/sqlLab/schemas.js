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
};
