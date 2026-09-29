import { useEffect } from 'react'
import { CheckCircle2, XCircle, Database, Sparkles, ShieldCheck, Rows3 } from 'lucide-react'
import { useHealth } from '../hooks/backend/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { Skeleton } from '../lib/shadcn/skeleton'
import type { HealthStatus } from './data/analyticsTypes'

function StatusRow({ label, ok, icon: Icon }: { label: string; ok: boolean; icon: typeof Database }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border p-3">
      <div className="flex items-center gap-2 text-sm">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {label}
      </div>
      {ok ? (
        <span className="flex items-center gap-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> Connected
        </span>
      ) : (
        <span className="flex items-center gap-1 text-sm font-medium text-red-600 dark:text-red-400">
          <XCircle className="h-4 w-4" /> Unavailable
        </span>
      )}
    </div>
  )
}

export default function Settings() {
  const { data, loading, error, trigger } = useHealth() as {
    data: HealthStatus | null
    loading: boolean
    error: string | null
    trigger: () => void
  }

  useEffect(() => {
    trigger()
  }, [])

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Connectivity, AI configuration, and safety settings for this copilot.</p>
      </div>

      {error ? <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connectivity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading && !data ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : (
            <>
              <StatusRow label="Database (retoolDb / Postgres)" ok={data?.databaseConnected ?? false} icon={Database} />
              <StatusRow label="AI provider (Anthropic)" ok={data?.aiConnected ?? false} icon={Sparkles} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
            <span className="text-muted-foreground">Default model</span>
            <span className="font-mono">{data?.defaultModel ?? '—'}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Safety</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Rows3 className="h-4 w-4" /> Max rows per query
            </span>
            <span className="font-mono">{data?.maxResultRows ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950">
            <span className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="h-4 w-4" /> Read-only analytics mode
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-300">Always on</span>
          </div>
          <p className="pt-1 text-xs text-muted-foreground">
            Generated SQL is restricted to single SELECT statements against known business tables. Any INSERT, UPDATE, DELETE, DROP,
            or other write/DDL keyword is rejected before execution.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
