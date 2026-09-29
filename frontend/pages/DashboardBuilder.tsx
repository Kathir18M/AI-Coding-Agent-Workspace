import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LayoutGrid, Plus, Trash2, Loader2, Sparkles } from 'lucide-react'
import {
  useListUploadedDatasets,
  useListWidgets,
  usePreviewWidgetData,
  useCreateWidget,
  useGetWidgetChartData,
  useDeleteWidget,
} from '../hooks/backend/analytics'
import { Button } from '../lib/shadcn/button'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../lib/shadcn/dialog'
import { Input } from '../lib/shadcn/input'
import { Label } from '../lib/shadcn/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../lib/shadcn/select'
import { ChartRenderer, type ChartConfig, type ChartType } from './ui/ChartRenderer'
import { ChartTypeSwitcher } from './ui/ChartTypeSwitcher'
import type { UploadedDatasetSummary } from './data/analyticsTypes'

type Aggregation = 'none' | 'count' | 'sum' | 'avg'

interface WidgetSummary {
  id: number
  title: string
  datasetId: number
  datasetName: string
  xKey: string
  yKey: string | null
  chartType: ChartType
  aggregation: Aggregation
  createdBy: string | null
  createdAt: string
}

interface WidgetChartData {
  title: string
  rows: Record<string, unknown>[]
  chart: ChartConfig
}

