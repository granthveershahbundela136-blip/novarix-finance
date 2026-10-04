import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { BRANDING_CREDIT, ROUTES } from '@/lib/constants'
import { cn, formatCurrency } from '@/lib/utils'

const SAMPLE_ROWS = [
  { note: 'Monthly salary', category: 'Salary', amount: 85000 },
  { note: 'Groceries', category: 'Food', amount: -2480 },
  { note: 'Metro card top-up', category: 'Transport', amount: -500 },
  { note: 'Design project', category: 'Freelance', amount: 12000 },
  { note: 'Streaming plan', category: 'Subscriptions', amount: -649 },
  { note: 'Electricity bill', category: 'Bills', amount: -1850 },
]

const FEATURES = [
  { title: 'All your accounts together', body: 'Add bank accounts, cards, cash and wallets. See balances and recent activity in one place.' },
  { title: 'Budgets by category', body: 'Set a monthly limit for food, bills, travel and more, and see how much is left.' },
  { title: 'Goals and insights', body: 'Save toward a target date and get plain-language notes when your spending changes.' },
]

export function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 md:px-8">
          <span className="text-sm font-semibold tracking-wide">NOVARIX FINANCE</span>
          <nav aria-label="Account" className="flex items-center gap-2">
            {user ? (
              <Link to={ROUTES.app || '/app'} className="btn btn-primary h-8">Open dashboard</Link>
            ) : (
              <>
                <Link to={ROUTES.login || '/login'} className="btn btn-ghost h-8">Log In</Link>
                <Link to={ROUTES.signup || '/signup'} className="btn btn-primary h-8">Get Started</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:px-8 lg:grid-cols-2 lg:py-20">
          <div>
            <h1 className="text-4xl font-semibold">Your money, understood.</h1>
            <p className="mt-4 max-w-md text-lg text-muted-foreground">
              Track accounts, spending, budgets and goals in one place, with a clear read on where your money goes each month.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {user ? (
                <Link to={ROUTES.app || '/app'} className="btn btn-primary">Open dashboard</Link>
              ) : (
                <>
                  <Link to={ROUTES.signup || '/signup'} className="btn btn-primary">Get Started</Link>
                  <Link to={ROUTES.login || '/login'} className="btn btn-secondary">Log In</Link>
                </>
              )}
            </div>
          </div>

          <div className="card overflow-hidden" aria-label="Sample transactions">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <h2 className="text-sm font-medium">Recent transactions</h2>
              <span className="text-xs text-muted-foreground">Sample data</span>
            </div>
            <ul className="divide-y divide-border">
              {SAMPLE_ROWS.map((row) => (
                <li key={row.note} className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{row.note}</p>
                    <p className="text-xs text-muted-foreground">{row.category}</p>
                  </div>
                  <span className={cn('num text-sm font-medium', row.amount > 0 && 'text-positive')}>
                    {row.amount > 0 ? '+' : '−'}
                    {formatCurrency(Math.abs(row.amount))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t border-border bg-surface">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:px-8">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="about" className="border-t border-border" aria-labelledby="about-heading">
          <div className="mx-auto max-w-6xl px-4 py-12 md:px-8">
            <h2 id="about-heading" className="text-sm font-semibold">About</h2>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{BRANDING_CREDIT}</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground md:px-8">
          © {new Date().getFullYear()} {BRANDING_CREDIT}
        </div>
      </footer>
    </div>
  )
}