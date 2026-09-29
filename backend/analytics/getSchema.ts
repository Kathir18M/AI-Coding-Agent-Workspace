import { SCHEMA_TABLES, type TableInfo } from './schemaInfo'

export default async function getSchema(): Promise<TableInfo[]> {
  return SCHEMA_TABLES
}
