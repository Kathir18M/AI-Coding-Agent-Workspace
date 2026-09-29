// Lightweight parsers for the file types accepted by the dataset upload feature.
// Handles CSV/TSV (quoted fields, embedded delimiters/newlines) and JSON (array of objects).

export interface ParsedDataset {
  columns: string[]
  rows: Record<string, string>[]
}

function parseDelimitedRows(text: string, delimiter: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i++
      row.push(field)
      field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else {
      field += char
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

function fromDelimitedRows(rawRows: string[][]): ParsedDataset {
  if (rawRows.length === 0) return { columns: [], rows: [] }

  const header = rawRows[0] ?? []
  const columns = header.map((h, i) => h.trim() || `column_${i + 1}`)

  const rows = rawRows.slice(1).map((r) => {
    const record: Record<string, string> = {}
    columns.forEach((col, i) => {
      record[col] = r[i] ?? ''
    })
    return record
  })

  return { columns, rows }
}

export function parseCsv(text: string): ParsedDataset {
  return fromDelimitedRows(parseDelimitedRows(text.trim(), ','))
}

export function parseTsv(text: string): ParsedDataset {
  return fromDelimitedRows(parseDelimitedRows(text.trim(), '\t'))
}

/** Accepts a JSON array of flat objects, e.g. [{ "region": "North", "revenue": 100 }, ...]. */
export function parseJsonDataset(text: string): ParsedDataset {
  const parsed: unknown = JSON.parse(text)
  const records = Array.isArray(parsed) ? parsed : [parsed]

  const columnSet = new Set<string>()
  for (const record of records) {
    if (record && typeof record === 'object') {
      Object.keys(record as Record<string, unknown>).forEach((k) => columnSet.add(k))
    }
  }
  const columns = Array.from(columnSet)

  const rows = records.map((record) => {
    const out: Record<string, string> = {}
    const source = (record && typeof record === 'object' ? record : {}) as Record<string, unknown>
    for (const col of columns) {
      const value = source[col]
      out[col] = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value)
    }
    return out
  })

  return { columns, rows }
}

export type SupportedFileKind = 'csv' | 'tsv' | 'json'

export function detectFileKind(fileName: string): SupportedFileKind | null {
  const lower = fileName.toLowerCase()
  if (lower.endsWith('.csv')) return 'csv'
  if (lower.endsWith('.tsv')) return 'tsv'
  if (lower.endsWith('.json')) return 'json'
  return null
}

export function parseByFileKind(kind: SupportedFileKind, text: string): ParsedDataset {
  if (kind === 'csv') return parseCsv(text)
  if (kind === 'tsv') return parseTsv(text)
  return parseJsonDataset(text)
}
