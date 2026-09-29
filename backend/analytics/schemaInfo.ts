// Static description of the analytics schema, used both to prompt the LLM and to power
// the Data Explorer / Settings pages. Kept hand-written (rather than introspected) so the
// AI is only ever told about the tables it is allowed to query.

export interface ColumnInfo {
  name: string
  type: string
  description: string
}

export interface TableInfo {
  name: string
  description: string
  columns: ColumnInfo[]
}

export const SCHEMA_TABLES: TableInfo[] = [
  {
    name: 'customers',
    description: 'Customers who place orders.',
    columns: [
      { name: 'id', type: 'integer', description: 'Primary key.' },
      { name: 'name', type: 'text', description: 'Customer full name.' },
      { name: 'email', type: 'text', description: 'Customer email address.' },
      { name: 'region', type: 'text', description: 'One of North, South, East, West.' },
      { name: 'created_at', type: 'timestamptz', description: 'When the customer record was created.' },
    ],
  },
  {
    name: 'products',
    description: 'Products available for sale.',
    columns: [
      { name: 'id', type: 'integer', description: 'Primary key.' },
      { name: 'name', type: 'text', description: 'Product name.' },
      { name: 'category', type: 'text', description: 'One of Electronics, Home & Kitchen, Fashion, Sports, Books.' },
      { name: 'price', type: 'numeric', description: 'Unit sale price.' },
      { name: 'cost', type: 'numeric', description: 'Unit cost to the business.' },
      { name: 'created_at', type: 'timestamptz', description: 'When the product was added.' },
    ],
  },
  {
    name: 'orders',
    description: 'Customer orders. total_amount is the sum of its order_items.',
    columns: [
      { name: 'id', type: 'integer', description: 'Primary key.' },
      { name: 'customer_id', type: 'integer', description: 'References customers.id.' },
      { name: 'order_date', type: 'date', description: 'Date the order was placed.' },
      { name: 'status', type: 'text', description: 'One of delivered, shipped, pending, cancelled.' },
      { name: 'total_amount', type: 'numeric', description: 'Total order value.' },
      { name: 'created_at', type: 'timestamptz', description: 'When the order record was created.' },
    ],
  },
  {
    name: 'order_items',
    description: 'Line items belonging to an order.',
    columns: [
      { name: 'id', type: 'integer', description: 'Primary key.' },
      { name: 'order_id', type: 'integer', description: 'References orders.id.' },
      { name: 'product_id', type: 'integer', description: 'References products.id.' },
      { name: 'quantity', type: 'integer', description: 'Units purchased.' },
      { name: 'unit_price', type: 'numeric', description: 'Price per unit at time of purchase.' },
    ],
  },
]

export const QUERY_HISTORY_TABLE: TableInfo = {
  name: 'query_history',
  description: 'Log of every natural-language question asked to the AI copilot and its outcome.',
  columns: [
    { name: 'id', type: 'integer', description: 'Primary key.' },
    { name: 'question', type: 'text', description: 'The natural-language question asked.' },
    { name: 'generated_sql', type: 'text', description: 'The SQL the AI generated for the question.' },
    { name: 'status', type: 'text', description: 'success or error.' },
    { name: 'execution_time_ms', type: 'integer', description: 'Total pipeline execution time in milliseconds.' },
    { name: 'row_count', type: 'integer', description: 'Number of rows returned.' },
    { name: 'result_snapshot', type: 'jsonb', description: 'Snapshot of the first rows returned.' },
    { name: 'chart_config', type: 'jsonb', description: 'Auto-selected chart configuration.' },
    { name: 'insight', type: 'text', description: 'AI-generated natural-language insight.' },
    { name: 'error_message', type: 'text', description: 'Error message if the query failed.' },
    { name: 'created_by', type: 'text', description: 'User who asked the question.' },
    { name: 'created_at', type: 'timestamptz', description: 'When the question was asked.' },
  ],
}

export function buildSchemaPromptContext(): string {
  return SCHEMA_TABLES.map((t) => {
    const cols = t.columns.map((c) => `  - ${c.name} (${c.type}): ${c.description}`).join('\n')
    return `Table "${t.name}": ${t.description}\n${cols}`
  }).join('\n\n')
}
