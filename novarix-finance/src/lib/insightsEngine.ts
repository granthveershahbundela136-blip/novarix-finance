import { DEFAULT_CURRENCY, ROUTES } from '@/lib/constants'
import {
  BUDGET_APPROACHING_AT,
  budgetStatus,
  daysInMonth,
  monthKeyOf,
  shiftMonth,
  summarizeMonth,
} from '@/lib/financeStats'
import { daysUntil, formatCurrency, formatDate } from '@/lib/utils'
import type { Budget, FinancialInsight, Goal, InsightSeverity, InsightType, Transaction } from '@/types'

/**
 * Deterministic, rule-based insights. Everything here is arithmetic on the user's own
 * transactions, budgets and goals: no network calls, no AI, no generated facts.
 */
export const RULES = {
  /** Flag a category when spending is up by more than this versus the same days last month. */
  categoryIncrease: 0.15,
  /** ...but only when the rise is at least this share of total spending, so small amounts stay quiet. */
  categoryIncreaseMateriality: 0.02,
  /** Flag a category taking more than this share of total spending. */
  categoryShare: 0.3,
  /** A goal is "behind" when saved progress trails elapsed time by more than this. */
  goalBehindTolerance: 0.1,
} as const

export interface InsightOptions {
  /** Defaults to the current time. Pass a fixed date for repeatable results. */
  now?: Date
  currency?: string
}

const SEVERITY_ORDER: Record<InsightSeverity, number> = { high: 0, medium: 1, low: 2 }
const TYPE_ORDER: Record<InsightType, number> = { warning: 0, recommendation: 1, information: 2, positive: 3 }

const percent = (ratio: number) => Math.round(ratio * 100)
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const categoryRoute = (category: string) => `${ROUTES.transactions}?category=${encodeURIComponent(category)}`

/**
 * @param income    this month's income so far
 * @param expenses  this month's expenses so far
 * Compares the current month to date with the same days of last month.
 */
