import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { GuestOnly, RequireAuth } from '@/context/AuthContext'
import { ROUTES } from '@/lib/constants'
import { Accounts } from '@/pages/Accounts'
import { Analytics } from '@/pages/Analytics'
import { Auth } from '@/pages/Auth'
import { Budgets } from '@/pages/Budgets'
import { Dashboard } from '@/pages/Dashboard'
import { Goals } from '@/pages/Goals'
import { InsightsPage } from '@/pages/InsightsPage'
import { LandingPage } from '@/pages/LandingPage'
import { Settings } from '@/pages/Settings'
import { Transactions } from '@/pages/Transactions'

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
          <Route path={ROUTES.app} element={<Dashboard />} />
          <Route path={ROUTES.transactions} element={<Transactions />} />
          <Route path={ROUTES.accounts} element={<Accounts />} />
          <Route path={ROUTES.budgets} element={<Budgets />} />
          <Route path={ROUTES.goals} element={<Goals />} />
          <Route path={ROUTES.insights} element={<InsightsPage />} />
          <Route path={ROUTES.analytics} element={<Analytics />} />
          <Route path={ROUTES.settings} element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
    </Routes>
  )
}
