import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/StateViews'
import { useFinanceData } from '@/hooks/useFinanceData'
import { ROUTES } from '@/lib/constants'
import { budgetStatus, monthlySeries } from '@/lib/financeStats'
import { cn, formatCurrency } from '@/lib/utils'

const TICK = { fill: 'hsl(var(--muted-foreground))', fontSize: 12 }
const GRID = 'hsl(var(--border))'
const TOOLTIP = {
  contentStyle: {
    background: 'hsl(var(--surface))',
    border: '1px solid hsl(var(--border-strong))',
    borderRadius: 6,
    fontSize: 12,
    boxShadow: 'none',
  },
  labelStyle: { color: 'hsl(var(--foreground))', fontWeight: 500 },
  itemStyle: { color: 'hsl(var(--foreground))' },
  cursor: { fill: 'hsl(var(--subtle))' },
} as const
const STATUS_COLOR = { normal: 'hsl(var(--positive))', approaching: 'hsl(var(--warning))', exceeded: 'hsl(var(--negative))' } as const

function Panel({ title, description, className, children }: { title: string; description: string; className?: string; children: ReactNode }) {
  return (
    <section className={cn('card', className)}>
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

const NoData = ({ children }: { children: ReactNode }) => (
  <p className="py-10 text-center text-sm text-muted-foreground">{children}</p>
)

const Swatch = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1.5">
    <span className="h-2 w-2 rounded-sm" style={{ background: color }} aria-hidden />
    {label}
  </span>
)

export function Analytics() {
  const { currency, now, transactions, budgets, goals, month, ready, error, reload } = useFinanceData()
  const money = (n: number) => formatCurrency(n, currency)
  const compact = (n: number) => formatCurrency(n, currency, { compact: true })

  const trend = useMemo(() => monthlySeries(transactions, 6, now), [transactions, now])
  const hasTrendData = trend.some((p) => p.income > 0 || p.expenses > 0)

  const categories = useMemo(
    () =>
      [...month.byCategory]
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
    [month.byCategory],
  )

  const utilization = useMemo(
    () =>
      budgets
        .filter((b) => b.amount > 0)
        .map((b) => {
          const spent = month.byCategory.get(b.category) ?? 0
          return { name: b.category, percent: Math.round((spent / b.amount) * 100), spent, limit: b.amount, status: budgetStatus(spent, b.amount) }
        })
        .sort((a, b) => b.percent - a.percent),
    [budgets, month.byCategory],
  )

  const savings = useMemo(
    () =>
      goals
        .filter((g) => g.target_amount > 0)
        .map((g) => ({
          name: g.name,
          percent: Math.min(100, Math.round((g.current_amount / g.target_amount) * 100)),
          saved: g.current_amount,
          target: g.target_amount,
        })),
    [goals],
  )

  if (error) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <div className="card mt-6">
          <ErrorState message={error} onRetry={reload} />
        </div>
      </div>
    )
  }
  if (!ready) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <div className="card mt-6 overflow-hidden">
          <LoadingRows count={5} />
        </div>
      </div>
    )
  }
  if (transactions.length === 0 && budgets.length === 0 && goals.length === 0) {
    return (
      <div>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <div className="card mt-6">
          <EmptyState
            title="Nothing to chart yet"
            description="Charts are drawn from your transactions, budgets and goals. Add a few transactions to get started."
            action={
              <Link to={ROUTES.transactions} className="btn btn-primary">
                Add a transaction
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const savingsRate = month.income > 0 ? Math.round((month.net / month.income) * 100) : null
  const stats = [
    { label: 'Income', value: money(month.income), tone: '' },
    { label: 'Expenses', value: money(month.expenses), tone: '' },
    { label: 'Net', value: `${month.net < 0 ? '−' : ''}${money(Math.abs(month.net))}`, tone: month.net < 0 ? 'text-negative' : 'text-positive' },
    { label: 'Savings rate', value: savingsRate === null ? 'No income' : `${savingsRate}%`, tone: '' },
  ]

  return (
    <div>
      <h1 className="text-xl font-semibold">Analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">This month so far, and the last six months.</p>

      <dl className="card mt-6 grid grid-cols-2 divide-border md:grid-cols-4 md:divide-x">
        {stats.map((s, i) => (
          <div key={s.label} className={cn('px-4 py-3', i >= 2 && 'border-t border-border md:border-t-0', i % 2 === 1 && 'border-l border-border md:border-l-0')}>
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className={cn('num mt-0.5 text-lg font-semibold', s.tone)}>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel className="lg:col-span-2" title="Income vs expenses" description="Monthly totals for the last six months">
          {hasTrendData ? (
            <>
              <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
                <Swatch color="hsl(var(--positive))" label="Income" />
                <Swatch color="hsl(var(--muted-foreground))" label="Expenses" />
              </div>
              <div role="img" aria-label="Bar chart of monthly income and expenses for the last six months">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={trend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={2}>
                    <CartesianGrid vertical={false} stroke={GRID} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={TICK} />
                    <YAxis tickLine={false} axisLine={false} tick={TICK} width={52} tickFormatter={(v: number) => compact(v)} />
                    <Tooltip {...TOOLTIP} formatter={(value) => money(Number(value))} />
                    <Bar dataKey="income" name="Income" fill="hsl(var(--positive))" radius={[2, 2, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--muted-foreground))" radius={[2, 2, 0, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : (
            <NoData>No income or expenses in the last six months.</NoData>
          )}
        </Panel>

        <Panel title="Spending by category" description="Expenses this month, largest first">
          {categories.length > 0 ? (
            <div role="img" aria-label="Bar chart of this month's expenses by category">
              <ResponsiveContainer width="100%" height={Math.max(120, categories.length * 32 + 8)}>
                <BarChart data={categories} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={TICK} width={96} />
                  <Tooltip {...TOOLTIP} formatter={(value) => money(Number(value))} />
                  <Bar dataKey="value" name="Spent" fill="hsl(var(--foreground))" radius={[0, 2, 2, 0]} barSize={14}>
                    <LabelList dataKey="value" position="right" formatter={(v: unknown) => compact(Number(v))} fill="hsl(var(--muted-foreground))" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoData>No expenses recorded this month.</NoData>
          )}
        </Panel>

        <Panel title="Budget utilization" description="Share of each monthly limit used. The line marks 100%">
          {utilization.length > 0 ? (
            <div role="img" aria-label="Bar chart of budget utilization by category">
              <ResponsiveContainer width="100%" height={Math.max(120, utilization.length * 32 + 8)}>
                <BarChart data={utilization} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide domain={[0, (max: number) => Math.max(100, Math.ceil(max / 10) * 10)]} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={TICK} width={96} />
                  <ReferenceLine x={100} stroke="hsl(var(--border-strong))" strokeDasharray="3 3" />
                  <Tooltip
                    {...TOOLTIP}
                    formatter={(value, _name, item) => {
                      const row = item.payload as (typeof utilization)[number]
                      return `${money(row.spent)} of ${money(row.limit)} (${value}%)`
                    }}
                  />
                  <Bar dataKey="percent" name="Used" radius={[0, 2, 2, 0]} barSize={14}>
                    {utilization.map((row) => (
                      <Cell key={row.name} fill={STATUS_COLOR[row.status]} />
                    ))}
                    <LabelList dataKey="percent" position="right" formatter={(v: unknown) => `${v}%`} fill="hsl(var(--muted-foreground))" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoData>
              No budgets yet.{' '}
              <Link to={ROUTES.budgets} className="font-medium text-foreground underline underline-offset-4">
                Add one
              </Link>
            </NoData>
          )}
        </Panel>

        <Panel className="lg:col-span-2" title="Savings progress" description="Saved so far as a share of each goal's target">
          {savings.length > 0 ? (
            <div role="img" aria-label="Bar chart of savings progress by goal">
              <ResponsiveContainer width="100%" height={Math.max(120, savings.length * 32 + 8)}>
                <BarChart data={savings} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={TICK} width={110} />
                  <Tooltip
                    {...TOOLTIP}
                    formatter={(value, _name, item) => {
                      const row = item.payload as (typeof savings)[number]
                      return `${money(row.saved)} of ${money(row.target)} (${value}%)`
                    }}
                  />
                  <Bar dataKey="percent" name="Saved" fill="hsl(var(--positive))" radius={[0, 2, 2, 0]} barSize={14} background={{ fill: 'hsl(var(--border))', radius: 2 }}>
                    <LabelList dataKey="percent" position="right" formatter={(v: unknown) => `${v}%`} fill="hsl(var(--muted-foreground))" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <NoData>
              No savings goals yet.{' '}
              <Link to={ROUTES.goals} className="font-medium text-foreground underline underline-offset-4">
                Add one
              </Link>
            </NoData>
          )}
        </Panel>
      </div>
    </div>
  )
}
