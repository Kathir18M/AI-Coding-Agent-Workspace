import { runPipeline } from './runPipeline'
import type { AskQuestionResult } from './types'

interface Params {
  id: number
}

export default async function rerunQuery(req: { params: Params; user: User }): Promise<AskQuestionResult> {
  const found = await retoolDb.query<{ question: string }>(`SELECT question FROM query_history WHERE id = $1`, [req.params.id])
  const row = found.data[0]
  if (!row) {
    return {
      historyId: 0,
      question: '',
      sql: null,
      columns: [],
      rows: [],
      rowCount: 0,
      chart: null,
      insight: null,
      executionTimeMs: 0,
      status: 'error',
      errorMessage: 'The original query could not be found.',
    }
  }
  return runPipeline(row.question, undefined, req.user.fullName ?? req.user.email)
}
