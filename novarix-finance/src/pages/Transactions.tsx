import { useMemo, useState, type FormEvent } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/StateViews'
import { useCurrency } from '@/hooks/useCurrency'
import { useResource } from '@/hooks/useResource'
import {
  createAccount,
  createTransaction,
  deleteTransaction,
  errorMessage,
  listAccounts,
  listTransactions,
  updateTransaction,
} from '@/lib/api'
import { ACCOUNT_TYPES, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/constants'
import { cn, formatCurrency, formatDate, toISODate } from '@/lib/utils'
import type { Account, AccountType, Transaction, TransactionType } from '@/types'

const NEW_ACCOUNT = '__new__'
const categoriesFor = (type: TransactionType): readonly string[] =>
  type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

export function Transactions() {
  const currency = useCurrency()
  const txs = useResource(() => listTransactions(), [])
  const accounts = useResource(listAccounts, [])

  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editing, setEditing] = useState<Transaction | 'new' | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const accountNames = useMemo(() => new Map((accounts.data ?? []).map((a) => [a.id, a.name])), [accounts.data])

  const filterCategories: readonly string[] =
    typeFilter === 'income'
      ? INCOME_CATEGORIES
      : typeFilter === 'expense'
        ? EXPENSE_CATEGORIES
        : [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (txs.data ?? []).filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
      if (!q) return true
      const haystack = `${t.description ?? ''} ${t.category} ${accountNames.get(t.account_id) ?? ''} ${t.amount}`
      return haystack.toLowerCase().includes(q)
    })
  }, [txs.data, query, typeFilter, categoryFilter, accountNames])

  const totals = useMemo(
    () =>
      rows.reduce(
        (sum, t) => (t.type === 'income' ? { ...sum, income: sum.income + t.amount } : { ...sum, expense: sum.expense + t.amount }),
        { income: 0, expense: 0 },
      ),
    [rows],
  )

  function clearFilters() {
    setQuery('')
    setTypeFilter('all')
    setCategoryFilter('all')
  }

  function onSaved() {
    setEditing(null)
    txs.reload()
    accounts.reload()
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeleteBusy(true)
    setDeleteError(null)
    try {
      await deleteTransaction(deleting.id)
      setDeleting(null)
      txs.reload()
    } catch (e) {
      setDeleteError(errorMessage(e, 'Couldn’t delete this transaction.'))
    } finally {
      setDeleteBusy(false)
    }
  }

  const error = txs.error ?? accounts.error
  const all = txs.data ?? []

  function renderBody() {
    if (error) {
      return (
        <ErrorState
          message={error}
          onRetry={() => {
            txs.reload()
            accounts.reload()
          }}
        />
      )
    }
    if (txs.loading && !txs.data) return <LoadingRows />
    if (all.length === 0) {
      return (
        <EmptyState
          title="No transactions yet"
          description="Record your first income or expense to start tracking where your money goes."
          action={
            <button type="button" className="btn btn-primary" onClick={() => setEditing('new')} disabled={!accounts.data}>
              Add transaction
            </button>
          }
        />
      )
    }
    if (rows.length === 0) {
      return (
        <EmptyState
          title="No matching transactions"
          description="Try a different search, or clear the filters."
          action={
            <button type="button" className="btn btn-secondary" onClick={clearFilters}>
              Clear filters
            </button>
          }
        />
      )
    }
    return (
      <>
        <div className="hidden grid-cols-[88px_minmax(0,1fr)_140px_120px_64px] gap-x-4 border-b border-border px-4 py-2 text-xs text-muted-foreground md:grid">
          <span>Date</span>
          <span>Description</span>
          <span>Account</span>
          <span className="text-right">Amount</span>
          <span className="sr-only">Actions</span>
        </div>
        <ul className="divide-y divide-border">
          {rows.map((t) => {
            const accountName = accountNames.get(t.account_id) ?? 'Unknown account'
            const label = t.description || t.category
            return (
              <li
                key={t.id}
                className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-4 px-4 py-2.5 md:grid-cols-[88px_minmax(0,1fr)_140px_120px_64px]"
              >
                <span className="num hidden text-xs text-muted-foreground md:block">{formatDate(t.date)}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm">{label}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.category}
                    <span className="md:hidden">, {accountName}, {formatDate(t.date)}</span>
                  </p>
                </div>
                <span className="hidden truncate text-sm text-muted-foreground md:block">{accountName}</span>
                <span className={cn('num text-right text-sm font-medium', t.type === 'income' && 'text-positive')}>
                  {t.type === 'income' ? '+' : '−'}
                  {formatCurrency(t.amount, currency)}
                </span>
                <div className="flex justify-end">
                  <button type="button" className="btn-icon" onClick={() => setEditing(t)} aria-label={`Edit ${label}`}>
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => {
                      setDeleteError(null)
                      setDeleting(t)
                    }}
                    aria-label={`Delete ${label}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            {rows.length} of {all.length} shown
          </span>
          <span className="flex gap-4">
            <span>
              Income <span className="num font-medium text-positive">{formatCurrency(totals.income, currency)}</span>
            </span>
            <span>
              Expenses <span className="num font-medium text-foreground">{formatCurrency(totals.expense, currency)}</span>
            </span>
          </span>
        </div>
      </>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">Every income and expense, searchable and filterable.</p>
        </div>
        <button type="button" className="btn btn-primary shrink-0" onClick={() => setEditing('new')} disabled={!accounts.data}>
          <Plus size={16} aria-hidden />
          Add transaction
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            className="input pl-8"
            type="search"
            placeholder="Search description, category or account"
            aria-label="Search transactions"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-36"
          aria-label="Filter by type"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as 'all' | TransactionType)
            setCategoryFilter('all')
          }}
        >
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          className="input sm:w-44"
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All categories</option>
          {filterCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="card mt-4 overflow-hidden">{renderBody()}</div>

      <Modal
        open={editing !== null}
        title={editing === 'new' ? 'Add transaction' : 'Edit transaction'}
        onClose={() => setEditing(null)}
      >
        {editing !== null && (
          <TransactionForm
            key={editing === 'new' ? 'new' : editing.id}
            initial={editing === 'new' ? null : editing}
            accounts={accounts.data ?? []}
            onSaved={onSaved}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        title="Delete transaction?"
        message={
          deleting
            ? `This permanently removes “${deleting.description || deleting.category}” (${formatCurrency(deleting.amount, currency)}).`
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

interface TransactionFormProps {
  initial: Transaction | null
  accounts: Account[]
  onSaved: () => void
  onCancel: () => void
}

function TransactionForm({ initial, accounts, onSaved, onCancel }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [category, setCategory] = useState<string>(initial?.category ?? EXPENSE_CATEGORIES[0])
  const [date, setDate] = useState(initial?.date ?? toISODate())
  const [description, setDescription] = useState(initial?.description ?? '')
  const [created, setCreated] = useState<Account[]>([])
  const [accountId, setAccountId] = useState(initial?.account_id ?? accounts[0]?.id ?? NEW_ACCOUNT)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<AccountType>('Bank')
  const [openingBalance, setOpeningBalance] = useState('0')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const accountOptions = [...accounts, ...created.filter((c) => !accounts.some((a) => a.id === c.id))]
  const base = categoriesFor(type)
  const categoryOptions = base.includes(category) ? base : [category, ...base]

  function changeType(next: TransactionType) {
    setType(next)
    const list = categoriesFor(next)
    if (!list.includes(category)) setCategory(list[0])
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) return setError('Enter an amount greater than 0.')
    if (accountId === NEW_ACCOUNT && !newName.trim()) return setError('Name the new account.')

    setSaving(true)
    try {
      let targetAccount = accountId
      if (accountId === NEW_ACCOUNT) {
        const account = await createAccount({
          name: newName.trim(),
          type: newType,
          balance: Number(openingBalance) || 0,
        })
        // Keep the created account selected so a retry doesn't create it twice.
        setCreated((list) => [...list, account])
        setAccountId(account.id)
        targetAccount = account.id
      }
      const input = {
        account_id: targetAccount,
        type,
        category,
        amount: value,
        date,
        description: description.trim() || null,
      }
      if (initial) await updateTransaction(initial.id, input)
      else await createTransaction(input)
      onSaved()
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t save this transaction.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div role="group" aria-label="Transaction type" className="flex rounded-md border border-border-strong p-0.5">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={type === t}
            onClick={() => changeType(t)}
            className={cn(
              'h-8 flex-1 rounded-sm text-sm transition-colors',
              type === t ? 'bg-primary font-medium text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t === 'expense' ? 'Expense' : 'Income'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="tx-amount" className="label">Amount</label>
          <input
            id="tx-amount"
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
        <div>
          <label htmlFor="tx-date" className="label">Date</label>
          <input id="tx-date" className="input" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor="tx-category" className="label">Category</label>
        <select id="tx-category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="tx-account" className="label">Account</label>
        <select id="tx-account" className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          {accountOptions.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
          <option value={NEW_ACCOUNT}>New account…</option>
        </select>
      </div>

      {accountId === NEW_ACCOUNT && (
        <div className="space-y-3 rounded-md border border-border p-3">
          {accountOptions.length === 0 && (
            <p className="text-xs text-muted-foreground">Transactions belong to an account. Create your first one here.</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="acc-name" className="label">Account name</label>
              <input id="acc-name" className="input" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="acc-type" className="label">Type</label>
              <select id="acc-type" className="input" value={newType} onChange={(e) => setNewType(e.target.value as AccountType)}>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="acc-balance" className="label">Opening balance</label>
            <input
              id="acc-balance"
              className="input"
              type="number"
              inputMode="decimal"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
            />
          </div>
        </div>
      )}

      <div>
        <label htmlFor="tx-description" className="label">Description (optional)</label>
        <input id="tx-description" className="input" type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
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
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Add transaction'}
        </button>
      </div>
    </form>
  )
}
