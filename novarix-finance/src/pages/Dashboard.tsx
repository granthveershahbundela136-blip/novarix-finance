import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { ErrorState, LoadingRows } from '@/components/ui/StateViews'
import { useAuth } from '@/context/AuthContext'
import { useFinanceData } from '@/hooks/useFinanceData'
import { ROUTES } from '@/lib/constants'
import { budgetStatus } from '@/lib/financeStats'
import { cn, formatCurrency, formatDate } from '@/lib/utils'

const TONE = { normal: 'positive', approaching: 'warning', exceeded: 'negative' } as const

function getActionLabel(route?: string) {
  if (!route) return 'View'
  if (route.includes('budgets')) return 'Adjust budget'
  if (route.includes('goals')) return 'View goal'
  if (route.includes('transactions')) return 'Add transaction'
  if (route.includes('accounts')) return 'View accounts'
  return 'Take action'
}

function Section({ title, to, linkLabel, children }: { title: string; to: string; linkLabel: string; children: ReactNode }) {
  return (
    <section className="card">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <h2 className="text-sm font-semibold">{title}</h2>
        <Link to={to} className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
          {linkLabel}
        </Link>
      </div>
      {children}
    </section>
  )
}

const Empty = ({ text, to, action }: { text: string; to: string; action: string }) => (
  <div className="px-4 py-6">
    <p className="text-sm text-muted-foreground">{text}</p>
    <Link to={to} className="btn btn-secondary mt-3 h-8">
      {action}
    </Link>
  </div>
)

export function Dashboard() {
  const { displayName } = useAuth()
  const { currency, accounts, transactions, budgets, goals, month, insights, ready, error, reload } = useFinanceData()
  const money = (n: number) => formatCurrency(n, currency)

  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + a.balance, 0), [accounts])
  const recent = transactions.slice(0, 6)
  const attention = insights.filter((i) => i.type !== 'positive').slice(0, 3)

  const budgetRows = useMemo(
    () =>
      budgets
        .filter((b) => b.amount > 0)
        .map((b) => {
          const spent = month.byCategory.get(b.category) ?? 0
          return { id: b.id, category: b.category, spent, limit: b.amount, ratio: spent / b.amount, status: budgetStatus(spent, b.amount) }
        })
        .sort((a, b) => b.ratio - a.ratio)
        .slice(0, 4),
    [budgets, month.byCategory],
  )

  const header = (
    <div>
      <h1 className="text-xl font-semibold">{displayName ? `Welcome back, ${displayName}` : 'Dashboard'}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your balances, spending and goals at a glance.</p>
    </div>
  )

  if (error) {
    return (
      <div>
        {header}
        <div className="card mt-6">
          <ErrorState message={error} onRetry={reload} />
        </div>
      </div>
    )
  }
  if (!ready) {
    return (
      <div>
        {header}
        <div className="card mt-6 overflow-hidden">
          <LoadingRows count={4} />
        </div>
      </div>
    )
  }

  // Brand-new user: one clear path instead of a page of empty panels.
  if (transactions.length === 0 && budgets.length === 0 && goals.length === 0) {
    const steps = [
      { title: 'Record a transaction', body: 'Add an expense or income. You can create your first account in the same form.', to: ROUTES.transactions, action: 'Add transaction' },
      { title: 'Set a budget', body: 'Pick a category and a monthly limit to track against.', to: ROUTES.budgets, action: 'Add budget' },
      { title: 'Create a savings goal', body: 'Set a target amount and, optionally, a deadline.', to: ROUTES.goals, action: 'Add goal' },
    ]
    return (
      <div>
        {header}
        <section className="card mt-6">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Get started</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Your dashboard is built from what you record. Start with any of these.</p>
          </div>
          <ul className="divide-y divide-border">
            {steps.map((s) => (
              <li key={s.title} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <h3 className="text-sm font-medium">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </div>
                <Link to={s.to} className="btn btn-secondary h-8">
                  {s.action}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    )
  }

  const stats = [
    { label: 'Total balance', value: money(totalBalance), note: accounts.length === 0 ? 'No accounts yet' : `${accounts.length} account${accounts.length === 1 ? '' : 's'}`, tone: '' },
    { label: 'Income this month', value: money(month.income), note: 'So far', tone: '' },
    { label: 'Expenses this month', value: money(month.expenses), note: 'So far', tone: '' },
    {
      label: 'Net this month',
      value: `${month.net < 0 ? '−' : ''}${money(Math.abs(month.net))}`,
      note: month.net < 0 ? 'Spending exceeds income' : 'Income minus expenses',
      tone: month.net < 0 ? 'text-negative' : month.net > 0 ? 'text-positive' : '',
    },
  ]

  return (
    <div>
      {header}

      <dl className="card mt-6 grid grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-border">
        {stats.map((s, i) => (
          <div key={s.label} className={cn('px-4 py-3', i >= 2 && 'border-t border-border lg:border-t-0', i % 2 === 1 && 'border-l border-border lg:border-l-0')}>
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className={cn('num mt-0.5 text-lg font-semibold', s.tone)}>{s.value}</dd>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.note}</p>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Needs attention" to={ROUTES.insights} linkLabel="All insights">
            {attention.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">No warnings or recommendations right now.</p>
            ) : (
              <ul className="divide-y divide-border">
                {attention.map((i) => (
                  <li key={i.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium">{i.title}</h3>
                      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{i.description}</p>
                    </div>
                    {i.relatedRoute ? (
                      <Link to={i.relatedRoute} className="btn btn-secondary h-8 shrink-0">
                        {getActionLabel(i.relatedRoute)}
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Recent transactions" to={ROUTES.transactions} linkLabel="View all">
            {recent.length === 0 ? (
              <Empty text="No transactions yet." to={ROUTES.transactions} action="Add transaction" />
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{t.description || t.category}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.category}, {formatDate(t.date)}
                      </p>
                    </div>
                    <span className={cn('num shrink-0 text-sm font-medium', t.type === 'income' && 'text-positive')}>
                      {t.type === 'income' ? '+' : '−'}
                      {money(t.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Budgets" to={ROUTES.budgets} linkLabel="Manage">
            {budgetRows.length === 0 ? (
              <Empty text="No budgets set." to={ROUTES.budgets} action="Add budget" />
            ) : (
              <ul className="divide-y divide-border">
                {budgetRows.map((b) => (
                  <li key={b.id} className="px-4 py-2.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate">{b.category}</span>
                      <span className="num shrink-0 text-xs text-muted-foreground">
                        {money(b.spent)} / {money(b.limit)}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar percent={b.ratio * 100} tone={TONE[b.status]} label={`${b.category} budget used`} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Goals" to={ROUTES.goals} linkLabel="Manage">
            {goals.length === 0 ? (
              <Empty text="No savings goals yet." to={ROUTES.goals} action="Add goal" />
            ) : (
              <ul className="divide-y divide-border">
                {goals.slice(0, 3).map((g) => {
                  const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
                  return (
                    <li key={g.id} className="px-4 py-2.5">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="truncate">{g.name}</span>
                        <span className="num shrink-0 text-xs text-muted-foreground">{Math.min(100, Math.floor(pct))}%</span>
                      </div>
                      <div className="mt-1.5">
                        <ProgressBar percent={pct} label={`${g.name} progress`} />
                      </div>
                      <p className="num mt-1 text-xs text-muted-foreground">
                        {money(g.current_amount)} of {money(g.target_amount)}
                      </p>
                    </li>
                  )
                })}
              </ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  )
}