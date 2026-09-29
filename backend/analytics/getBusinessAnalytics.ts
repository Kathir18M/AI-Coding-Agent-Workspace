interface RegionRevenue {
  region: string
  revenue: number
}

interface CategoryRevenue {
  category: string
  revenue: number
}

interface MonthlyRevenue {
  month: string
  revenue: number
}

interface TopProduct {
  product: string
  revenue: number
  unitsSold: number
}

interface BusinessAnalytics {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
  revenueByRegion: RegionRevenue[]
  revenueByCategory: CategoryRevenue[]
  monthlyRevenue: MonthlyRevenue[]
  topProducts: TopProduct[]
}

export default async function getBusinessAnalytics(): Promise<BusinessAnalytics> {
  const kpis = await retoolDb.query<{ revenue: string | null; orders: string; customers: string; aov: string | null }>(
    `SELECT
       COALESCE(SUM(total_amount), 0) AS revenue,
       count(*) AS orders,
       count(DISTINCT customer_id) AS customers,
       COALESCE(AVG(total_amount), 0) AS aov
     FROM orders
     WHERE status != 'cancelled'`,
  )
  const kpiRow = kpis.data[0]

  const byRegion = await retoolDb.query<{ region: string; revenue: string }>(
    `SELECT c.region, SUM(o.total_amount) AS revenue
     FROM orders o JOIN customers c ON c.id = o.customer_id
     WHERE o.status != 'cancelled'
     GROUP BY c.region
     ORDER BY revenue DESC`,
  )

  const byCategory = await retoolDb.query<{ category: string; revenue: string }>(
    `SELECT p.category, SUM(oi.quantity * oi.unit_price) AS revenue
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     JOIN orders o ON o.id = oi.order_id
     WHERE o.status != 'cancelled'
     GROUP BY p.category
     ORDER BY revenue DESC`,
  )

  const monthly = await retoolDb.query<{ month: string; revenue: string }>(
    `SELECT to_char(date_trunc('month', order_date), 'YYYY-MM') AS month, SUM(total_amount) AS revenue
     FROM orders
     WHERE status != 'cancelled' AND order_date >= date_trunc('month', now()) - interval '5 months'
     GROUP BY 1
     ORDER BY 1`,
  )

  const topProducts = await retoolDb.query<{ product: string; revenue: string; units_sold: string }>(
    `SELECT p.name AS product, SUM(oi.quantity * oi.unit_price) AS revenue, SUM(oi.quantity) AS units_sold
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     JOIN orders o ON o.id = oi.order_id
     WHERE o.status != 'cancelled'
     GROUP BY p.name
     ORDER BY revenue DESC
     LIMIT 10`,
  )

  return {
    totalRevenue: Number(kpiRow?.revenue ?? 0),
    totalOrders: parseInt(kpiRow?.orders ?? '0', 10),
    totalCustomers: parseInt(kpiRow?.customers ?? '0', 10),
    averageOrderValue: Number(kpiRow?.aov ?? 0),
    revenueByRegion: byRegion.data.map((r) => ({ region: r.region, revenue: Number(r.revenue) })),
    revenueByCategory: byCategory.data.map((r) => ({ category: r.category, revenue: Number(r.revenue) })),
    monthlyRevenue: monthly.data.map((r) => ({ month: r.month, revenue: Number(r.revenue) })),
    topProducts: topProducts.data.map((r) => ({ product: r.product, revenue: Number(r.revenue), unitsSold: parseInt(r.units_sold, 10) })),
  }
}
