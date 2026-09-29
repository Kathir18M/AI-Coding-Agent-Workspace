interface Params {
  id: number
}

interface UploadedDatasetDetail {
  id: number
  name: string
  originalFilename: string | null
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  uploadedBy: string | null
  createdAt: string
}

export default async function getUploadedDatasetById(req: { params: Params }): Promise<UploadedDatasetDetail | null> {
  const result = await retoolDb.query<{
    id: number
    name: string
    original_filename: string | null
    columns: string[]
    rows: Record<string, unknown>[]
    row_count: number
    uploaded_by: string | null
    created_at: string
  }>(
    `SELECT id, name, original_filename, columns, rows, row_count, uploaded_by, created_at
     FROM uploaded_datasets
     WHERE id = $1`,
    [req.params.id],
  )

  const row = result.data[0]
  if (!row) return null

  return {
    id: row.id,
    name: row.name,
    originalFilename: row.original_filename,
    columns: row.columns,
    rows: row.rows.slice(0, 200),
    rowCount: row.row_count,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  }
}
