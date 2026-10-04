import { useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/StateViews'
import { useCurrency } from '@/hooks/useCurrency'
import { useResource } from '@/hooks/useResource'
import { createBudget, deleteBudget, errorMessage, listBudgets, listTransactions, updateBudget } from '@/lib/api'
import { DEFAULT_LOCALE, EXPENSE_CATEGORIES } from '@/lib/constants'
import { cn, formatCurrency, monthRange } from '@/lib/utils'
import type { Budget } from '@/types'

type Status = 'normal' | 'approaching' | 'exceeded'

/** A budget is "approaching" once 80% is spent, and "exceeded" once spending passes the limit. */
const APPROACHING_AT = 0.8

function statusOf(spent: number, limit: number): Status {
  if (spent > limit) return 'exceeded'
  if (limit > 0 && spent / limit >= APPROACHING_AT) return 'approaching'
  return 'normal'
}

const STATUS = {
  normal: { label: 'Normal', badge: 'border-border-strong text-muted-foreground', tone: 'positive' },
  approaching: { label: 'Approaching limit', badge: 'border-warning/40 bg-warning/10 text-warning', tone: 'warning' },
  exceeded: { label: 'Exceeded', badge: 'border-negative/40 bg-negative/10 text-negative', tone: 'negative' },
} as const

export function Budgets() {
  const currency = useCurrency()
  const { start: from, end: to } = useMemo(() => monthRange(), [])
  const monthLabel = useMemo(
    () => new Intl.DateTimeFormat(DEFAULT_LOCALE, { month: 'long', year: 'numeric' }).format(new Date()),
    [],
  )
  const budgets = useResource(listBudgets, [])
  const spending = useResource(() => listTransactions({ from, to, type: 'expense' }), [from, to])

  const [editing, setEditing] = useState<Budget | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Budget | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of spending.data ?? []) map.set(t.category, (map.get(t.category) ?? 0) + t.amount)
    return map
  }, [spending.data])

  const rows = useMemo(
    () =>
      (budgets.data ?? [])
        .map((b) => {
          const spent = spentByCategory.get(b.category) ?? 0
          return { budget: b, spent, ratio: b.amount > 0 ? spent / b.amount : 0, status: statusOf(spent, b.amount) }
        })
        .sort((a, b) => b.ratio - a.ratio),
    [budgets.data, spentByCategory],
  )

  const totals = useMemo(() => {
    const limit = rows.reduce((sum, r) => sum + r.budget.amount, 0)
    const spent = rows.reduce((sum, r) => sum + r.spent, 0)
    return { limit, spent, remaining: limit - spent }
  }, [rows])

  const usedCategories = new Set((budgets.data ?? []).map((b) => b.category))
  const allCategoriesUsed = EXPENSE_CATEGORIES.every((c) => usedCategories.has(c))
  const ready = Boolean(budgets.data && spending.data)

  function onSaved() {
    setEditing(null)
    budgets.reload()
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await deleteBudget(deleting.id)
      setDeleting(null)
      budgets.reload()
    } catch (e) {
      setDeleteError(errorMessage(e, 'Couldn’t delete this budget.'))
    } finally {
      setDeleteBusy(false)
    }
  }

  const error = budgets.error ?? spending.error

  function renderBody() {
    if (error) {
      return (
        <div className="card mt-6">
          <ErrorState
            message={error}
            onRetry={() => {
              budgets.reload()
              spending.reload()
            }}
          />
        </div>
      )
    }
    if (!ready) {
      return (
        <div className="card mt-6 overflow-hidden">
          <LoadingRows count={4} />
        </div>
      )
    }
    if (rows.length === 0) {
      return (
        <div className="card mt-6">
          <EmptyState
            title="No budgets yet"
            description="Set a monthly limit for a category and Novarix will track this month’s spending against it."
            action={
              <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
                Add budget
              </button>
            }
          />
        </div>
      )
    }
    return (
      <>
        <dl className="card mt-6 grid grid-cols-3 divide-x divide-border">
          {[
            { label: 'Budgeted', value: totals.limit, tone: '' },
            { label: 'Spent', value: totals.spent, tone: '' },
            { label: totals.remaining >= 0 ? 'Remaining' : 'Over budget', value: Math.abs(totals.remaining), tone: totals.remaining < 0 ? 'text-negative' : '' },
          ].map((s) => (
            <div key={s.label} className="px-4 py-3">
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className={cn('num mt-0.5 text-lg font-semibold', s.tone)}>{formatCurrency(s.value, currency)}</dd>
            </div>
          ))}
        </dl>

        <ul className="card mt-4 divide-y divide-border">
          {rows.map(({ budget: b, spent, ratio, status }) => {
            const s = STATUS[status]
            const remaining = b.amount - spent
            return (
              <li key={b.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <h3 className="truncate text-sm font-medium">{b.category}</h3>
                    <span className={cn('shrink-0 rounded-sm border px-1.5 py-0.5 text-xs', s.badge)}>{s.label}</span>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button type="button" className="btn-icon" onClick={() => setEditing(b)} aria-label={`Edit ${b.category} budget`}>
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => {
                        setDeleteError(null)
                        setDeleting(b)
                      }}
                      aria-label={`Delete ${b.category} budget`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-2.5">
                  <ProgressBar percent={ratio * 100} tone={s.tone} label={`${b.category} budget used`} />
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span className="num">
                    {formatCurrency(spent, currency)} of {formatCurrency(b.amount, currency)} ({Math.round(ratio * 100)}%)
                  </span>
                  <span className={cn('num', remaining < 0 && 'text-negative')}>
                    {remaining >= 0 ? `${formatCurrency(remaining, currency)} left` : `${formatCurrency(-remaining, currency)} over`}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Spending counts this month’s expenses in each category.</p>
      </>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Budgets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Monthly limits by category for {monthLabel}.</p>
        </div>
        <button
          type="button"
          className="btn btn-primary shrink-0"
          onClick={() => setEditing('new')}
          disabled={!budgets.data || allCategoriesUsed}
          title={allCategoriesUsed ? 'Every category already has a budget' : undefined}
        >
          <Plus size={16} aria-hidden />
          Add budget
        </button>
      </div>

      {renderBody()}

      <Modal open={editing !== null} title={editing === 'new' ? 'Add budget' : 'Edit budget'} onClose={() => setEditing(null)}>
        {editing !== null && (
          <BudgetForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            usedCategories={usedCategories}
            onSaved={onSaved}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete budget?"
        message={deleting ? `The ${deleting.category} budget will be removed. Your transactions are not affected.` : ''}
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

function BudgetForm({
  initial,
  usedCategories,
  onSaved,
  onCancel,
}: {
  initial: Budget | null
  usedCategories: Set<string>
  onSaved: () => void
  onCancel: () => void
}) {
  // One budget per category: hide categories that already have one (except the one being edited).
  const available = EXPENSE_CATEGORIES.filter((c) => !usedCategories.has(c) || c === initial?.category)
  const [category, setCategory] = useState<string>(initial?.category ?? available[0] ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const value = Number(amount)
    if (!category) return setError('Choose a category.')
    if (!Number.isFinite(value) || value <= 0) return setError('Enter a limit greater than 0.')
    setSaving(true)
    try {
      if (initial) await updateBudget(initial.id, { category, amount: value })
      else await createBudget({ category, amount: value })
      onSaved()
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t save this budget.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div>
        <label htmlFor="budget-category" className="label">Category</label>
        <select id="budget-category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {available.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="budget-amount" className="label">Monthly limit</label>
        <input
          id="budget-amount"
          className="input"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          required
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-negative/40 bg-negative/10 px-3 py-2 text-sm text-negative">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add budget'}
        </button>
      </div>
    </form>
  )
}
