import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export type ChartType = 'bar' | 'line' | 'pie' | 'area' | 'table'

export type ChartConfig = {
  type: ChartType
  xKey?: string
  yKey?: string
  nameKey?: string
  valueKey?: string
}

export const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

const MULTI_COLOR_THRESHOLD = 12

function colorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] ?? 'hsl(var(--chart-1))'
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isNaN(n) ? 0 : n
  }
  return 0
}

function renderPieLabel(nameKey: string) {
  return (props: unknown): string => {
    if (props && typeof props === 'object' && nameKey in props) {
      return String((props as Record<string, unknown>)[nameKey] ?? '')
    }
    return ''
  }
}

type Props = {
  chart: ChartConfig | null
  rows: Record<string, unknown>[]
  height?: number
}

/** Rebuilds a ChartConfig for a different chart type, reusing whichever category/value keys are already known. */
export function deriveChartConfig(base: ChartConfig | null, type: ChartType): ChartConfig | null {
  const category = base?.xKey ?? base?.nameKey
  const value = base?.yKey ?? base?.valueKey
  if (!category || !value) return base ? { ...base, type } : null
  if (type === 'pie') return { type, nameKey: category, valueKey: value }
  if (type === 'table') return { type }
  return { type, xKey: category, yKey: value }
}

export function ChartRenderer({ chart, rows, height = 300 }: Props) {
  if (!chart || rows.length === 0) return null

  if (chart.type === 'bar' && chart.xKey && chart.yKey) {
    const xKey = chart.xKey
    const yKey = chart.yKey
    const data = rows.map((r) => ({ [xKey]: String(r[xKey] ?? ''), [yKey]: toNumber(r[yKey]) }))
    const multiColor = data.length <= MULTI_COLOR_THRESHOLD
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey={yKey} radius={[4, 4, 0, 0]} fill={colorAt(0)}>
            {multiColor && data.map((_, index) => <Cell key={index} fill={colorAt(index)} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (chart.type === 'area' && chart.xKey && chart.yKey) {
    const xKey = chart.xKey
    const yKey = chart.yKey
    const data = rows.map((r) => ({ [xKey]: String(r[xKey] ?? ''), [yKey]: toNumber(r[yKey]) }))
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorAt(0)} stopOpacity={0.6} />
              <stop offset="95%" stopColor={colorAt(0)} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Area type="monotone" dataKey={yKey} stroke={colorAt(0)} strokeWidth={2} fill="url(#areaFill)" />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  if (chart.type === 'line' && chart.xKey && chart.yKey) {
    const xKey = chart.xKey
    const yKey = chart.yKey
    const data = rows.map((r) => ({ [xKey]: String(r[xKey] ?? ''), [yKey]: toNumber(r[yKey]) }))
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Line type="monotone" dataKey={yKey} stroke={colorAt(0)} strokeWidth={2.5} dot={{ r: 3, fill: colorAt(0) }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chart.type === 'pie' && chart.nameKey && chart.valueKey) {
    const nameKey = chart.nameKey
    const valueKey = chart.valueKey
    const data = rows.map((r) => ({ [nameKey]: String(r[nameKey] ?? ''), [valueKey]: toNumber(r[valueKey]) }))
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie data={data} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={Math.min(100, height / 2.6)} label={renderPieLabel(nameKey)}>
            {data.map((_, index) => (
              <Cell key={index} fill={colorAt(index)} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  return null
}
