import { DEFAULT_AI_MODEL, MAX_RESULT_ROWS } from './types'

interface HealthStatus {
  databaseConnected: boolean
  aiConnected: boolean
  defaultModel: string
  maxResultRows: number
  readOnlyMode: true
  checkedAt: string
}

export default async function health(): Promise<HealthStatus> {
  let databaseConnected = false
  try {
    await retoolDb.query('SELECT 1')
    databaseConnected = true
  } catch {
    databaseConnected = false
  }

  let aiConnected = false
  try {
    const result = await anthropic.text.generate({
      instruction: 'Reply with the single word: ok',
      model: DEFAULT_AI_MODEL,
      temperature: 0,
    })
    aiConnected = typeof result.data.queryData.data === 'string' && result.data.queryData.data.length > 0
  } catch {
    aiConnected = false
  }

  return {
    databaseConnected,
    aiConnected,
    defaultModel: DEFAULT_AI_MODEL,
    maxResultRows: MAX_RESULT_ROWS,
    readOnlyMode: true,
    checkedAt: new Date().toISOString(),
  }
}
