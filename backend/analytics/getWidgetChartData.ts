import { aggregateRows, resolveYLabel, type Aggregation } from './aggregateDataset'

interface Params {
  id: number
}

interface WidgetChartData {
  title: string
  rows: Record<string, unknown>[]
  chart: { type: string; xKey: string; yKey: string; nameKey: string; valueKey: string }
}

export default async function getWidgetChartData(req: { params: Params }): Promise<WidgetChartData | null> {
  const result = await retoolDb.query<{
    title: string
    x_key: string
    y_key: string | null
    chart_type: string
    aggregation: string
    rows: Record<string, unknown>[]
  }>(
    `SELECT w.title, w.x_key, w.y_key, w.chart_type, w.aggregation, d.rows
     FROM dashboard_widgets w
     JOIN uploaded_datasets d ON d.id = w.dataset_id
     WHERE w.id = $1`,
    [req.params.id],
  )

  const row = result.data[0]
  if (!row) return null

  const yLabel = resolveYLabel(row.y_key, row.aggregation as Aggregation)
  const rows = aggregateRows(row.rows, row.x_key, row.y_key, row.aggregation as Aggregation)

  return {
    title: row.title,
    rows,
    chart: { type: row.chart_type, xKey: row.x_key, yKey: yLabel, nameKey: row.x_key, valueKey: yLabel },
  }
}
