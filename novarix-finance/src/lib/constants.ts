export const DEFAULT_LOCALE = 'en-US';

export const BRANDING_CREDIT = "Novarix Finance - Crafted By Novarix - Founded By Granthveer Bundela";

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  APP: '/app',
  DASHBOARD: '/app',
  TRANSACTIONS: '/app/transactions',
  ACCOUNTS: '/app/accounts',
  BUDGETS: '/app/budgets',
  GOALS: '/app/goals',
  INSIGHTS: '/app/insights',
  SETTINGS: '/app/settings'
};

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar ($)' },
  { code: 'EUR', name: 'Euro (€)' },
  { code: 'GBP', name: 'British Pound (£)' },
  { code: 'INR', name: 'Indian Rupee (₹)' },
  { code: 'CAD', name: 'Canadian Dollar (C$)' },
  { code: 'AUD', name: 'Australian Dollar (A$)' },
  { code: 'JPY', name: 'Japanese Yen (¥)' }
];

export const EXPENSE_CATEGORIES = [
  'Housing',
  'Utilities',
  'Food & Dining',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Shopping',
  'Personal Care',
  'Education',
  'Miscellaneous'
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts',
  'Other Income'
];

export const PRIMARY_NAV = [
  { label: 'Dashboard', path: '/app' },
  { label: 'Transactions', path: '/app/transactions' },
  { label: 'Accounts', path: '/app/accounts' },
  { label: 'Budgets', path: '/app/budgets' },
  { label: 'Goals', path: '/app/goals' },
  { label: 'Insights', path: '/app/insights' },
  { label: 'Settings', path: '/app/settings' }
];