function WidgetCard({ widget, onDeleted }: { widget: WidgetSummary; onDeleted: () => void }) {
  const { data, loading, trigger } = useGetWidgetChartData() as {
    data: WidgetChartData | null
    loading: boolean
    trigger: (params: { id: number }) => { result: Promise<WidgetChartData | null> }
  }
  const { trigger: triggerDelete } = useDeleteWidget() as {
    trigger: (params: { id: number }) => { result: Promise<{ deleted: boolean }> }
  }
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    trigger({ id: widget.id })
  }, [widget.id])

  async function handleDelete() {
    setDeleting(true)
    try {
      await triggerDelete({ id: widget.id }).result
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-3">
        <div>
          <CardTitle className="text-sm">{widget.title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {widget.datasetName} · {widget.aggregation === 'none' ? 'raw' : widget.aggregation} · {widget.xKey}
            {widget.yKey ? ` / ${widget.yKey}` : ''}
          </p>
        </div>
        <Button variant="ghost" size="icon" aria-label="Delete widget" onClick={handleDelete} disabled={deleting}>
          <Trash2 className={deleting ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : data && data.rows.length > 0 ? (
          <ChartRenderer chart={data.chart} rows={data.rows} height={220} />
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">No data to show.</p>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardBuilder() {
  const [searchParams, setSearchParams] = useSearchParams()

  const { data: datasets, trigger: triggerDatasets } = useListUploadedDatasets() as {
    data: UploadedDatasetSummary[] | null
    trigger: () => void
  }
  const { data: widgets, trigger: triggerWidgets } = useListWidgets() as {
    data: WidgetSummary[] | null
    trigger: () => void
  }
  const { trigger: triggerPreview } = usePreviewWidgetData() as {
    trigger: (params: {
      datasetId: number
      xKey: string
      yKey?: string
      chartType: ChartType
      aggregation: Aggregation
    }) => { result: Promise<{ columns: string[]; rows: Record<string, unknown>[]; chart: ChartConfig }> }
  }
  const { trigger: triggerCreate } = useCreateWidget() as {
    trigger: (params: {
      title: string
      datasetId: number
      xKey: string
      yKey?: string
      chartType: ChartType
      aggregation: Aggregation
    }) => { result: Promise<WidgetSummary> }
  }

  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [datasetId, setDatasetId] = useState<number | null>(null)
  const [xKey, setXKey] = useState('')
  const [yKey, setYKey] = useState('')
  const [aggregation, setAggregation] = useState<Aggregation>('sum')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [preview, setPreview] = useState<{ rows: Record<string, unknown>[]; chart: ChartConfig } | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    triggerDatasets()
    triggerWidgets()
  }, [])

  useEffect(() => {
    const requestedId = searchParams.get('datasetId')
    if (requestedId) {
      setDatasetId(Number(requestedId))
      setDialogOpen(true)
      searchParams.delete('datasetId')
      setSearchParams(searchParams, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedDataset = useMemo(() => datasets?.find((d) => d.id === datasetId) ?? null, [datasets, datasetId])

  useEffect(() => {
    if (!selectedDataset) {
      setXKey('')
      setYKey('')
      return
    }
    if (!selectedDataset.columns.includes(xKey)) setXKey(selectedDataset.columns[0] ?? '')
    if (!selectedDataset.columns.includes(yKey)) setYKey(selectedDataset.columns[1] ?? selectedDataset.columns[0] ?? '')
  }, [selectedDataset])

  useEffect(() => {
    if (!datasetId || !xKey || (!yKey && aggregation !== 'count')) {
      setPreview(null)
      return
    }
    const handle = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const result = await triggerPreview({
          datasetId,
          xKey,
          ...(aggregation !== 'count' ? { yKey } : {}),
          chartType,
          aggregation,
        }).result
        setPreview({ rows: result.rows, chart: result.chart })
      } catch {
        setPreview(null)
      } finally {
        setPreviewLoading(false)
      }
    }, 300)
    return () => clearTimeout(handle)
  }, [datasetId, xKey, yKey, aggregation, chartType])

  function openCreateDialog() {
    setTitle('')
    setDatasetId(datasets?.[0]?.id ?? null)
    setAggregation('sum')
    setChartType('bar')
    setFormError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!datasetId || !xKey) {
      setFormError('Please choose a dataset and a column.')
      return
    }
    if (aggregation !== 'count' && !yKey) {
      setFormError('Please choose a value column, or switch aggregation to Count.')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      await triggerCreate({
        title: title.trim() || `${selectedDataset?.name ?? 'Widget'} — ${xKey}`,
        datasetId,
        xKey,
        ...(aggregation !== 'count' ? { yKey } : {}),
        chartType,
        aggregation,
      }).result
      setDialogOpen(false)
      triggerWidgets()
    } catch {
      setFormError('Could not save this widget. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <LayoutGrid className="h-5 w-5" />
            Dashboard Builder
          </h1>
          <p className="text-sm text-muted-foreground">Turn your uploaded files into your own custom charts.</p>
        </div>
        <Button onClick={openCreateDialog} disabled={!datasets || datasets.length === 0}>
          <Plus className="mr-2 h-4 w-4" />
          Add widget
        </Button>
      </div>

      {(!datasets || datasets.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground">
            <Sparkles className="h-6 w-6" />
            <p>Upload a CSV, TSV, or JSON file in Data Explorer first, then come back here to build charts from it.</p>
          </CardContent>
        </Card>
      )}

      {widgets && widgets.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {widgets.map((w) => (
            <WidgetCard key={w.id} widget={w} onDeleted={triggerWidgets} />
          ))}
        </div>
      ) : datasets && datasets.length > 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No widgets yet. Click "Add widget" to build your first chart from an uploaded file.
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add widget</DialogTitle>
          </DialogHeader>
          <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-1.5">
              <Label htmlFor="widget-title">Title</Label>
              <Input id="widget-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Revenue by region" />
            </div>

            <div className="space-y-1.5">
              <Label>Dataset</Label>
              <Select value={datasetId ? String(datasetId) : ''} onValueChange={(v) => setDatasetId(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a dataset" />
                </SelectTrigger>
                <SelectContent>
                  {(datasets ?? []).map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedDataset && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Group by (X)</Label>
                    <Select value={xKey} onValueChange={setXKey}>
                      <SelectTrigger>
                        <SelectValue placeholder="Column" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedDataset.columns.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Aggregation</Label>
                    <Select value={aggregation} onValueChange={(v) => setAggregation(v as Aggregation)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="count">Count</SelectItem>
                        <SelectItem value="sum">Sum</SelectItem>
                        <SelectItem value="avg">Average</SelectItem>
                        <SelectItem value="none">Raw (no grouping)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {aggregation !== 'count' && (
                  <div className="space-y-1.5">
                    <Label>Value column (Y)</Label>
                    <Select value={yKey} onValueChange={setYKey}>
                      <SelectTrigger>
                        <SelectValue placeholder="Column" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedDataset.columns.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label>Chart style</Label>
                  <ChartTypeSwitcher value={chartType} onChange={setChartType} allow={['bar', 'line', 'area', 'pie']} />
                </div>

                <div>
                  <Label className="mb-1.5 block">Preview</Label>
                  <div className="rounded-md border border-border bg-muted/30 p-2">
                    {previewLoading ? (
                      <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : preview && preview.rows.length > 0 ? (
                      <ChartRenderer chart={preview.chart} rows={preview.rows} height={200} />
                    ) : (
                      <p className="py-10 text-center text-xs text-muted-foreground">Choose columns to see a preview.</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {formError && <p className="text-xs text-destructive">{formError}</p>}

            <Button className="w-full" onClick={handleSave} disabled={saving || !selectedDataset}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save widget
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
