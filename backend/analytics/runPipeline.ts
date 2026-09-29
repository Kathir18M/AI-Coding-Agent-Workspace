// Core Q&A pipeline shared by askQuestion and rerunQuery:
// question -> Anthropic (SQL) -> validation -> retoolDb (execution) -> Anthropic (insight) -> chart -> save history

import { buildSchemaPromptContext } from './schemaInfo'
import { extractSql, validateSql } from './sqlSafety'
import { pickChartConfig } from './chartHeuristics'
import { mapHistoryRow, type QueryHistoryRow } from './historyMapper'
import { DEFAULT_AI_MODEL, HISTORY_SNAPSHOT_ROWS, type AskQuestionResult, type ConversationTurn } from './types'

const SQL_SYSTEM_MESSAGE =
  'You are a precise SQL generator for a read-only analytics tool. ' +
  'You only ever output a single PostgreSQL SELECT statement, with no explanation, no markdown fences, and no trailing semicolon. ' +
  'Never generate INSERT, UPDATE, DELETE, DROP, ALTER, or any statement that is not a SELECT.'

const INSIGHT_SYSTEM_MESSAGE =
  'You are a business analyst. Given a question and the resulting data, write a concise, friendly insight ' +
  'in 2-4 sentences. Call out concrete numbers and trends. Do not repeat the raw data verbatim, and do not use markdown.'

function buildConversationContext(conversation: ConversationTurn[] | undefined): string {
  if (!conversation || conversation.length === 0) return ''
  const turns = conversation
    .slice(-3)
    .map((t, i) => `Q${i + 1}: ${t.question}${t.sql ? `\nSQL${i + 1}: ${t.sql}` : ''}`)
    .join('\n\n')
  return `\n\nPrior conversation for context (the new question may be a follow-up):\n${turns}\n`
}

async function generateSql(question: string, conversation: ConversationTurn[] | undefined): Promise<string> {
  const schema = buildSchemaPromptContext()
  const instruction =
    `Schema:\n${schema}\n` +
    buildConversationContext(conversation) +
    `\nNew question: ${question}\n\nSQL:`
  const result = await anthropic.text.generate({
    instruction,
    model: DEFAULT_AI_MODEL,
    systemMessage: SQL_SYSTEM_MESSAGE,
    temperature: 0,
  })
  return extractSql(result.data.queryData.data)
}

async function generateInsight(question: string, rows: Record<string, unknown>[]): Promise<string | null> {
  try {
    const sample = rows.slice(0, 20)
    const instruction =
      `Question: ${question}\n\nResult data (JSON, ${rows.length} row(s) total, showing up to 20):\n${JSON.stringify(sample)}\n\nInsight:`
    const result = await anthropic.text.generate({
      instruction,
      model: DEFAULT_AI_MODEL,
      systemMessage: INSIGHT_SYSTEM_MESSAGE,
      temperature: 0.3,
    })
    return result.data.queryData.data.trim()
  } catch {
    return null
  }
}

async function saveHistory(fields: {
  question: string
  sql: string | null
  status: 'success' | 'error'
  executionTimeMs: number
  rowCount: number | null
  resultSnapshot: Record<string, unknown>[] | null
  chartConfig: unknown
  insight: string | null
  errorMessage: string | null
  createdBy: string | null
}): Promise<number> {
  const inserted = await retoolDb.query<{ id: number }>(
    `INSERT INTO query_history
      (question, generated_sql, status, execution_time_ms, row_count, result_snapshot, chart_config, insight, error_message, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id`,
    [
      fields.question,
      fields.sql,
      fields.status,
      fields.executionTimeMs,
      fields.rowCount,
      fields.resultSnapshot ? JSON.stringify(fields.resultSnapshot) : null,
      fields.chartConfig ? JSON.stringify(fields.chartConfig) : null,
      fields.insight,
      fields.errorMessage,
      fields.createdBy,
    ],
  )
  const row = inserted.data[0]
  if (!row) throw new Error('Failed to save query history')
  return row.id
}

