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

// Fallback paths in case constants load as undefined
const landingPath = ROUTES?.landing || '/'
const loginPath = ROUTES?.login || '/login'
const signupPath = ROUTES?.signup || '/signup'
const appPath = ROUTES?.app || '/app'
const transactionsPath = ROUTES?.transactions || '/transactions'
const accountsPath = ROUTES?.accounts || '/accounts'
const budgetsPath = ROUTES?.budgets || '/budgets'
const goalsPath = ROUTES?.goals || '/goals'
const insightsPath = ROUTES?.insights || '/insights'
const analyticsPath = ROUTES?.analytics || '/analytics'
const settingsPath = ROUTES?.settings || '/settings'

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Landing Page */}
      <Route path={landingPath} element={<LandingPage />} />

      {/* Guest Only Routes */}
      <Route element={<GuestOnly />}>
        <Route path={loginPath} element={<Auth key="login" mode="login" />} />
        <Route path={signupPath} element={<Auth key="signup" mode="signup" />} />
      </Route>

      {/* Authenticated Routes */}
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path={appPath} element={<Dashboard />} />
          <Route path={transactionsPath} element={<Transactions />} />
          <Route path={accountsPath} element={<Accounts />} />
          <Route path={budgetsPath} element={<Budgets />} />
          <Route path={goalsPath} element={<Goals />} />
          <Route path={insightsPath} element={<InsightsPage />} />
          <Route path={analyticsPath} element={<Analytics />} />
          <Route path={settingsPath} element={<Settings />} />
        </Route>
      </Route>

      {/* Fallback to Landing Page */}
      <Route path="*" element={<Navigate to={landingPath} replace />} />
    </Routes>
  )
}