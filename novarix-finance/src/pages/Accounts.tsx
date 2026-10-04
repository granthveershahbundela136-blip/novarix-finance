import { useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/StateViews'
import { useCurrency } from '@/hooks/useCurrency'
import { useResource } from '@/hooks/useResource'
import { createAccount, deleteAccount, errorMessage, listAccounts, updateAccount } from '@/lib/api'
import { ACCOUNT_TYPES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import type { Account, AccountType } from '@/types'

export function Accounts() {
  const currency = useCurrency()
  const accounts = useResource(listAccounts, [])

  const [editing, setEditing] = useState<Account | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Account | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const total = useMemo(
    () => (accounts.data ?? []).reduce((sum, a) => sum + a.balance, 0),
    [accounts.data],
  )

  function onSaved() {
    setEditing(null)
    accounts.reload()
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await deleteAccount(deleting.id)
      setDeleting(null)
      accounts.reload()
    } catch (e) {
      setDeleteError(errorMessage(e, 'Couldn’t delete this account. Remove its transactions first.'))
    } finally {
      setDeleteBusy(false)
    }
  }

  function renderBody() {
    if (accounts.error) {
      return (
        <div className="card mt-6">
          <ErrorState message={accounts.error} onRetry={accounts.reload} />
        </div>
      )
    }
    if (!accounts.data) {
      return (
        <div className="card mt-6 overflow-hidden">
          <LoadingRows count={3} />
        </div>
      )
    }
    if (accounts.data.length === 0) {
      return (
        <div className="card mt-6">
          <EmptyState
            title="No accounts yet"
            description="Add a bank account, card, cash or wallet so you can record transactions against it."
            action={
              <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
                Add account
              </button>
            }
          />
        </div>
      )
    }
    return (
      <>
        <p className="mt-6 text-sm text-muted-foreground">
          Total balance{' '}
          <span className="num font-medium text-foreground">{formatCurrency(total, currency)}</span> across{' '}
          {accounts.data.length} {accounts.data.length === 1 ? 'account' : 'accounts'}.
        </p>
        <ul className="card mt-3 divide-y divide-border">
          {accounts.data.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-medium">{a.name}</h3>
                <p className="text-xs text-muted-foreground">{a.type}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <span className="num mr-1 text-sm font-medium">{formatCurrency(a.balance, currency)}</span>
                <button type="button" className="btn-icon" onClick={() => setEditing(a)} aria-label={`Edit ${a.name}`}>
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  onClick={() => {
                    setDeleteError(null)
                    setDeleting(a)
                  }}
                  aria-label={`Delete ${a.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">Bank accounts, cards, cash and wallets.</p>
        </div>
        <button type="button" className="btn btn-primary shrink-0" onClick={() => setEditing('new')} disabled={!accounts.data}>
          <Plus size={16} aria-hidden />
          Add account
        </button>
      </div>

      {renderBody()}

      <Modal open={editing !== null} title={editing === 'new' ? 'Add account' : 'Edit account'} onClose={() => setEditing(null)}>
        {editing !== null && (
          <AccountForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            onSaved={onSaved}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete account?"
        message={
          deleting
            ? `“${deleting.name}” will be removed. Accounts that still have transactions cannot be deleted.`
            : ''
        }
        busy={deleteBusy}
        error={deleteError}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}

function AccountForm({
  initial,
  onSaved,
  onCancel,
}: {
  initial: Account | null
  onSaved: () => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [type, setType] = useState<AccountType>(initial?.type ?? 'Bank')
  const [balance, setBalance] = useState(initial ? String(initial.balance) : '0')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const value = Number(balance || 0)
    if (!name.trim()) return setError('Give the account a name.')
    if (!Number.isFinite(value)) return setError('Enter a valid balance.')
    setSaving(true)
    try {
      const input = { name: name.trim(), type, balance: value }
      if (initial) await updateAccount(initial.id, input)
      else await createAccount(input)
      onSaved()
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t save this account.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div>
        <label htmlFor="account-name" className="label">Account name</label>
        <input id="account-name" className="input" type="text" required autoFocus value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <label htmlFor="account-type" className="label">Type</label>
        <select id="account-type" className="input" value={type} onChange={(e) => setType(e.target.value as AccountType)}>
          {ACCOUNT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="account-balance" className="label">{initial ? 'Balance' : 'Opening balance'}</label>
        <input
          id="account-balance"
          className="input"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
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
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add account'}
        </button>
      </div>
    </form>
  )
}
