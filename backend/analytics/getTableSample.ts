import { QUERY_HISTORY_TABLE, SCHEMA_TABLES, type TableInfo } from './schemaInfo'

interface Params {
  table: string
}

interface TableSample {
  table: TableInfo
  rows: Record<string, unknown>[]
  rowCount: number
}

const EXPLORABLE_TABLES = [...SCHEMA_TABLES, QUERY_HISTORY_TABLE]

async function fetchSample(tableName: string): Promise<{ rows: Record<string, unknown>[]; rowCount: number } | null> {
  // Literal SQL per branch (no interpolation, no variable holding a query string derived from
  // input) so table selection never reaches the query as data.
  switch (tableName) {
    case 'customers': {
      const count = await retoolDb.query<{ count: string }>('SELECT count(*) FROM customers')
      const rows = await retoolDb.query('SELECT * FROM customers ORDER BY id DESC LIMIT 20')
      return { rows: rows.data, rowCount: parseInt(count.data[0]?.count ?? '0', 10) }
    }
    case 'products': {
      const count = await retoolDb.query<{ count: string }>('SELECT count(*) FROM products')
      const rows = await retoolDb.query('SELECT * FROM products ORDER BY id DESC LIMIT 20')
      return { rows: rows.data, rowCount: parseInt(count.data[0]?.count ?? '0', 10) }
    }
    case 'orders': {
      const count = await retoolDb.query<{ count: string }>('SELECT count(*) FROM orders')
      const rows = await retoolDb.query('SELECT * FROM orders ORDER BY id DESC LIMIT 20')
      return { rows: rows.data, rowCount: parseInt(count.data[0]?.count ?? '0', 10) }
    }
    case 'order_items': {
      const count = await retoolDb.query<{ count: string }>('SELECT count(*) FROM order_items')
      const rows = await retoolDb.query('SELECT * FROM order_items ORDER BY id DESC LIMIT 20')
      return { rows: rows.data, rowCount: parseInt(count.data[0]?.count ?? '0', 10) }
    }
    case 'query_history': {
      const count = await retoolDb.query<{ count: string }>('SELECT count(*) FROM query_history')
      const rows = await retoolDb.query('SELECT * FROM query_history ORDER BY id DESC LIMIT 20')
      return { rows: rows.data, rowCount: parseInt(count.data[0]?.count ?? '0', 10) }
    }
    default:
      return null
  }
}

export default async function getTableSample(req: { params: Params }): Promise<TableSample> {
  const table = EXPLORABLE_TABLES.find((t) => t.name === req.params.table)
  if (!table) {
    throw new Error('Unknown table requested.')
  }
  const sample = await fetchSample(req.params.table)
  if (!sample) {
    throw new Error('Unknown table requested.')
  }

  return { table, rows: sample.rows, rowCount: sample.rowCount }
}
