import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { LogOut, Menu, Moon, Sun, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/hooks/useTheme'
import { PRIMARY_NAV, ROUTES, SECONDARY_NAV } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, displayName, signOut } = useAuth()
  const { isDark, toggle } = useTheme()

  const closeNav = () => setIsOpen(false)

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-surface px-4 md:hidden">
      <Link to={ROUTES.app} className="text-sm font-semibold tracking-wide">
        NOVARIX FINANCE
      </Link>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn-icon"
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
      >
        {isOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {isOpen && (
        <div className="fixed inset-x-0 top-12 bottom-0 z-50 flex flex-col bg-surface p-4 border-t border-border">
          <nav className="flex-1 space-y-1 overflow-y-auto">
            {PRIMARY_NAV.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeNav}
                  className={({ isActive }) =>
                    cn(
                      'flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors',
                      isActive
                        ? 'bg-subtle font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-subtle hover:text-foreground'
                    )
                  }
                >
                  {Icon ? <Icon size={18} /> : null}
                  {item.label}
                </NavLink>
              )
            })}

            <div className="my-2 border-t border-border" />

            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeNav}
                  className={({ isActive }) =>
                    cn(
                      'flex h-10 items-center gap-3 rounded-md px-3 text-sm transition-colors',
                      isActive
                        ? 'bg-subtle font-medium text-foreground'
                        : 'text-muted-foreground hover:bg-subtle hover:text-foreground'
                    )
                  }
                >
                  {Icon ? <Icon size={18} /> : null}
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="flex items-center gap-2 border-t border-border pt-3 mt-auto">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <button
              type="button"
              className="btn-icon"
              onClick={toggle}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              type="button"
              className="btn-icon"
              onClick={() => {
                closeNav()
                void signOut()
              }}
              aria-label="Log out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      )}
    </header>
  )
}