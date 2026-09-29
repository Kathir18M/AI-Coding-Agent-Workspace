// Frontend-side mirror of the backend's analytics types (backend/analytics/types.ts).
// Kept in sync manually since the frontend and backend compile independently.

export type QueryStatus = 'success' | 'error'
export type ChartType = 'bar' | 'line' | 'pie' | 'table'

export interface ChartConfig {
  type: ChartType
  xKey?: string
  yKey?: string
  nameKey?: string
  valueKey?: string
}

export interface ConversationTurn {
  question: string
  sql: string | null
  insight: string | null
}

export interface AskQuestionResult {
  historyId: number
  question: string
  sql: string | null
  columns: string[]
  rows: Record<string, unknown>[]
  rowCount: number
  chart: ChartConfig | null
  insight: string | null
  executionTimeMs: number
  status: QueryStatus
  errorMessage: string | null
}

export interface QueryHistoryEntry {
  id: number
  question: string
  generatedSql: string | null
  status: QueryStatus
  executionTimeMs: number | null
  rowCount: number | null
  resultSnapshot: Record<string, unknown>[] | null
  chartConfig: ChartConfig | null
  insight: string | null
  errorMessage: string | null
  createdBy: string | null
  createdAt: string
}

export interface DailyVolumePoint {
  date: string
  count: number
}

export interface DashboardStats {
  totalQueries: number
  successfulQueries: number
  failedQueries: number
  avgExecutionTimeMs: number
  recentQueries: QueryHistoryEntry[]
  dailyVolume: DailyVolumePoint[]
}

export interface RegionRevenue {
  region: string
  revenue: number
}

export interface CategoryRevenue {
  category: string
  revenue: number
}

export interface MonthlyRevenue {
  month: string
  revenue: number
}

export interface TopProduct {
  product: string
  revenue: number
  unitsSold: number
}

export interface BusinessAnalytics {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
  revenueByRegion: RegionRevenue[]
  revenueByCategory: CategoryRevenue[]
  monthlyRevenue: MonthlyRevenue[]
  topProducts: TopProduct[]
}

export interface ColumnInfo {
  name: string
  type: string
  description: string
}

export interface TableInfo {
  name: string
  description: string
  columns: ColumnInfo[]
}

export interface TableSample {
  table: TableInfo
  rows: Record<string, unknown>[]
  rowCount: number
}

export interface HealthStatus {
  databaseConnected: boolean
  aiConnected: boolean
  defaultModel: string
  maxResultRows: number
  readOnlyMode: true
  checkedAt: string
}

export interface HistoryListResult {
  entries: QueryHistoryEntry[]
  total: number
}

export interface UploadedDatasetSummary {
  id: number
  name: string
  originalFilename: string | null
  columns: string[]
  rowCount: number
  uploadedBy: string | null
  createdAt: string
}

export interface UploadedDatasetDetail extends UploadedDatasetSummary {
  rows: Record<string, unknown>[]
}
