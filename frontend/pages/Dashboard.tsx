import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ListChecks, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { useGetDashboardStats } from '../hooks/backend/analytics'
import type { DashboardStats } from './data/analyticsTypes'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { Button } from '../lib/shadcn/button'
import { Skeleton } from '../lib/shadcn/skeleton'
import { StatusBadge } from './ui/StatusBadge'
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

function KpiCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Sparkles }) {
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

export default function Dashboard() {
  const { data, loading, error, dataAccessErrors, trigger } = useGetDashboardStats() as {
    data: DashboardStats | null
    loading: boolean
    error: string | null
    dataAccessErrors: { message: string }[]
    trigger: () => void
  }

  useEffect(() => {
    trigger()
  }, [])

  const successFailData = data
    ? [
        { name: 'Success', value: data.successfulQueries },
        { name: 'Failed', value: data.failedQueries },
      ]
    : []

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your AI-powered analytics activity.</p>
        </div>
        <Button asChild>
          <Link to="/copilot">
            <Sparkles className="mr-2 h-4 w-4" />
            Ask a question
          </Link>
        </Button>
      </div>

      {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div> : null}
      {!error && dataAccessErrors.length > 0 ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {dataAccessErrors.map((e) => e.message).join('; ')}
        </div>
      ) : null}

      {loading && !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total queries" value={String(data?.totalQueries ?? 0)} icon={ListChecks} />
          <KpiCard label="Successful" value={String(data?.successfulQueries ?? 0)} icon={CheckCircle2} />
          <KpiCard label="Failed" value={String(data?.failedQueries ?? 0)} icon={XCircle} />
          <KpiCard label="Avg execution time" value={`${data?.avgExecutionTimeMs ?? 0} ms`} icon={Clock} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Daily query volume (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.dailyVolume.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No queries yet in the last 14 days.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Success vs. failure</CardTitle>
          </CardHeader>
          <CardContent>
            {data && (data.successfulQueries > 0 || data.failedQueries > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={successFailData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.name}`}>
                    <Cell fill="hsl(var(--chart-1))" />
                    <Cell fill="hsl(var(--chart-4))" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No queries yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent queries</CardTitle>
        </CardHeader>
        <CardContent>
          {data && data.recentQueries.length > 0 ? (
            <div className="divide-y divide-border">
              {data.recentQueries.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{q.question}</p>
                    <p className="text-xs text-muted-foreground">{new Date(q.createdAt).toLocaleString()}</p>
                  </div>
                  <StatusBadge status={q.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No questions asked yet.{' '}
              <Link to="/copilot" className="text-primary underline">
                Ask your first question
              </Link>
              .
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
