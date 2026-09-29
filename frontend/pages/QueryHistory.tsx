import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table'
import { ArrowUpDown, Eye, RotateCcw, Search } from 'lucide-react'
import { useGetHistory, useRerunQuery } from '../hooks/backend/analytics'
import { Input } from '../lib/shadcn/input'
import { Button } from '../lib/shadcn/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../lib/shadcn/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../lib/shadcn/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../lib/shadcn/dialog'
import { StatusBadge } from './ui/StatusBadge'
import { DynamicTable } from './ui/DynamicTable'
import { ChartRenderer, deriveChartConfig, type ChartType } from './ui/ChartRenderer'
import { ChartTypeSwitcher } from './ui/ChartTypeSwitcher'
import type { QueryHistoryEntry, QueryStatus, HistoryListResult, AskQuestionResult } from './data/analyticsTypes'

export default function QueryHistory() {
  const { data, loading, trigger } = useGetHistory() as {
    data: HistoryListResult | null
    loading: boolean
    trigger: (params: { status?: QueryStatus; search?: string; limit?: number }) => void
  }
  const { trigger: triggerRerun } = useRerunQuery() as {
    trigger: (params: { id: number }) => { result: Promise<AskQuestionResult> }
  }
  const navigate = useNavigate()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | QueryStatus>('all')
  const [sorting, setSorting] = useState<SortingState>([{ id: 'createdAt', desc: true }])
  const [selected, setSelected] = useState<QueryHistoryEntry | null>(null)
  const [chartTypeOverride, setChartTypeOverride] = useState<ChartType | null>(null)
  const [rerunningId, setRerunningId] = useState<number | null>(null)

  useEffect(() => {
    const handle = setTimeout(() => {
      trigger({ ...(status !== 'all' ? { status } : {}), ...(search.trim() ? { search: search.trim() } : {}), limit: 200 })
    }, 250)
    return () => clearTimeout(handle)
  }, [search, status])

  async function handleRerun(entry: QueryHistoryEntry) {
    setRerunningId(entry.id)
    try {
      await triggerRerun({ id: entry.id }).result
    } finally {
      setRerunningId(null)
      trigger({ ...(status !== 'all' ? { status } : {}), ...(search.trim() ? { search: search.trim() } : {}), limit: 200 })
    }
    navigate('/copilot', { state: { rerunQuestion: entry.question } })
  }

  const columns = useMemo<ColumnDef<QueryHistoryEntry>[]>(
    () => [
      {
        accessorKey: 'question',
        header: 'Question',
        cell: ({ row }) => <span className="line-clamp-2 max-w-md text-sm">{row.original.question}</span>,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'executionTimeMs',
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Time <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => <span className="text-sm">{row.original.executionTimeMs ?? '—'} ms</span>,
      },
      {
        accessorKey: 'rowCount',
        header: 'Rows',
        cell: ({ row }) => <span className="text-sm">{row.original.rowCount ?? '—'}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <button className="flex items-center gap-1" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Created <ArrowUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => <span className="text-sm">{new Date(row.original.createdAt).toLocaleString()}</span>,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" aria-label="View details" onClick={() => { setSelected(row.original); setChartTypeOverride(null) }}>
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Re-run query"
              disabled={rerunningId === row.original.id}
              onClick={() => handleRerun(row.original)}
            >
              <RotateCcw className={rerunningId === row.original.id ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            </Button>
          </div>
        ),
      },
    ],
    [rerunningId],
  )

  const table = useReactTable({
    data: data?.entries ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 15 } },
  })

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Query History</h1>
        <p className="text-sm text-muted-foreground">Every question asked to the AI copilot, with its generated SQL and outcome.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search questions or SQL…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as 'all' | QueryStatus)}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading && !data ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-8 text-center text-sm text-muted-foreground">
                  No queries found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {Math.max(table.getPageCount(), 1)} · {data?.total ?? 0} total
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.question}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <StatusBadge status={selected.status} />
                <span>{selected.executionTimeMs ?? '—'} ms</span>
                <span>{new Date(selected.createdAt).toLocaleString()}</span>
              </div>
              {selected.generatedSql && (
                <div>
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Generated SQL</p>
                  <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                    <code>{selected.generatedSql}</code>
                  </pre>
                </div>
              )}
              {selected.errorMessage && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {selected.errorMessage}
                </div>
              )}
              {selected.insight && <p className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">{selected.insight}</p>}
              {selected.chartConfig && selected.resultSnapshot && (
                <div className="space-y-2">
                  <div className="flex justify-end">
                    <ChartTypeSwitcher
                      value={chartTypeOverride ?? selected.chartConfig.type}
                      onChange={setChartTypeOverride}
                    />
                  </div>
                  <ChartRenderer
                    chart={deriveChartConfig(selected.chartConfig, chartTypeOverride ?? selected.chartConfig.type)}
                    rows={selected.resultSnapshot}
                  />
                </div>
              )}
              {selected.resultSnapshot && selected.resultSnapshot.length > 0 && (
                <DynamicTable columns={Object.keys(selected.resultSnapshot[0] ?? {})} rows={selected.resultSnapshot} maxHeight="240px" />
              )}
              <Button
                onClick={() => {
                  setSelected(null)
                  handleRerun(selected)
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Re-run in Copilot
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