export async function runPipeline(
  question: string,
  conversation: ConversationTurn[] | undefined,
  createdBy: string | null,
): Promise<AskQuestionResult> {
  const trimmed = question.trim()
  const startedAt = Date.now()

  if (!trimmed) {
    return {
      historyId: 0,
      question: trimmed,
      sql: null,
      columns: [],
      rows: [],
      rowCount: 0,
      chart: null,
      insight: null,
      executionTimeMs: 0,
      status: 'error',
      errorMessage: 'Please enter a question.',
    }
  }

  let sql: string
  try {
    sql = await generateSql(trimmed, conversation)
  } catch {
    const executionTimeMs = Date.now() - startedAt
    const historyId = await saveHistory({
      question: trimmed,
      sql: null,
      status: 'error',
      executionTimeMs,
      rowCount: null,
      resultSnapshot: null,
      chartConfig: null,
      insight: null,
      errorMessage: 'The AI was unable to generate a SQL query for this question. Try rephrasing it.',
      createdBy,
    })
    return {
      historyId,
      question: trimmed,
      sql: null,
      columns: [],
      rows: [],
      rowCount: 0,
      chart: null,
      insight: null,
      executionTimeMs,
      status: 'error',
      errorMessage: 'The AI was unable to generate a SQL query for this question. Try rephrasing it.',
    }
  }

  const validation = validateSql(sql)
  if (!validation.ok) {
    const executionTimeMs = Date.now() - startedAt
    const historyId = await saveHistory({
      question: trimmed,
      sql,
      status: 'error',
      executionTimeMs,
      rowCount: null,
      resultSnapshot: null,
      chartConfig: null,
      insight: null,
      errorMessage: validation.reason ?? 'The generated query failed safety validation.',
      createdBy,
    })
    return {
      historyId,
      question: trimmed,
      sql,
      columns: [],
      rows: [],
      rowCount: 0,
      chart: null,
      insight: null,
      executionTimeMs,
      status: 'error',
      errorMessage: validation.reason ?? 'The generated query failed safety validation.',
    }
  }

  let rows: Record<string, unknown>[]
  try {
    const result = await retoolDb.query(validation.sql)
    rows = result.data
  } catch {
    const executionTimeMs = Date.now() - startedAt
    const historyId = await saveHistory({
      question: trimmed,
      sql: validation.sql,
      status: 'error',
      executionTimeMs,
      rowCount: null,
      resultSnapshot: null,
      chartConfig: null,
      insight: null,
      errorMessage: 'The generated query could not be executed against the database.',
      createdBy,
    })
    return {
      historyId,
      question: trimmed,
      sql: validation.sql,
      columns: [],
      rows: [],
      rowCount: 0,
      chart: null,
      insight: null,
      executionTimeMs,
      status: 'error',
      errorMessage: 'The generated query could not be executed against the database.',
    }
  }

  const columns = rows.length > 0 && rows[0] ? Object.keys(rows[0]) : []
  const chart = pickChartConfig(rows)
  const insight = rows.length > 0 ? await generateInsight(trimmed, rows) : 'The query ran successfully but returned no rows.'
  const executionTimeMs = Date.now() - startedAt

  const historyId = await saveHistory({
    question: trimmed,
    sql: validation.sql,
    status: 'success',
    executionTimeMs,
    rowCount: rows.length,
    resultSnapshot: rows.slice(0, HISTORY_SNAPSHOT_ROWS),
    chartConfig: chart,
    insight,
    errorMessage: null,
    createdBy,
  })

  return {
    historyId,
    question: trimmed,
    sql: validation.sql,
    columns,
    rows,
    rowCount: rows.length,
    chart,
    insight,
    executionTimeMs,
    status: 'success',
    errorMessage: null,
  }
}

export type { QueryHistoryRow }
export { mapHistoryRow }
