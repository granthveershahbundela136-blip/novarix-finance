import { Link, Outlet } from 'react-router-dom'
import { LogOut, Moon, Sun } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/hooks/useTheme'
import { ROUTES, SECONDARY_NAV } from '@/lib/constants'
import { MobileNav } from './MobileNav'
import { Sidebar } from './Sidebar'

/** Authenticated layout: sidebar on desktop, top bar + bottom tabs on mobile. */
export function AppShell() {
  const { signOut } = useAuth()
  const { isDark, toggle } = useTheme()

  return (
    <div className="flex h-dvh bg-background">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
          <Link to={ROUTES.app} className="text-sm font-semibold tracking-wide">
            NOVARIX FINANCE
          </Link>
          <div className="flex items-center">
            {SECONDARY_NAV.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="btn-icon" aria-label={label}>
                <Icon size={16} />
              </Link>
            ))}
            <button type="button" className="btn-icon" onClick={toggle} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button type="button" className="btn-icon" onClick={() => void signOut()} aria-label="Log out">
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
