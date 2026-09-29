// Validates AI-generated SQL before it ever reaches the database.
// Enforces: single statement, SELECT-only, known tables only, no DDL/DML keywords.

import { ALLOWED_QUERY_TABLES, MAX_RESULT_ROWS } from './types'

const FORBIDDEN_KEYWORDS = [
  'insert', 'update', 'delete', 'drop', 'alter', 'truncate', 'create',
  'grant', 'revoke', 'exec', 'execute', 'call', 'copy', 'merge',
  'vacuum', 'comment', 'listen', 'notify', 'do', 'lock', 'into',
]

export interface SqlValidationResult {
  ok: boolean
  sql: string
  reason?: string
}

/** Extracts a bare SQL string from a model response that may wrap it in markdown fences or prose. */
export function extractSql(raw: string): string {
  const fenced = raw.match(/```(?:sql)?\s*([\s\S]*?)```/i)
  let candidate = fenced ? fenced[1] : raw
  candidate = candidate?.trim() ?? ''
  // If the model still prefixed prose, take from the first SELECT/WITH onward.
  const match = candidate.match(/\b(select|with)\b[\s\S]*/i)
  if (match) candidate = match[0]
  return candidate.trim().replace(/;+\s*$/g, '').trim()
}

export function validateSql(sqlInput: string): SqlValidationResult {
  const sql = sqlInput.trim()
  if (!sql) {
    return { ok: false, sql, reason: 'The AI did not return a SQL query.' }
  }
  if (sql.includes(';')) {
    return { ok: false, sql, reason: 'Only a single SQL statement is allowed.' }
  }
  const lower = sql.toLowerCase()
  if (!/^\s*(select|with)\b/.test(lower)) {
    return { ok: false, sql, reason: 'Only SELECT queries are allowed in this read-only analytics mode.' }
  }
  for (const kw of FORBIDDEN_KEYWORDS) {
    if (new RegExp(`(^|[^a-z_])${kw}([^a-z_]|$)`, 'i').test(lower)) {
      return { ok: false, sql, reason: `The query contains a disallowed keyword: "${kw}".` }
    }
  }

  // Extract referenced table names (after FROM / JOIN) and confirm each is in the allow-list.
  const tableMatches = [...lower.matchAll(/\b(?:from|join)\s+([a-z_][a-z0-9_]*)/g)].map((m) => m[1])
  const unknown = tableMatches.filter((t) => t && !(ALLOWED_QUERY_TABLES as readonly string[]).includes(t))
  if (unknown.length > 0) {
    return { ok: false, sql, reason: `Query references a table that is not allowed: ${unknown.join(', ')}.` }
  }
  if (tableMatches.length === 0) {
    return { ok: false, sql, reason: 'Could not determine which table the query reads from.' }
  }

  return { ok: true, sql: capRowLimit(sql) }
}

/** Adds or tightens a LIMIT clause so a single query can never return an unbounded result set. */
function capRowLimit(sql: string): string {
  const limitMatch = sql.match(/\blimit\s+(\d+)/i)
  if (limitMatch) {
    const current = parseInt(limitMatch[1] ?? '0', 10)
    if (current > MAX_RESULT_ROWS) {
      return sql.replace(/\blimit\s+\d+/i, `LIMIT ${MAX_RESULT_ROWS}`)
    }
    return sql
  }
  return `${sql} LIMIT ${MAX_RESULT_ROWS}`
}
