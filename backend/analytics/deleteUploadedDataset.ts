interface Params {
  id: number
}

export default async function deleteUploadedDataset(req: { params: Params }): Promise<{ deleted: boolean }> {
  await retoolDb.deleteBy({
    tableName: 'uploaded_datasets',
    filterBy: [{ key: 'id', operation: '=', value: req.params.id }],
    doNotThrowOnNoOp: true,
  })
  return { deleted: true }
}
