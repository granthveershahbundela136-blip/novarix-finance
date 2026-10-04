import {
  ArrowLeftRight,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  PieChart,
  Settings,
  Target,
  type LucideIcon,
} from 'lucide-react'

export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Other Income'] as const
export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Education',
  'Health',
  'Travel',
  'Subscriptions',
  'Other',
] as const

export const ACCOUNT_TYPES = ['Cash', 'Bank', 'Savings', 'Wallet', 'Other'] as const

export const DEFAULT_CURRENCY = 'INR'
export const DEFAULT_LOCALE = 'en-IN'

export const BRANDING_CREDIT =
  'Novarix Finance - Crafted By Novarix - Founded By Granthveer Bundela'

export const ROUTES = {
  landing: '/',
  login: '/login',
  signup: '/signup',
  app: '/app',
  transactions: '/app/transactions',
  accounts: '/app/accounts',
  budgets: '/app/budgets',
  goals: '/app/goals',
  insights: '/app/insights',
  analytics: '/app/analytics',
  settings: '/app/settings',
} as const

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

/** Shown in the desktop sidebar and the mobile bottom bar (keep at 5 for mobile). */
export const PRIMARY_NAV: NavItem[] = [
  { label: 'Dashboard', to: ROUTES.app, icon: LayoutDashboard, end: true },
  { label: 'Transactions', to: ROUTES.transactions, icon: ArrowLeftRight },
  { label: 'Accounts', to: ROUTES.accounts, icon: Landmark },
  { label: 'Budgets', to: ROUTES.budgets, icon: PieChart },
  { label: 'Goals', to: ROUTES.goals, icon: Target },
]

/** Sidebar secondary group; icon buttons in the mobile top bar. */
export const SECONDARY_NAV: NavItem[] = [
  { label: 'Insights', to: ROUTES.insights, icon: Lightbulb },
  { label: 'Settings', to: ROUTES.settings, icon: Settings },
]
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' }
];