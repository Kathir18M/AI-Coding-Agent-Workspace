import { BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon, AreaChart as AreaChartIcon, Table as TableIcon } from 'lucide-react'
import { cn } from '../../lib/shadcn/utils'
import type { ChartType } from './ChartRenderer'

const OPTIONS: { type: ChartType; label: string; icon: typeof BarChart3 }[] = [
  { type: 'bar', label: 'Bar', icon: BarChart3 },
  { type: 'line', label: 'Line', icon: LineChartIcon },
  { type: 'area', label: 'Area', icon: AreaChartIcon },
  { type: 'pie', label: 'Pie', icon: PieChartIcon },
  { type: 'table', label: 'Table', icon: TableIcon },
]

type Props = {
  value: ChartType
  onChange: (type: ChartType) => void
  /** Restrict to a subset, e.g. omit 'pie' when there's no name/value pairing available. */
  allow?: ChartType[]
}

export function ChartTypeSwitcher({ value, onChange, allow }: Props) {
  const options = allow ? OPTIONS.filter((o) => allow.includes(o.type)) : OPTIONS
  return (
    <div className="inline-flex items-center gap-0.5 rounded-md border border-border bg-muted/40 p-0.5">
      {options.map(({ type, label, icon: Icon }) => (
        <button
          key={type}
          type="button"
          aria-label={`Show as ${label} chart`}
          title={label}
          onClick={() => onChange(type)}
          className={cn(
            'flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors',
            value === type ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  )
}
