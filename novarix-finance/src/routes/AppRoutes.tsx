import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { GuestOnly, RequireAuth, useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/lib/constants'
import { Auth } from '@/pages/Auth'
import { LandingPage } from '@/pages/LandingPage'

/** Temporary page body until each section is built in a later module. */
function PagePlaceholder({ title, description }: { title: string; description: string }) {
  const { displayName } = useAuth()
  return (
    <div>
      <h1 className="text-xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="card mt-6 px-4 py-10 text-center">
        <p className="text-sm font-medium">Nothing here yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {displayName ? `${displayName}, this` : 'This'} section arrives in an upcoming module.
        </p>
      </div>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.landing} element={<LandingPage />} />

      <Route element={<GuestOnly />}>
        <Route path={ROUTES.login} element={<Auth key="login" mode="login" />} />
        <Route path={ROUTES.signup} element={<Auth key="signup" mode="signup" />} />
      </Route>

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path={ROUTES.app} element={<PagePlaceholder title="Dashboard" description="Your balances, spending and goals at a glance." />} />
          <Route path={ROUTES.transactions} element={<PagePlaceholder title="Transactions" description="Every income and expense, searchable and filterable." />} />
          <Route path={ROUTES.accounts} element={<PagePlaceholder title="Accounts" description="Bank accounts, cards, cash and wallets." />} />
          <Route path={ROUTES.budgets} element={<PagePlaceholder title="Budgets" description="Monthly limits by category." />} />
          <Route path={ROUTES.goals} element={<PagePlaceholder title="Goals" description="Savings targets and progress." />} />
          <Route path={ROUTES.insights} element={<PagePlaceholder title="Insights" description="Notes on how your spending is changing." />} />
          <Route path={ROUTES.settings} element={<PagePlaceholder title="Settings" description="Profile, currency and preferences." />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
    </Routes>
  )
}
