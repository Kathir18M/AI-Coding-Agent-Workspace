export type DiffLine = {
  type: 'equal' | 'add' | 'remove'
  text: string
}

/**
 * Simple LCS-based line diff. Adequate for the small, agent-proposed files this app deals
 * with — not optimized for huge inputs.
 */
export function diffLines(oldText: string, newText: string): DiffLine[] {
  const a = oldText.length ? oldText.split('\n') : []
  const b = newText.length ? newText.split('\n') : []
  const n = a.length
  const m = b.length

  // dp[i][j] = length of LCS of a[i:] and b[j:]
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      const rowI = dp[i]
      const rowI1 = dp[i + 1]
      if (rowI === undefined || rowI1 === undefined) continue
      if (a[i] === b[j]) {
        rowI[j] = (rowI1[j + 1] ?? 0) + 1
      } else {
        rowI[j] = Math.max(rowI1[j] ?? 0, rowI[j + 1] ?? 0)
      }
    }
  }

  const result: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    const rowI = dp[i]
    const rowI1 = dp[i + 1]
    if (a[i] === b[j]) {
      result.push({ type: 'equal', text: a[i] ?? '' })
      i++
      j++
    } else if ((rowI1?.[j] ?? 0) >= (rowI?.[j + 1] ?? 0)) {
      result.push({ type: 'remove', text: a[i] ?? '' })
      i++
    } else {
      result.push({ type: 'add', text: b[j] ?? '' })
      j++
    }
  }
  while (i < n) {
    result.push({ type: 'remove', text: a[i] ?? '' })
    i++
  }
  while (j < m) {
    result.push({ type: 'add', text: b[j] ?? '' })
    j++
  }
  return result
}
