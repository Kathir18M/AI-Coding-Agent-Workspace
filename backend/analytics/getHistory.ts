import { mapHistoryRow, type QueryHistoryRow } from './historyMapper'
import type { QueryHistoryEntry, QueryStatus } from './types'

interface Params {
  status?: QueryStatus
  search?: string
  limit?: number
  offset?: number
}

interface Result {
  entries: QueryHistoryEntry[]
  total: number
}

export default async function getHistory(req: { params: Params }): Promise<Result> {
  const limit = Math.min(Math.max(req.params.limit ?? 25, 1), 200)
  const offset = Math.max(req.params.offset ?? 0, 0)
  const conditions: string[] = []
  const values: unknown[] = []

  if (req.params.status) {
    values.push(req.params.status)
    conditions.push(`status = $${values.length}`)
  }
  if (req.params.search && req.params.search.trim()) {
    values.push(`%${req.params.search.trim()}%`)
    conditions.push(`(question ILIKE $${values.length} OR generated_sql ILIKE $${values.length})`)
  }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

  const countResult = await retoolDb.query<{ count: string }>(`SELECT count(*) FROM query_history ${where}`, values)
  const total = parseInt(countResult.data[0]?.count ?? '0', 10)

  values.push(limit)
  values.push(offset)
  const rowsResult = await retoolDb.query<QueryHistoryRow>(
    `SELECT * FROM query_history ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
    values,
  )

  return { entries: rowsResult.data.map(mapHistoryRow), total }
}
