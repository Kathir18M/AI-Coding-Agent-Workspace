import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Upload, FileSpreadsheet, Eye, Trash2, Loader2, LayoutGrid } from 'lucide-react'
import { useDeleteUploadedDataset, useGetUploadedDatasetById, useListUploadedDatasets, useUploadDataset } from '../../hooks/backend/analytics'
import { Button } from '../../lib/shadcn/button'
import { Card, CardContent } from '../../lib/shadcn/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../lib/shadcn/dialog'
import { DynamicTable } from './DynamicTable'
import { detectFileKind, parseByFileKind } from '../../utils/parseCsv'
import type { UploadedDatasetDetail, UploadedDatasetSummary } from '../data/analyticsTypes'

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024

export function UploadedDatasets() {
  const { data: datasets, trigger: triggerList } = useListUploadedDatasets() as {
    data: UploadedDatasetSummary[] | null
    trigger: () => void
  }
  const { trigger: triggerUpload } = useUploadDataset() as {
    trigger: (params: {
      name: string
      originalFilename: string
      columns: string[]
      rows: Record<string, unknown>[]
    }) => { result: Promise<UploadedDatasetSummary> }
  }
  const { trigger: triggerGet } = useGetUploadedDatasetById() as {
    trigger: (params: { id: number }) => { result: Promise<UploadedDatasetDetail | null> }
  }
  const { trigger: triggerDelete } = useDeleteUploadedDataset() as {
    trigger: (params: { id: number }) => { result: Promise<{ deleted: boolean }> }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [viewing, setViewing] = useState<UploadedDatasetDetail | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [dragActive, setDragActive] = useState(false)

  useEffect(() => {
    triggerList()
  }, [])

  async function processFile(file: File) {
    setUploadError(null)
    const kind = detectFileKind(file.name)

    if (!kind) {
      setUploadError('Unsupported file type. Please upload a .csv, .tsv, or .json file.')
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError('File is too large. Please upload a file under 2 MB.')
      return
    }

    setUploading(true)
    try {
      const text = await file.text()
      const { columns, rows } = parseByFileKind(kind, text)
      if (columns.length === 0 || rows.length === 0) {
        setUploadError('Could not find any columns or rows in this file.')
        return
      }
      const name = file.name.replace(/\.(csv|tsv|json)$/i, '')
      await triggerUpload({ name, originalFilename: file.name, columns, rows }).result
      triggerList()
    } catch {
      setUploadError('Something went wrong while reading this file. Double-check the format and try again.')
    } finally {
      setUploading(false)
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) await processFile(file)
  }

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await processFile(file)
  }

  async function handleView(id: number) {
    setViewLoading(true)
    try {
      const detail = await triggerGet({ id }).result
      setViewing(detail)
    } finally {
      setViewLoading(false)
    }
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      await triggerDelete({ id }).result
      triggerList()
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Uploaded datasets</p>
            <p className="text-xs text-muted-foreground">Import a CSV, TSV, or JSON file to browse and chart it.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/builder">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Dashboard Builder
              </Link>
            </Button>
            <input ref={fileInputRef} type="file" accept=".csv,.tsv,.json" className="hidden" onChange={handleFileChange} />
            <Button size="sm" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Upload file
            </Button>
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragActive(true)
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed p-6 text-center transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-accent/40'
          }`}
        >
          <Upload className="h-5 w-5 text-muted-foreground" />
          <p className="text-xs font-medium">Drag and drop a file, or click to browse</p>
          <p className="text-xs text-muted-foreground">Supports .csv, .tsv, and .json — up to 2 MB</p>
        </div>

        {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}

        {datasets && datasets.length > 0 ? (
          <div className="divide-y divide-border">
            {datasets.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.columns.length} columns · {d.rowCount} rows · {new Date(d.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button asChild variant="ghost" size="icon" aria-label="Build a chart from this dataset">
                    <Link to={`/builder?datasetId=${d.id}`}>
                      <LayoutGrid className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="View dataset" onClick={() => handleView(d.id)} disabled={viewLoading}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete dataset"
                    onClick={() => handleDelete(d.id)}
                    disabled={deletingId === d.id}
                  >
                    <Trash2 className={deletingId === d.id ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-muted-foreground">No datasets uploaded yet.</p>
        )}
      </CardContent>

      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewing?.name}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
              <p className="text-xs text-muted-foreground">
                {viewing.originalFilename} · {viewing.rowCount} rows · uploaded by {viewing.uploadedBy ?? 'unknown'}
              </p>
              <DynamicTable columns={viewing.columns} rows={viewing.rows} maxHeight="420px" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
