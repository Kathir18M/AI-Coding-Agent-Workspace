import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../lib/shadcn/table'

type Props = {
  columns: string[]
  rows: Record<string, unknown>[]
  emptyMessage?: string
  maxHeight?: string
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function DynamicTable({ columns, rows, emptyMessage = 'No rows to display.', maxHeight }: Props) {
  if (rows.length === 0) {
    return <div className="rounded-md border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
  }

  return (
    <div className="rounded-md border border-border overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col} className="whitespace-nowrap font-mono text-xs">
                {col}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {columns.map((col) => (
                <TableCell key={col} className="whitespace-nowrap text-sm">
                  {formatCell(row[col])}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