export function generateFinancialInsights(
  transactions: Transaction[],
  budgets: Budget[],
  goals: Goal[],
  income: number,
  expenses: number,
  options: InsightOptions = {},
): FinancialInsight[] {
  const now = options.now ?? new Date()
  const money = (n: number) => formatCurrency(n, options.currency ?? DEFAULT_CURRENCY)

  const today = now.getDate()
  const lastMonthDate = shiftMonth(now, -1)
  const lastMonth = monthKeyOf(lastMonthDate)
  const current = summarizeMonth(transactions, monthKeyOf(now), today)
  const sameDaysLastMonth = summarizeMonth(transactions, lastMonth, Math.min(today, daysInMonth(lastMonthDate)))
  const lastMonthFull = summarizeMonth(transactions, lastMonth)
  const daysLeft = daysInMonth(now) - today + 1
  const budgetedCategories = new Set(budgets.map((b) => b.category))

  const insights: FinancialInsight[] = []
  const add = (
    id: string,
    type: InsightType,
    severity: InsightSeverity,
    title: string,
    description: string,
    recommendation: string,
    relatedRoute: string,
  ) => insights.push({ id, type, severity, title, description, recommendation, relatedRoute })

  /* ---- Nothing recorded yet ---- */
  if (transactions.length === 0) {
    add(
      'no-transactions',
      'recommendation',
      'low',
      'No transactions recorded yet',
      'Insights are calculated from your transactions, so there is nothing to analyse yet.',
      'Record a few recent expenses and any income you have received.',
      ROUTES.transactions,
    )
  }

  /* ---- Budgets: exceeded / approaching / all within limit ---- */
  let flaggedBudgets = 0
  for (const b of budgets) {
    if (b.amount <= 0) continue
    const spent = current.byCategory.get(b.category) ?? 0
    const status = budgetStatus(spent, b.amount)
    if (status === 'exceeded') {
      flaggedBudgets++
      add(
        `budget-exceeded:${b.id}`,
        'warning',
        'high',
        `${b.category} budget exceeded`,
        `${money(spent)} spent against a ${money(b.amount)} limit (${percent(spent / b.amount)}%), ${money(spent - b.amount)} over.`,
        `Review this month's ${b.category} transactions. If the limit no longer matches your real costs, raise it.`,
        ROUTES.budgets,
      )
    } else if (status === 'approaching') {
      flaggedBudgets++
      const left = b.amount - spent
      add(
        `budget-approaching:${b.id}`,
        'warning',
        'medium',
        `${b.category} budget is ${percent(spent / b.amount)}% used`,
        `${money(spent)} of ${money(b.amount)} spent, with ${plural(daysLeft, 'day')} left in the month.`,
        `${money(left)} remains, about ${money(left / daysLeft)} per day. Slow ${b.category} spending or raise the limit.`,
        ROUTES.budgets,
      )
    }
  }
  if (budgets.length > 0 && flaggedBudgets === 0) {
    add(
      'budgets-within-limit',
      'positive',
      'low',
      budgets.length === 1 ? 'Your budget is within its limit' : `All ${budgets.length} budgets are within their limits`,
      `Each budget is under ${percent(BUDGET_APPROACHING_AT)}% used this month.`,
      'No action needed.',
      ROUTES.budgets,
    )
  }

  /* ---- Month-over-month category increases (same days of last month) ---- */
  const increases = [...current.byCategory]
    .map(([category, spent]) => ({ category, spent, before: sameDaysLastMonth.byCategory.get(category) ?? 0 }))
    .filter(({ spent, before }) => {
      if (before <= 0) return false
      const delta = spent - before
      return delta / before > RULES.categoryIncrease && delta >= expenses * RULES.categoryIncreaseMateriality
    })
    .sort((a, b) => b.spent - b.before - (a.spent - a.before))
    .slice(0, 3)
  for (const { category, spent, before } of increases) {
    const change = (spent - before) / before
    add(
      `category-increase:${category}`,
      'warning',
      change >= 0.5 ? 'high' : change >= 0.3 ? 'medium' : 'low',
      `${category} spending is up ${percent(change)}%`,
      `${money(spent)} so far this month versus ${money(before)} over the same days last month, ${money(spent - before)} more.`,
      `Check what drove the increase and decide whether it is a one-off or a new regular cost.`,
      categoryRoute(category),
    )
  }

  /* ---- Overall spending down versus the same days last month ---- */
  if (sameDaysLastMonth.expenses > 0 && current.expenses <= sameDaysLastMonth.expenses * 0.9) {
    const drop = (sameDaysLastMonth.expenses - current.expenses) / sameDaysLastMonth.expenses
    add(
      'spending-down',
      'positive',
      'low',
      `Spending is down ${percent(drop)}% on last month`,
      `${money(current.expenses)} spent so far versus ${money(sameDaysLastMonth.expenses)} over the same days last month.`,
      'No action needed.',
      ROUTES.analytics,
    )
  }

  /* ---- Income versus expenses ---- */
  const nextGoal = goals
    .filter((g) => g.current_amount < g.target_amount)
    .sort((a, b) => (a.deadline ?? '9999-12-31').localeCompare(b.deadline ?? '9999-12-31'))[0]

  if (expenses > income) {
    const gap = expenses - income
    if (income === 0) {
      add(
        'deficit',
        'warning',
        'medium',
        'Expenses recorded with no income this month',
        `${money(expenses)} spent and no income recorded so far this month.`,
        'If you have been paid this month, record the income so the comparison is accurate. Otherwise start with your largest categories.',
        ROUTES.transactions,
      )
    } else {
      add(
        'deficit',
        'warning',
        gap / income > 0.2 ? 'high' : 'medium',
        'Expenses are higher than income this month',
        `${money(expenses)} spent against ${money(income)} of income, a gap of ${money(gap)}.`,
        'Look at your largest categories in Analytics and trim where you can, or record any income that is missing.',
        ROUTES.analytics,
      )
    }
  } else if (income > 0) {
    const net = income - expenses
    add(
      'surplus',
      'positive',
      'low',
      `You have kept ${percent(net / income)}% of this month's income`,
      `${money(income)} in, ${money(expenses)} out, ${money(net)} left over so far.`,
      nextGoal
        ? `Consider putting part of the ${money(net)} toward "${nextGoal.name}".`
        : 'Create a savings goal to give the surplus a target.',
      ROUTES.goals,
    )
  }

  /* ---- High category share of spending ---- */
  if (expenses > 0 && current.byCategory.size >= 2) {
    for (const [category, spent] of current.byCategory) {
      const share = spent / expenses
      if (share <= RULES.categoryShare) continue
      add(
        `category-share:${category}`,
        'information',
        share > 0.5 ? 'medium' : 'low',
        `${category} is ${percent(share)}% of your spending`,
        `${money(spent)} of ${money(expenses)} spent this month.`,
        `Compare ${category} with your other categories in Analytics and decide whether that split is intentional.`,
        ROUTES.analytics,
      )
    }
  }

  /* ---- Top spending categories without a budget ---- */
  const topCategories = [...current.byCategory].sort((a, b) => b[1] - a[1]).slice(0, 3)
  topCategories.forEach(([category, spent], index) => {
    if (budgetedCategories.has(category) || spent <= 0) return
    const share = expenses > 0 ? spent / expenses : 0
    const lastFull = lastMonthFull.byCategory.get(category) ?? 0
    add(
      `unbudgeted:${category}`,
      'recommendation',
      share >= 0.2 ? 'medium' : 'low',
      `${category} has no budget`,
      `${category} is your ${['largest', 'second largest', 'third largest'][index]} spending category this month (${money(spent)}, ${percent(share)}% of spending) and has no monthly limit.`,
      lastFull > 0
        ? `Last month you spent ${money(lastFull)} on ${category}. A limit near that is a starting point.`
        : `Set a limit based on this month's spending so far.`,
      ROUTES.budgets,
    )
  })

  /* ---- Savings goals ---- */
  for (const g of goals) {
    const saved = g.current_amount
    const progress = g.target_amount > 0 ? saved / g.target_amount : 0
    const remaining = Math.max(0, g.target_amount - saved)

    if (saved >= g.target_amount) {
      add(
        `goal-reached:${g.id}`,
        'positive',
        'low',
        `Goal reached: ${g.name}`,
        `${money(saved)} saved against a ${money(g.target_amount)} target.`,
        'Set the next goal, or raise this target if you want to keep going.',
        ROUTES.goals,
      )
      continue
    }

    if (!g.deadline) {
      if (progress >= 0.5) {
        add(
          `goal-progress:${g.id}`,
          'positive',
          'low',
          `${g.name} is ${percent(progress)}% funded`,
          `${money(saved)} of ${money(g.target_amount)} saved, ${money(remaining)} to go.`,
          'Add a deadline to see whether you are on schedule.',
          ROUTES.goals,
        )
      }
      continue
    }

    const daysLeftToGoal = daysUntil(g.deadline, now)
    if (daysLeftToGoal < 0) {
      add(
        `goal-overdue:${g.id}`,
        'warning',
        'high',
        `${g.name} is past its deadline`,
        `${money(remaining)} is still to be saved. The deadline was ${formatDate(g.deadline)}.`,
        'Move the deadline or lower the target so the goal reflects what is realistic.',
        ROUTES.goals,
      )
      continue
    }

    const needed =
      daysLeftToGoal >= 30
        ? `${money(remaining / (daysLeftToGoal / 30.44))} per month`
        : `${money(remaining)} within ${plural(daysLeftToGoal, 'day')}`
    // Elapsed share of the goal's lifetime, from when it was created to its deadline.
    const lifetime = daysUntil(g.deadline, new Date(g.created_at ?? Date.now()))
    const elapsed = lifetime > 0 ? Math.min(1, Math.max(0, (lifetime - daysLeftToGoal) / lifetime)) : 0

    if (elapsed > 0.05 && progress < elapsed - RULES.goalBehindTolerance) {
      add(
        `goal-behind:${g.id}`,
        'warning',
        elapsed - progress >= 0.3 ? 'high' : 'medium',
        `${g.name} is behind schedule`,
        `${percent(progress)}% saved with ${percent(elapsed)}% of the time used. ${money(remaining)} to go, ${plural(daysLeftToGoal, 'day')} left.`,
        `To finish by ${formatDate(g.deadline)} you need about ${needed}.`,
        ROUTES.goals,
      )
    } else if (elapsed > 0.05) {
      add(
        `goal-on-schedule:${g.id}`,
        'positive',
        'low',
        `${g.name} is on schedule`,
        `${percent(progress)}% saved with ${percent(elapsed)}% of the time used.`,
        `Keep saving about ${needed} to finish by ${formatDate(g.deadline)}.`,
        ROUTES.goals,
      )
    } else {
      add(
        `goal-funded:${g.id}`,
        'information',
        'low',
        `${g.name} is ${percent(progress)}% funded`,
        `${money(remaining)} to go with ${plural(daysLeftToGoal, 'day')} until the deadline.`,
        `Saving about ${needed} would finish it by ${formatDate(g.deadline)}.`,
        ROUTES.goals,
      )
    }
  }

  if (goals.length === 0 && transactions.length > 0) {
    add(
      'no-goals',
      'recommendation',
      'low',
      'No savings goals yet',
      'You have no savings goals set up.',
      'Create a goal with a target amount and, optionally, a deadline.',
      ROUTES.goals,
    )
  }

  return insights.sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] ||
      TYPE_ORDER[a.type] - TYPE_ORDER[b.type] ||
      a.id.localeCompare(b.id),
  )
}
