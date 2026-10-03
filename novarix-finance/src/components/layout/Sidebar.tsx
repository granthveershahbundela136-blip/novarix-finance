import { Link, NavLink } from 'react-router-dom'
import { LogOut, Moon, Sun } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/hooks/useTheme'
import { PRIMARY_NAV, ROUTES, SECONDARY_NAV, type NavItem } from '@/lib/constants'
import { cn } from '@/lib/utils'

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors',
          isActive
            ? 'bg-subtle font-medium text-foreground'
            : 'text-muted-foreground hover:bg-subtle hover:text-foreground',
        )
      }
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden />
      {item.label}
    </NavLink>
  )
}

/** Desktop and laptop navigation. Hidden below the md breakpoint, where MobileNav takes over. */
export function Sidebar() {
  const { user, displayName, signOut } = useAuth()
  const { isDark, toggle } = useTheme()

  return (
    <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-12 shrink-0 items-center border-b border-border px-4">
        <Link to={ROUTES.app} className="text-sm font-semibold tracking-wide">
          NOVARIX FINANCE
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {PRIMARY_NAV.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
        <div className="my-2 border-t border-border" />
        {SECONDARY_NAV.map((item) => (
          <SidebarLink key={item.to} item={item} />
        ))}
      </nav>

      <div className="flex items-center gap-1 border-t border-border p-2">
        <div className="min-w-0 flex-1 px-1.5">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <button type="button" className="btn-icon" onClick={toggle} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button type="button" className="btn-icon" onClick={() => void signOut()} aria-label="Log out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
