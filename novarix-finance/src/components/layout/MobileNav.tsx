import { NavLink } from 'react-router-dom'
import { PRIMARY_NAV } from '@/lib/constants'
import { cn } from '@/lib/utils'

/** Bottom tab bar for mobile browsers. Hidden from the md breakpoint up. */
export function MobileNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {PRIMARY_NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex h-14 flex-col items-center justify-center gap-1 text-[11px] leading-none transition-colors',
                  isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
                )
              }
            >
              <Icon size={18} strokeWidth={1.75} aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
