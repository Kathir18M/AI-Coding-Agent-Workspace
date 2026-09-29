import { mapHistoryRow, type QueryHistoryRow } from './historyMapper'
import type { QueryHistoryEntry } from './types'

interface DailyVolumePoint {
  date: string
  count: number
}

interface DashboardStats {
  totalQueries: number
  successfulQueries: number
  failedQueries: number
  avgExecutionTimeMs: number
  recentQueries: QueryHistoryEntry[]
  dailyVolume: DailyVolumePoint[]
}

export default async function getDashboardStats(): Promise<DashboardStats> {
  const totals = await retoolDb.query<{ total: string; successful: string; failed: string; avg_time: string | null }>(
    `SELECT
       count(*) AS total,
       count(*) FILTER (WHERE status = 'success') AS successful,
       count(*) FILTER (WHERE status = 'error') AS failed,
       avg(execution_time_ms) AS avg_time
     FROM query_history`,
  )
  const totalsRow = totals.data[0]

  const recent = await retoolDb.query<QueryHistoryRow>(`SELECT * FROM query_history ORDER BY created_at DESC LIMIT 8`)

  const volume = await retoolDb.query<{ day: string; count: string }>(
    `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, count(*) AS count
     FROM query_history
     WHERE created_at >= now() - interval '14 days'
     GROUP BY 1
     ORDER BY 1`,
  )

  return {
    totalQueries: parseInt(totalsRow?.total ?? '0', 10),
    successfulQueries: parseInt(totalsRow?.successful ?? '0', 10),
    failedQueries: parseInt(totalsRow?.failed ?? '0', 10),
    avgExecutionTimeMs: totalsRow?.avg_time ? Math.round(Number(totalsRow.avg_time)) : 0,
    recentQueries: recent.data.map(mapHistoryRow),
    dailyVolume: volume.data.map((r) => ({ date: r.day, count: parseInt(r.count, 10) })),
  }
}
