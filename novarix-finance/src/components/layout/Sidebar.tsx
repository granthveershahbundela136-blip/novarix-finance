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
      {Icon ? <Icon size={16} strokeWidth={1.75} aria-hidden /> : null}
      {item.label}
    </NavLink>
  )
}