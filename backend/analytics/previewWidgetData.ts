import { aggregateRows, resolveYLabel, type Aggregation } from './aggregateDataset'

interface Params {
  datasetId: number
  xKey: string
  yKey?: string
  chartType: 'bar' | 'line' | 'pie' | 'area'
  aggregation: Aggregation
}

interface WidgetPreview {
  columns: string[]
  rows: Record<string, unknown>[]
  chart: { type: string; xKey: string; yKey: string; nameKey: string; valueKey: string }
}

export default async function previewWidgetData(req: { params: Params }): Promise<WidgetPreview> {
  const result = await retoolDb.query<{ rows: Record<string, unknown>[] }>(
    `SELECT rows FROM uploaded_datasets WHERE id = $1`,
    [req.params.datasetId],
  )
  const dataset = result.data[0]
  if (!dataset) throw new Error('Dataset not found.')

  const yKey = req.params.yKey ?? null
  const yLabel = resolveYLabel(yKey, req.params.aggregation)
  const rows = aggregateRows(dataset.rows, req.params.xKey, yKey, req.params.aggregation)
  const columns = rows.length > 0 && rows[0] ? Object.keys(rows[0]) : [req.params.xKey, yLabel]

  return {
    columns,
    rows,
    chart: { type: req.params.chartType, xKey: req.params.xKey, yKey: yLabel, nameKey: req.params.xKey, valueKey: yLabel },
  }
}
