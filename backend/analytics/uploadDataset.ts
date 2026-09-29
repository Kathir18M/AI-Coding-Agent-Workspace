const MAX_ROWS = 2000
const MAX_COLUMNS = 50
const MAX_NAME_LENGTH = 100

interface Params {
  name: string
  originalFilename?: string
  columns: string[]
  rows: Record<string, unknown>[]
}

interface UploadedDatasetSummary {
  id: number
  name: string
  originalFilename: string | null
  columns: string[]
  rowCount: number
  uploadedBy: string | null
  createdAt: string
}

export default async function uploadDataset(req: { params: Params; user: User }): Promise<UploadedDatasetSummary> {
  const name = (req.params.name ?? '').trim().slice(0, MAX_NAME_LENGTH)
  const columns = Array.isArray(req.params.columns) ? req.params.columns.slice(0, MAX_COLUMNS) : []
  const rows = Array.isArray(req.params.rows) ? req.params.rows.slice(0, MAX_ROWS) : []

  if (!name) {
    throw new Error('Please provide a name for this dataset.')
  }
  if (columns.length === 0) {
    throw new Error('The uploaded file has no columns.')
  }
  if (rows.length === 0) {
    throw new Error('The uploaded file has no data rows.')
  }

  const inserted = await retoolDb.query<{
    id: number
    name: string
    original_filename: string | null
    columns: string[]
    row_count: number
    uploaded_by: string | null
    created_at: string
  }>(
    `INSERT INTO uploaded_datasets (name, original_filename, columns, rows, row_count, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, original_filename, columns, row_count, uploaded_by, created_at`,
    [
      name,
      req.params.originalFilename ?? null,
      JSON.stringify(columns),
      JSON.stringify(rows),
      rows.length,
      req.user.fullName ?? req.user.email,
    ],
  )

  const row = inserted.data[0]
  if (!row) throw new Error('Failed to save the uploaded dataset.')

  return {
    id: row.id,
    name: row.name,
    originalFilename: row.original_filename,
    columns: row.columns,
    rowCount: row.row_count,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  }
}
