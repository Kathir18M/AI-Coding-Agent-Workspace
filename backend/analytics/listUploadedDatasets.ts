interface UploadedDatasetSummary {
  id: number
  name: string
  originalFilename: string | null
  columns: string[]
  rowCount: number
  uploadedBy: string | null
  createdAt: string
}

export default async function listUploadedDatasets(): Promise<UploadedDatasetSummary[]> {
  const result = await retoolDb.query<{
    id: number
    name: string
    original_filename: string | null
    columns: string[]
    row_count: number
    uploaded_by: string | null
    created_at: string
  }>(
    `SELECT id, name, original_filename, columns, row_count, uploaded_by, created_at
     FROM uploaded_datasets
     ORDER BY created_at DESC`,
  )

  return result.data.map((row) => ({
    id: row.id,
    name: row.name,
    originalFilename: row.original_filename,
    columns: row.columns,
    rowCount: row.row_count,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  }))
}
