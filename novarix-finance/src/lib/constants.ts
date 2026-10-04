import {
  BarChart3,
  CreditCard,
  Target,
  Wallet,
  LayoutDashboard,
  Receipt,
  Lightbulb,
  Settings,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const ROUTES = {
  landing: '/',
  login: '/login',
  signup: '/signup',
  app: '/app',
  transactions: '/transactions',
  accounts: '/accounts',
  budgets: '/budgets',
  goals: '/goals',
  insights: '/insights',
  analytics: '/analytics',
  settings: '/settings',
}

export const PRIMARY_NAV: NavItem[] = [
  { to: ROUTES.app, label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: ROUTES.transactions, label: 'Transactions', icon: Receipt },
  { to: ROUTES.accounts, label: 'Accounts', icon: Wallet },
  { to: ROUTES.budgets, label: 'Budgets', icon: CreditCard },
  { to: ROUTES.goals, label: 'Goals', icon: Target },
]

export const SECONDARY_NAV: NavItem[] = [
  { to: ROUTES.insights, label: 'Insights', icon: Lightbulb },
  { to: ROUTES.analytics, label: 'Analytics', icon: BarChart3 },
  { to: ROUTES.settings, label: 'Settings', icon: Settings },
]

export const BRANDING_CREDIT = 'Novarix Finance'