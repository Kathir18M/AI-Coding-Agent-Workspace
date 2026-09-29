import { mapHistoryRow, type QueryHistoryRow } from './historyMapper'
import type { QueryHistoryEntry } from './types'

interface Params {
  id: number
}

export default async function getQueryById(req: { params: Params }): Promise<QueryHistoryEntry | null> {
  const result = await retoolDb.query<QueryHistoryRow>(`SELECT * FROM query_history WHERE id = $1`, [req.params.id])
  const row = result.data[0]
  return row ? mapHistoryRow(row) : null
}
