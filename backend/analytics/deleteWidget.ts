interface Params {
  id: number
}

export default async function deleteWidget(req: { params: Params }): Promise<{ deleted: boolean }> {
  await retoolDb.deleteBy({
    tableName: 'dashboard_widgets',
    filterBy: [{ key: 'id', operation: '=', value: req.params.id }],
    doNotThrowOnNoOp: true,
  })
  return { deleted: true }
}
