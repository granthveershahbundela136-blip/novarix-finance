import { useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/StateViews'
import { useCurrency } from '@/hooks/useCurrency'
import { useResource } from '@/hooks/useResource'
import { createGoal, deleteGoal, errorMessage, listGoals, updateGoal } from '@/lib/api'
import { cn, daysUntil, formatCurrency, formatDate } from '@/lib/utils'
import type { Goal } from '@/types'

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

function deadlineText(goal: Goal, done: boolean) {
  if (done) return { text: 'Completed', overdue: false }
  if (!goal.deadline) return { text: 'No deadline', overdue: false }
  const days = daysUntil(goal.deadline)
  const date = formatDate(goal.deadline)
  if (days < 0) return { text: `${date}, overdue by ${plural(-days, 'day')}`, overdue: true }
  if (days === 0) return { text: `${date}, due today`, overdue: false }
  return { text: `${date}, ${plural(days, 'day')} left`, overdue: false }
}

export function Goals() {
  const currency = useCurrency()
  const goals = useResource(listGoals, [])

  const [editing, setEditing] = useState<Goal | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Goal | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const totals = useMemo(() => {
    const list = goals.data ?? []
    return {
      saved: list.reduce((sum, g) => sum + g.current_amount, 0),
      target: list.reduce((sum, g) => sum + g.target_amount, 0),
    }
  }, [goals.data])

  function onSaved() {
    setEditing(null)
    goals.reload()
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await deleteGoal(deleting.id)
      setDeleting(null)
      goals.reload()
    } catch (e) {
      setDeleteError(errorMessage(e, 'Couldn’t delete this goal.'))
    } finally {
      setDeleteBusy(false)
    }
  }

  function renderBody() {
    if (goals.error) {
      return (
        <div className="card mt-6">
          <ErrorState message={goals.error} onRetry={goals.reload} />
        </div>
      )
    }
    if (!goals.data) {
      return (
        <div className="card mt-6 overflow-hidden">
          <LoadingRows count={3} />
        </div>
      )
    }
    if (goals.data.length === 0) {
      return (
        <div className="card mt-6">
          <EmptyState
            title="No goals yet"
            description="Add a savings target with an optional deadline and track how close you are."
            action={
              <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
                Add goal
              </button>
            }
          />
        </div>
      )
    }
    return (
      <>
        <p className="mt-6 text-sm text-muted-foreground">
          Saved <span className="num font-medium text-foreground">{formatCurrency(totals.saved, currency)}</span> of{' '}
          <span className="num">{formatCurrency(totals.target, currency)}</span> across {plural(goals.data.length, 'goal')}.
        </p>
        <ul className="card mt-3 divide-y divide-border">
          {goals.data.map((g) => {
            const pct = g.target_amount > 0 ? (g.current_amount / g.target_amount) * 100 : 0
            const done = g.current_amount >= g.target_amount
            const remaining = Math.max(0, g.target_amount - g.current_amount)
            const due = deadlineText(g, done)
            return (
              <li key={g.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="min-w-0 truncate text-sm font-medium">{g.name}</h3>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="num mr-1 text-sm font-medium">{Math.min(100, Math.floor(pct))}%</span>
                    <button type="button" className="btn-icon" onClick={() => setEditing(g)} aria-label={`Edit ${g.name}`}>
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => {
                        setDeleteError(null)
                        setDeleting(g)
                      }}
                      aria-label={`Delete ${g.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-2.5">
                  <ProgressBar percent={pct} tone={due.overdue ? 'negative' : 'positive'} label={`${g.name} progress`} />
                </div>
                <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="num">
                    {formatCurrency(g.current_amount, currency)} of {formatCurrency(g.target_amount, currency)}
                  </span>
                  <span className="num">{done ? 'Goal reached' : `${formatCurrency(remaining, currency)} to go`}</span>
                </div>
                <p className={cn('mt-0.5 text-xs text-muted-foreground', due.overdue && 'text-negative')}>{due.text}</p>
              </li>
            )
          })}
        </ul>
      </>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Goals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Savings targets and progress.</p>
        </div>
        <button type="button" className="btn btn-primary shrink-0" onClick={() => setEditing('new')} disabled={!goals.data}>
          <Plus size={16} aria-hidden />
          Add goal
        </button>
      </div>

      {renderBody()}

      <Modal open={editing !== null} title={editing === 'new' ? 'Add goal' : 'Edit goal'} onClose={() => setEditing(null)}>
        {editing !== null && (
          <GoalForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            onSaved={onSaved}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete goal?"
        message={deleting ? `“${deleting.name}” and its progress will be removed permanently.` : ''}
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

function GoalForm({ initial, onSaved, onCancel }: { initial: Goal | null; onSaved: () => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [target, setTarget] = useState(initial ? String(initial.target_amount) : '')
  const [current, setCurrent] = useState(initial ? String(initial.current_amount) : '0')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const targetValue = Number(target)
    const currentValue = Number(current || 0)
    if (!name.trim()) return setError('Give the goal a name.')
    if (!Number.isFinite(targetValue) || targetValue <= 0) return setError('Enter a target greater than 0.')
    if (!Number.isFinite(currentValue) || currentValue < 0) return setError('Saved amount can’t be negative.')

    const input = {
      name: name.trim(),
      target_amount: targetValue,
      current_amount: currentValue,
      deadline: deadline || null,
    }
    setSaving(true)
    try {
      if (initial) await updateGoal(initial.id, input)
      else await createGoal(input)
      onSaved()
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t save this goal.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div>
        <label htmlFor="goal-name" className="label">Goal name</label>
        <input id="goal-name" className="input" type="text" required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="goal-target" className="label">Target amount</label>
          <input
            id="goal-target"
            className="input"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            required
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="goal-current" className="label">Saved so far</label>
          <input
            id="goal-current"
            className="input"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label htmlFor="goal-deadline" className="label">Deadline (optional)</label>
        <input id="goal-deadline" className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
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
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add goal'}
        </button>
      </div>
    </form>
  )
}
