import { DEFAULT_LOCALE } from '@/lib/constants'
import type { Transaction } from '@/types'

/** A budget counts as "approaching" once this share of the limit is spent. */
export const BUDGET_APPROACHING_AT = 0.8

export type BudgetStatus = 'normal' | 'approaching' | 'exceeded'

export function budgetStatus(spent: number, limit: number): BudgetStatus {
  if (spent > limit) return 'exceeded'
  if (limit > 0 && spent / limit >= BUDGET_APPROACHING_AT) return 'approaching'
  return 'normal'
}

/** YYYY-MM for a date string (YYYY-MM-DD) or Date. */
export const monthKeyOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const monthOfISO = (iso: string) => iso.slice(0, 7)
const dayOfISO = (iso: string) => Number(iso.slice(8, 10))

/** First day of the month `delta` months away from `d`. */
export const shiftMonth = (d: Date, delta: number) => new Date(d.getFullYear(), d.getMonth() + delta, 1)
export const daysInMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()

export interface MonthSummary {
  income: number
  expenses: number
  net: number
  /** Expense totals by category. */
  byCategory: Map<string, number>
}

/** Totals for `month` (YYYY-MM), counting transactions up to and including `throughDay`. */
export function summarizeMonth(transactions: Transaction[], month: string, throughDay = 31): MonthSummary {
  let income = 0
  let expenses = 0
  const byCategory = new Map<string, number>()
  for (const t of transactions) {
    if (monthOfISO(t.date) !== month || dayOfISO(t.date) > throughDay) continue
    if (t.type === 'income') income += t.amount
    else {
      expenses += t.amount
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount)
    }
  }
  return { income, expenses, net: income - expenses, byCategory }
}

/** Month-to-date totals for the month containing `now`. */
export const summarizeCurrentMonth = (transactions: Transaction[], now: Date = new Date()) =>
  summarizeMonth(transactions, monthKeyOf(now), now.getDate())

export interface MonthPoint {
  key: string
  label: string
  income: number
  expenses: number
}

/** The last `count` months ending with the month of `now`, oldest first. */
export function monthlySeries(transactions: Transaction[], count: number, now: Date = new Date()): MonthPoint[] {
  const formatter = new Intl.DateTimeFormat(DEFAULT_LOCALE, { month: 'short', year: '2-digit' })
  const points: MonthPoint[] = []
  for (let i = count - 1; i >= 0; i--) {
    const date = shiftMonth(now, -i)
    const { income, expenses } = summarizeMonth(transactions, monthKeyOf(date))
    points.push({ key: monthKeyOf(date), label: formatter.format(date), income, expenses })
  }
  return points
}
