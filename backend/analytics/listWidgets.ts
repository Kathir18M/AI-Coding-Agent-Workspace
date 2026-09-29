interface WidgetSummary {
  id: number
  title: string
  datasetId: number
  datasetName: string
  xKey: string
  yKey: string | null
  chartType: string
  aggregation: string
  createdBy: string | null
  createdAt: string
}

export default async function listWidgets(): Promise<WidgetSummary[]> {
  const result = await retoolDb.query<{
    id: number
    title: string
    dataset_id: number
    dataset_name: string
    x_key: string
    y_key: string | null
    chart_type: string
    aggregation: string
    created_by: string | null
    created_at: string
  }>(
    `SELECT w.id, w.title, w.dataset_id, d.name AS dataset_name, w.x_key, w.y_key, w.chart_type, w.aggregation, w.created_by, w.created_at
     FROM dashboard_widgets w
     JOIN uploaded_datasets d ON d.id = w.dataset_id
     ORDER BY w.created_at ASC`,
  )

  return result.data.map((row) => ({
    id: row.id,
    title: row.title,
    datasetId: row.dataset_id,
    datasetName: row.dataset_name,
    xKey: row.x_key,
    yKey: row.y_key,
    chartType: row.chart_type,
    aggregation: row.aggregation,
    createdBy: row.created_by,
    createdAt: row.created_at,
  }))
}
