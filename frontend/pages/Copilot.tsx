import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Sparkles, Send, Loader2, AlertCircle, Code2, MessageSquare } from 'lucide-react'
import { useAskQuestion } from '../hooks/backend/analytics'
import { Button } from '../lib/shadcn/button'
import { Textarea } from '../lib/shadcn/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '../lib/shadcn/card'
import { DynamicTable } from './ui/DynamicTable'
import { ChartRenderer, deriveChartConfig, type ChartType } from './ui/ChartRenderer'
import { ChartTypeSwitcher } from './ui/ChartTypeSwitcher'
import type { AskQuestionResult, ConversationTurn } from './data/analyticsTypes'

const EXAMPLE_QUESTIONS = [
  'What is the total revenue by region?',
  'Show monthly revenue trend',
  'Which are the top 5 products by revenue?',
  'How many orders are pending vs delivered?',
  'What is the average order value by category?',
]

type Exchange = {
  question: string
  result: AskQuestionResult | null
  loading: boolean
  chartTypeOverride?: ChartType
}

export default function Copilot() {
  const { trigger } = useAskQuestion() as {
    trigger: (params: { question: string; conversation?: ConversationTurn[] }) => { result: Promise<AskQuestionResult> }
  }
  const [question, setQuestion] = useState('')
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const rerunHandled = useRef(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [exchanges.length])

  useEffect(() => {
    const state = location.state as { rerunQuestion?: string } | null
    if (state?.rerunQuestion && !rerunHandled.current) {
      rerunHandled.current = true
      ask(state.rerunQuestion)
      navigate(location.pathname, { replace: true, state: {} })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state])

  async function ask(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    setQuestion('')
    setExchanges((prev) => [...prev, { question: trimmed, result: null, loading: true }])

    const conversation: ConversationTurn[] = exchanges
      .filter((e) => e.result)
      .map((e) => ({ question: e.question, sql: e.result?.sql ?? null, insight: e.result?.insight ?? null }))

    try {
      const handle = trigger({ question: trimmed, conversation })
      const result = await handle.result
      setExchanges((prev) => prev.map((e, i) => (i === prev.length - 1 ? { ...e, result, loading: false } : e)))
    } catch {
      const failResult: AskQuestionResult = {
        historyId: 0,
        question: trimmed,
        sql: null,
        columns: [],
        rows: [],
        rowCount: 0,
        chart: null,
        insight: null,
        executionTimeMs: 0,
        status: 'error',
        errorMessage: 'Something went wrong while processing this question. Please try again.',
      }
      setExchanges((prev) => prev.map((e, i) => (i === prev.length - 1 ? { ...e, result: failResult, loading: false } : e)))
    }
  }

  const hasConversation = exchanges.length > 0

  return (
    <div className="flex h-full min-h-0">
      {/* Sidebar: history within this session */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card p-4 lg:flex">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="h-4 w-4" />
          This conversation
        </h2>
        {exchanges.length === 0 ? (
          <p className="text-xs text-muted-foreground">Your questions in this session will appear here.</p>
        ) : (
          <div className="space-y-2 overflow-y-auto">
            {exchanges.map((e, i) => (
              <div key={i} className="rounded-md border border-border p-2 text-xs">
                <p className="line-clamp-2 font-medium">{e.question}</p>
                {e.result && (
                  <p className="mt-1 text-muted-foreground">
                    {e.result.status === 'success' ? `${e.result.rowCount} rows · ${e.result.executionTimeMs}ms` : 'Failed'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </aside>

      {/* Main conversation area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-4xl space-y-6">
            {!hasConversation && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <h1 className="text-xl font-semibold">Ask anything about your business data</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  Questions are answered by generating SQL against a read-only analytics database. Try one of these:
                </p>
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_QUESTIONS.map((eq) => (
                    <button
                      key={eq}
                      onClick={() => ask(eq)}
                      className="rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-sm text-secondary-foreground hover:bg-secondary"
                    >
                      {eq}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {exchanges.map((exchange, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-end">
                  <div className="max-w-2xl rounded-2xl rounded-tr-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                    {exchange.question}
                  </div>
                </div>

                {exchange.loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating SQL, running query, and building insight…
                  </div>
                )}

                {exchange.result && exchange.result.status === 'error' && (
                  <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="flex items-start gap-2 p-4 text-sm text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-medium">Couldn't answer that question</p>
                        <p className="text-destructive/90">{exchange.result.errorMessage}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {exchange.result && exchange.result.status === 'success' && (
                  <div className="space-y-3">
                    {exchange.result.sql && (
                      <Card>
                        <CardHeader className="py-3">
                          <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Code2 className="h-3.5 w-3.5" />
                            Generated SQL
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                            <code>{exchange.result.sql}</code>
                          </pre>
                        </CardContent>
                      </Card>
                    )}

                    {exchange.result.insight && (
                      <Card className="border-primary/30 bg-primary/5">
                        <CardContent className="flex items-start gap-2 p-4 text-sm">
                          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <p>{exchange.result.insight}</p>
                        </CardContent>
                      </Card>
                    )}

                    {exchange.result.chart && (
                      <Card>
                        <CardContent className="space-y-2 pt-4">
                          <div className="flex justify-end">
                            <ChartTypeSwitcher
                              value={exchange.chartTypeOverride ?? exchange.result.chart.type}
                              onChange={(type) =>
                                setExchanges((prev) =>
                                  prev.map((e, idx) => (idx === i ? { ...e, chartTypeOverride: type } : e)),
                                )
                              }
                            />
                          </div>
                          <ChartRenderer
                            chart={deriveChartConfig(exchange.result.chart, exchange.chartTypeOverride ?? exchange.result.chart.type)}
                            rows={exchange.result.rows}
                          />
                        </CardContent>
                      </Card>
                    )}

                    <DynamicTable columns={exchange.result.columns} rows={exchange.result.rows} maxHeight="320px" />

                    <p className="text-xs text-muted-foreground">
                      {exchange.result.rowCount} row(s) · {exchange.result.executionTimeMs}ms
                    </p>
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-border p-4">
          <div className="mx-auto flex max-w-4xl items-end gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  ask(question)
                }
              }}
              placeholder="Ask a question about your customers, orders, or products…"
              className="min-h-[44px] resize-none"
              rows={1}
            />
            <Button onClick={() => ask(question)} disabled={!question.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="mx-auto mt-2 max-w-4xl text-xs text-muted-foreground">Read-only analytics mode — the AI can only run SELECT queries.</p>
        </div>
      </div>
    </div>
  )
}
