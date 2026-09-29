import { useEffect } from 'react'
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { DollarSign, ShoppingCart, Users, TrendingUp } from 'lucide-react'
import { useGetBusinessAnalytics } from '../hooks/backend/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { Skeleton } from '../lib/shadcn/skeleton'
import type { BusinessAnalytics } from './data/analyticsTypes'

const PIE_COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))']

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function tooltipCurrency(value: unknown): string {
  return formatCurrency(typeof value === 'number' ? value : Number(value ?? 0))
}

function renderCategoryLabel(props: unknown): string {
  if (props && typeof props === 'object' && 'category' in props) {
    return String((props as Record<string, unknown>)['category'] ?? '')
  }
  return ''
}

function KpiCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof DollarSign }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <Icon className="h-8 w-8 text-muted-foreground" />
      </CardContent>
    </Card>
  )
}

export default function Analytics() {
  const { data, loading, error, trigger } = useGetBusinessAnalytics() as {
    data: BusinessAnalytics | null
    loading: boolean
    error: string | null
    trigger: () => void
  }

  useEffect(() => {
    trigger()
  }, [])

  if (error) {
    return <div className="p-6 text-sm text-destructive">{error}</div>
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Live aggregations computed directly from the business database.</p>
      </div>

      {loading && !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total revenue" value={formatCurrency(data?.totalRevenue ?? 0)} icon={DollarSign} />
          <KpiCard label="Total orders" value={String(data?.totalOrders ?? 0)} icon={ShoppingCart} />
          <KpiCard label="Customers with orders" value={String(data?.totalCustomers ?? 0)} icon={Users} />
          <KpiCard label="Avg order value" value={formatCurrency(data?.averageOrderValue ?? 0)} icon={TrendingUp} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by region</CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.revenueByRegion.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.revenueByRegion}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={tooltipCurrency} />
                  <Bar dataKey="revenue" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue by category</CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.revenueByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.revenueByCategory}
                    dataKey="revenue"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={renderCategoryLabel}
                  >
                    {data.revenueByCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length] ?? 'hsl(var(--chart-1))'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={tooltipCurrency} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly revenue (last 6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          {data && data.monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={tooltipCurrency} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No data.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top products by revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {data && data.topProducts.length > 0 ? (
            <div className="divide-y divide-border">
              {data.topProducts.map((p) => (
                <div key={p.product} className="flex items-center justify-between py-2 text-sm">
                  <span className="font-medium">{p.product}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(p.revenue)} · {p.unitsSold} units
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">No data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
