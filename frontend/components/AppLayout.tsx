import { Link } from 'react-router-dom'
import { LayoutDashboard, Sparkles, History, BarChart3, Database, Settings as SettingsIcon, LayoutGrid } from 'lucide-react'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '../lib/shadcn/utils'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/copilot', label: 'AI Copilot', icon: Sparkles },
  { to: '/history', label: 'Query History', icon: History },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/explorer', label: 'Data Explorer', icon: Database },
  { to: '/builder', label: 'Dashboard Builder', icon: LayoutGrid },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="flex h-screen min-h-0 bg-background text-foreground">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            AI
          </span>
          <span className="text-sm font-semibold">Analytics Copilot</span>
        </div>
        <nav className="space-y-1 p-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  active ? 'bg-secondary text-secondary-foreground font-medium' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto space-y-1 border-t border-border p-3">
          <p className="px-2 pt-2 text-xs leading-5 text-muted-foreground">Read-only analytics mode</p>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
    </div>
  )
}
