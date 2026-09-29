import { useEffect, useState } from 'react'
import { Database } from 'lucide-react'
import { useGetSchema, useGetTableSample } from '../hooks/backend/analytics'
import { Card, CardContent } from '../lib/shadcn/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../lib/shadcn/select'
import { Input } from '../lib/shadcn/input'
import { DynamicTable } from './ui/DynamicTable'
import { UploadedDatasets } from './ui/UploadedDatasets'
import type { TableInfo, TableSample } from './data/analyticsTypes'

const QUERY_HISTORY_TABLE: TableInfo = {
  name: 'query_history',
  description: 'Log of every natural-language question asked to the AI copilot and its outcome.',
  columns: [],
}

export default function DataExplorer() {
  const { data: schema, trigger: triggerSchema } = useGetSchema() as {
    data: TableInfo[] | null
    trigger: () => void
  }
  const { data: sample, loading, trigger: triggerSample } = useGetTableSample() as {
    data: TableSample | null
    loading: boolean
    trigger: (params: { table: string }) => void
  }

  const [selectedTable, setSelectedTable] = useState('customers')
  const [search, setSearch] = useState('')

  useEffect(() => {
    triggerSchema()
  }, [])

  useEffect(() => {
    triggerSample({ table: selectedTable })
  }, [selectedTable])

  const tables = [...(schema ?? []), QUERY_HISTORY_TABLE]
  const columns = sample?.rows[0] ? Object.keys(sample.rows[0]) : []
  const filteredRows = search.trim()
    ? sample?.rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search.trim().toLowerCase())) ?? []
    : sample?.rows ?? []

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Data Explorer</h1>
        <p className="text-sm text-muted-foreground">Browse the tables backing your analytics database.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={selectedTable} onValueChange={setSelectedTable}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="Select a table" />
          </SelectTrigger>
          <SelectContent>
            {tables.map((t) => (
              <SelectItem key={t.name} value={t.name}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input placeholder="Search sample rows…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:w-64" />
      </div>

      {sample && (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 p-4 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Database className="h-4 w-4 text-muted-foreground" />
              {sample.table.name}
            </div>
            <span className="text-muted-foreground">{sample.table.description}</span>
            <span className="ml-auto rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {sample.rowCount} total rows
            </span>
          </CardContent>
        </Card>
      )}

      {sample && sample.table.columns.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Columns</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sample.table.columns.map((c) => (
                <div key={c.name} className="rounded-md border border-border p-2 text-xs">
                  <p className="font-mono font-medium">
                    {c.name} <span className="text-muted-foreground">({c.type})</span>
                  </p>
                  <p className="mt-0.5 text-muted-foreground">{c.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <p className="mb-2 text-sm font-medium">Sample rows (latest 20)</p>
        {loading && !sample ? (
          <div className="rounded-md border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">Loading…</div>
        ) : (
          <DynamicTable columns={columns} rows={filteredRows} maxHeight="420px" />
        )}
      </div>

      <UploadedDatasets />
    </div>
  )
}
