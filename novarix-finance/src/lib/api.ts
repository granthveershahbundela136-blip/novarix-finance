import { supabase } from '@/lib/supabase'
import type { Account, AccountType, Budget, Goal, Profile, Transaction, TransactionType } from '@/types'

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

export const errorMessage = (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback)

/** RLS policies require user_id = auth.uid(), and the tables have no default for it. */
async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new ApiError(error.message)
  const id = data.session?.user.id
  if (!id) throw new ApiError('You’re signed out. Sign in again to continue.')
  return id
}

function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new ApiError(res.error.message)
  return res.data as T
}

function assertOk(res: { error: { message: string } | null }) {
  if (res.error) throw new ApiError(res.error.message)
}

// numeric columns can arrive as strings depending on the client; normalise once here.
const toAccount = (r: Account): Account => ({ ...r, balance: Number(r.balance) })
const toTransaction = (r: Transaction): Transaction => ({ ...r, amount: Number(r.amount) })
const toBudget = (r: Budget): Budget => ({ ...r, amount: Number(r.amount) })
const toGoal = (r: Goal): Goal => ({
  ...r,
  target_amount: Number(r.target_amount),
  current_amount: Number(r.current_amount),
})

/* ---------- Profile ---------- */

export async function getProfile(): Promise<Profile | null> {
  const id = await currentUserId()
  return unwrap<Profile | null>(await supabase.from('profiles').select('*').eq('id', id).maybeSingle())
}

/* ---------- Accounts ---------- */

export interface AccountInput {
  name: string
  type: AccountType
  balance: number
}

export async function listAccounts(): Promise<Account[]> {
  const rows = unwrap<Account[]>(await supabase.from('accounts').select('*').order('name'))
  return rows.map(toAccount)
}

export async function createAccount(input: AccountInput): Promise<Account> {
  const user_id = await currentUserId()
  return toAccount(unwrap<Account>(await supabase.from('accounts').insert({ ...input, user_id }).select().single()))
}

export async function updateAccount(id: string, input: Partial<AccountInput>): Promise<Account> {
  return toAccount(unwrap<Account>(await supabase.from('accounts').update(input).eq('id', id).select().single()))
}

/** Fails while the account still has transactions (foreign key). */
export async function deleteAccount(id: string): Promise<void> {
  assertOk(await supabase.from('accounts').delete().eq('id', id))
}

/* ---------- Transactions ---------- */

export interface TransactionInput {
  account_id: string
  type: TransactionType
  category: string
  amount: number
  /** YYYY-MM-DD */
  date: string
  description: string | null
}

export interface TransactionQuery {
  from?: string
  to?: string
  type?: TransactionType
  limit?: number
}

export async function listTransactions(opts: TransactionQuery = {}): Promise<Transaction[]> {
  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 1000)
  if (opts.from) query = query.gte('date', opts.from)
  if (opts.to) query = query.lte('date', opts.to)
  if (opts.type) query = query.eq('type', opts.type)
  return unwrap<Transaction[]>(await query).map(toTransaction)
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const user_id = await currentUserId()
  return toTransaction(
    unwrap<Transaction>(await supabase.from('transactions').insert({ ...input, user_id }).select().single()),
  )
}

export async function updateTransaction(id: string, input: Partial<TransactionInput>): Promise<Transaction> {
  return toTransaction(
    unwrap<Transaction>(await supabase.from('transactions').update(input).eq('id', id).select().single()),
  )
}

export async function deleteTransaction(id: string): Promise<void> {
  assertOk(await supabase.from('transactions').delete().eq('id', id))
}

/* ---------- Budgets ---------- */

export interface BudgetInput {
  category: string
  amount: number
}

export async function listBudgets(): Promise<Budget[]> {
  return unwrap<Budget[]>(await supabase.from('budgets').select('*').order('category')).map(toBudget)
}

export async function createBudget(input: BudgetInput): Promise<Budget> {
  const user_id = await currentUserId()
  return toBudget(
    unwrap<Budget>(await supabase.from('budgets').insert({ ...input, period: 'monthly', user_id }).select().single()),
  )
}

export async function updateBudget(id: string, input: Partial<BudgetInput>): Promise<Budget> {
  return toBudget(unwrap<Budget>(await supabase.from('budgets').update(input).eq('id', id).select().single()))
}

export async function deleteBudget(id: string): Promise<void> {
  assertOk(await supabase.from('budgets').delete().eq('id', id))
}

/* ---------- Goals ---------- */

export interface GoalInput {
  name: string
  target_amount: number
  current_amount: number
  /** YYYY-MM-DD, or null for no deadline */
  deadline: string | null
}

export async function listGoals(): Promise<Goal[]> {
  return unwrap<Goal[]>(await supabase.from('goals').select('*').order('created_at', { ascending: false })).map(toGoal)
}

export async function createGoal(input: GoalInput): Promise<Goal> {
  const user_id = await currentUserId()
  return toGoal(unwrap<Goal>(await supabase.from('goals').insert({ ...input, user_id }).select().single()))
}

export async function updateGoal(id: string, input: Partial<GoalInput>): Promise<Goal> {
  return toGoal(unwrap<Goal>(await supabase.from('goals').update(input).eq('id', id).select().single()))
}

export async function deleteGoal(id: string): Promise<void> {
  assertOk(await supabase.from('goals').delete().eq('id', id))
}
export async function saveProfile(profileData: any) {
  return updateProfile(profileData);
}

export async function updateProfile(profileData: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, ...profileData, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
}