import type { ChartConfig, QueryHistoryEntry, QueryStatus } from './types'

/** Raw row shape as stored in the query_history Postgres table. */
export interface QueryHistoryRow {
  id: number
  question: string
  generated_sql: string | null
  status: string
  execution_time_ms: number | null
  row_count: number | null
  result_snapshot: unknown
  chart_config: unknown
  insight: string | null
  error_message: string | null
  created_by: string | null
  created_at: string
}

export function mapHistoryRow(row: QueryHistoryRow): QueryHistoryEntry {
  return {
    id: row.id,
    question: row.question,
    generatedSql: row.generated_sql,
    status: (row.status as QueryStatus) ?? 'error',
    executionTimeMs: row.execution_time_ms,
    rowCount: row.row_count,
    resultSnapshot: (row.result_snapshot as Record<string, unknown>[] | null) ?? null,
    chartConfig: (row.chart_config as ChartConfig | null) ?? null,
    insight: row.insight,
    errorMessage: row.error_message,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}
