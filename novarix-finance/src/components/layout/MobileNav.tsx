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
      {Icon ? <Icon size={18} strokeWidth={1.75} aria-hidden /> : null}
      {label}
    </NavLink>
  </li>
))}