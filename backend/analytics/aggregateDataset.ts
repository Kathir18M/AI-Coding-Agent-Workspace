// Aggregates raw dataset rows (from an uploaded CSV/JSON dataset) into chart-ready rows,
// grouped by a chosen column and summarized by another.

export type Aggregation = 'none' | 'count' | 'sum' | 'avg'

const MAX_GROUPS = 20
const MAX_RAW_ROWS = 200

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const n = Number(value.replace(/,/g, ''))
    return Number.isNaN(n) ? 0 : n
  }
  return 0
}

export function aggregateRows(
  rows: Record<string, unknown>[],
  xKey: string,
  yKey: string | null,
  aggregation: Aggregation,
): Record<string, unknown>[] {
  if (aggregation === 'none') {
    const yk = yKey ?? xKey
    return rows.slice(0, MAX_RAW_ROWS).map((r) => ({ [xKey]: r[xKey] ?? '', [yk]: toNumber(r[yk]) }))
  }

  const groups = new Map<string, { sum: number; count: number }>()
  for (const row of rows) {
    const key = String(row[xKey] ?? 'Unknown')
    const existing = groups.get(key) ?? { sum: 0, count: 0 }
    existing.count += 1
    if (yKey) existing.sum += toNumber(row[yKey])
    groups.set(key, existing)
  }

  const yLabel = aggregation === 'count' ? 'count' : (yKey ?? 'value')
  let entries = Array.from(groups.entries()).map(([key, agg]) => {
    let value = agg.count
    if (aggregation === 'sum') value = agg.sum
    if (aggregation === 'avg') value = agg.count > 0 ? agg.sum / agg.count : 0
    return { [xKey]: key, [yLabel]: Math.round(value * 100) / 100 }
  })

  entries = entries.sort((a, b) => Number(b[yLabel]) - Number(a[yLabel])).slice(0, MAX_GROUPS)
  return entries
}

export function resolveYLabel(yKey: string | null, aggregation: Aggregation): string {
  if (aggregation === 'count') return 'count'
  return yKey ?? 'value'
}
