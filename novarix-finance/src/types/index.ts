import type { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/constants'

export type IncomeCategory = (typeof INCOME_CATEGORIES)[number]
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
export type Category = IncomeCategory | ExpenseCategory

export interface Profile {
  id: string
  full_name: string
  email: string
  currency: string
  created_at: string
}

export type AccountType = 'bank' | 'cash' | 'card' | 'wallet' | 'investment'

export interface Account {
  id: string
  user_id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  created_at: string
}

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  user_id: string
  account_id: string
  type: TransactionType
  category: Category
  amount: number
  note: string | null
  /** ISO date, YYYY-MM-DD */
  date: string
  created_at: string
}

export interface Budget {
  id: string
  user_id: string
  category: ExpenseCategory
  limit_amount: number
  /** First day of the budget month, YYYY-MM-DD */
  month: string
  created_at: string
}

export interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  /** ISO date, YYYY-MM-DD */
  deadline: string | null
  created_at: string
}

export type InsightSeverity = 'info' | 'positive' | 'warning' | 'critical'

export interface FinancialInsight {
  id: string
  user_id: string
  title: string
  message: string
  severity: InsightSeverity
  category: Category | null
  created_at: string
}
