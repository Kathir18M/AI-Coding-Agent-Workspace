import type { Aggregation } from './aggregateDataset'

interface Params {
  title: string
  datasetId: number
  xKey: string
  yKey?: string
  chartType: 'bar' | 'line' | 'pie' | 'area'
  aggregation: Aggregation
}

interface WidgetSummary {
  id: number
  title: string
  datasetId: number
  xKey: string
  yKey: string | null
  chartType: string
  aggregation: string
  createdBy: string | null
  createdAt: string
}

export default async function createWidget(req: { params: Params; user: User }): Promise<WidgetSummary> {
  const title = req.params.title.trim().slice(0, 100) || 'Untitled widget'

  const datasetCheck = await retoolDb.query<{ id: number }>(`SELECT id FROM uploaded_datasets WHERE id = $1`, [req.params.datasetId])
  if (!datasetCheck.data[0]) {
    throw new Error('Dataset not found.')
  }

  const inserted = await retoolDb.query<{
    id: number
    title: string
    dataset_id: number
    x_key: string
    y_key: string | null
    chart_type: string
    aggregation: string
    created_by: string | null
    created_at: string
  }>(
    `INSERT INTO dashboard_widgets (title, dataset_id, x_key, y_key, chart_type, aggregation, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, title, dataset_id, x_key, y_key, chart_type, aggregation, created_by, created_at`,
    [
      title,
      req.params.datasetId,
      req.params.xKey,
      req.params.yKey ?? null,
      req.params.chartType,
      req.params.aggregation,
      req.user.fullName ?? req.user.email,
    ],
  )

  const row = inserted.data[0]
  if (!row) throw new Error('Failed to save widget.')

  return {
    id: row.id,
    title: row.title,
    datasetId: row.dataset_id,
    xKey: row.x_key,
    yKey: row.y_key,
    chartType: row.chart_type,
    aggregation: row.aggregation,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }
}
