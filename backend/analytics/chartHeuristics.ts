// Picks a sensible chart type for a SQL result set without any user configuration.

import type { ChartConfig } from './types'

function isNumeric(value: unknown): boolean {
  if (typeof value === 'number') return true
  if (typeof value === 'string' && value.trim() !== '') return !Number.isNaN(Number(value))
  return false
}

function looksLikeDate(key: string, value: unknown): boolean {
  if (/date|month|day|created_at|time/i.test(key)) return true
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return true
  return false
}

export function pickChartConfig(rows: Record<string, unknown>[]): ChartConfig | null {
  if (rows.length === 0) return null
  const first = rows[0]
  if (!first) return null
  const columns = Object.keys(first)
  if (columns.length < 2) return null

  const numericCols = columns.filter((c) => isNumeric(first[c]))
  const nonNumericCols = columns.filter((c) => !numericCols.includes(c))

  if (numericCols.length === 0) return null

  const yKey = numericCols[0]
  if (!yKey) return null

  // A date/time-like dimension with a number -> line chart (trend over time).
  const dateCol = nonNumericCols.find((c) => looksLikeDate(c, first[c]))
  if (dateCol) {
    return { type: 'line', xKey: dateCol, yKey }
  }

  const categoryCol = nonNumericCols[0]
  if (categoryCol) {
    const distinctValues = new Set(rows.map((r) => String(r[categoryCol])))
    // Few distinct categories -> pie chart works well; otherwise a bar chart.
    if (distinctValues.size > 1 && distinctValues.size <= 8 && rows.length <= 30) {
      return { type: 'pie', nameKey: categoryCol, valueKey: yKey }
    }
    return { type: 'bar', xKey: categoryCol, yKey }
  }

  return null
}
