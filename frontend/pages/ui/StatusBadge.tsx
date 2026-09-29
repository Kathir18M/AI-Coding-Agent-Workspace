import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '../../lib/shadcn/utils'

type Props = {
  status: 'success' | 'error'
  className?: string
}

export function StatusBadge({ status, className }: Props) {
  const isSuccess = status === 'success'
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        isSuccess
          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
          : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
        className,
      )}
    >
      {isSuccess ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {isSuccess ? 'Success' : 'Error'}
    </span>
  )
}
