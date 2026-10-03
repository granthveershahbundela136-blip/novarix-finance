import { useCallback, useMemo } from 'react'
import { useCurrency } from '@/hooks/useCurrency'
import { useResource } from '@/hooks/useResource'
import { listAccounts, listBudgets, listGoals, listTransactions } from '@/lib/api'
import { summarizeCurrentMonth } from '@/lib/financeStats'
import { generateFinancialInsights } from '@/lib/insightsEngine'

/** Everything the dashboard, analytics and insights pages need, loaded once per page. */
export function useFinanceData() {
  const currency = useCurrency()
  const accounts = useResource(listAccounts, [])
  const transactions = useResource(() => listTransactions(), [])
  const budgets = useResource(listBudgets, [])
  const goals = useResource(listGoals, [])

  const now = useMemo(() => new Date(), [])
  const error = accounts.error ?? transactions.error ?? budgets.error ?? goals.error
  const ready = Boolean(accounts.data && transactions.data && budgets.data && goals.data)

  const month = useMemo(() => summarizeCurrentMonth(transactions.data ?? [], now), [transactions.data, now])

  const insights = useMemo(
    () =>
      transactions.data && budgets.data && goals.data
        ? generateFinancialInsights(transactions.data, budgets.data, goals.data, month.income, month.expenses, {
            now,
            currency,
          })
        : [],
    [transactions.data, budgets.data, goals.data, month, now, currency],
  )

  const reload = useCallback(() => {
    accounts.reload()
    transactions.reload()
    budgets.reload()
    goals.reload()
  }, [accounts, transactions, budgets, goals])

  return {
    currency,
    now,
    accounts: accounts.data ?? [],
    transactions: transactions.data ?? [],
    budgets: budgets.data ?? [],
    goals: goals.data ?? [],
    month,
    insights,
    ready,
    error,
    reload,
  }
}
