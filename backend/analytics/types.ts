// Shared types for the AI Data Analytics Copilot backend.

export type QueryStatus = 'success' | 'error'

export type ChartType = 'bar' | 'line' | 'pie' | 'table'

export interface ChartConfig {
  type: ChartType
  xKey?: string
  yKey?: string
  nameKey?: string
  valueKey?: string
}

export interface ConversationTurn {
  question: string
  sql: string | null
  insight: string | null
}

export interface AskQuestionParams {
  question: string
  conversation?: ConversationTurn[]
}

export interface AskQuestionResult {
  historyId: number
  question: string
  sql: string | null
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  chart: ChartConfig | null
  insight: string | null
  executionTimeMs: number
  status: QueryStatus
  errorMessage: string | null
}

export interface QueryHistoryEntry {
  id: number
  question: string
  generatedSql: string | null
  status: QueryStatus
  executionTimeMs: number | null
  rowCount: number | null
  resultSnapshot: Record<string, unknown>[] | null
  chartConfig: ChartConfig | null
  insight: string | null
  errorMessage: string | null
  createdBy: string | null
  createdAt: string
}

/** Business tables the AI is allowed to generate SELECT queries against. */
export const ALLOWED_QUERY_TABLES = ['customers', 'products', 'orders', 'order_items'] as const

export const MAX_RESULT_ROWS = 500
export const HISTORY_SNAPSHOT_ROWS = 50
export const DEFAULT_AI_MODEL = 'claude-sonnet-4-6' as const
