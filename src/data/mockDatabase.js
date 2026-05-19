// Mock relational tables for the SQL playground.
// Practice tasks use these table/column names to generate realistic results.

export const MOCK_DB = {
  customers: {
    columns: ['customer_id', 'customer_name', 'city', 'status'],
    rows: [
      { customer_id: 1, customer_name: 'Alice Johnson', city: 'Austin',  status: 'active'   },
      { customer_id: 2, customer_name: 'Bob Smith',     city: 'Dallas',  status: 'active'   },
      { customer_id: 3, customer_name: 'Carol Davis',   city: 'Austin',  status: 'inactive' },
      { customer_id: 4, customer_name: 'David Lee',     city: 'Houston', status: 'active'   },
      { customer_id: 5, customer_name: 'Eva Martinez',  city: 'Dallas',  status: 'active'   },
    ],
  },
  orders: {
    columns: ['order_id', 'customer_id', 'amount', 'status', 'created_at'],
    rows: [
      { order_id: 101, customer_id: 1, amount: 150, status: 'shipped',   created_at: '2024-01-15' },
      { order_id: 102, customer_id: 2, amount:  89, status: 'pending',   created_at: '2024-01-16' },
      { order_id: 103, customer_id: 1, amount: 230, status: 'shipped',   created_at: '2024-01-17' },
      { order_id: 104, customer_id: 3, amount:  55, status: 'cancelled', created_at: '2024-01-18' },
      { order_id: 105, customer_id: 4, amount: 320, status: 'shipped',   created_at: '2024-01-19' },
    ],
  },
  products: {
    columns: ['product_id', 'product_name', 'category', 'price'],
    rows: [
      { product_id: 1, product_name: 'SQL Course',    category: 'Education', price:  99 },
      { product_id: 2, product_name: 'Python Basics', category: 'Education', price:  79 },
      { product_id: 3, product_name: 'Cloud Lab',     category: 'Lab',       price: 149 },
      { product_id: 4, product_name: 'Data Notebook', category: 'Tools',     price:  39 },
      { product_id: 5, product_name: 'Pipeline Kit',  category: 'Tools',     price:  59 },
    ],
  },
};
