import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { ROUTES } from '@/lib/constants'

interface AuthResult {
  error: string | null
  /** True when sign-up succeeded but the email must be confirmed before a session exists. */
  needsConfirmation?: boolean
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  displayName: string
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (name: string, email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const NOT_CONFIGURED = 'Supabase is not configured. Add your project URL and anon key to .env.'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    // Restore a persisted session, then follow changes (login, logout, token refresh, other tabs).
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback<AuthContextValue['signIn']>(async (email, password) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }, [])

  const signUp = useCallback<AuthContextValue['signUp']>(async (name, email, password) => {
    if (!isSupabaseConfigured) return { error: NOT_CONFIGURED }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}${ROUTES.app}` },
    })
    if (error) return { error: error.message }
    return { error: null, needsConfirmation: !data.session }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const user = session?.user ?? null
    const meta = user?.user_metadata as { full_name?: string } | undefined
    return {
      user,
      session,
      loading,
      displayName: meta?.full_name?.trim() || user?.email?.split('@')[0] || '',
      signIn,
      signUp,
      signOut,
    }
  }, [session, loading, signIn, signUp, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

function Loading() {
  return (
    <div className="flex h-dvh items-center justify-center text-sm text-muted-foreground" role="status">
      Loading…
    </div>
  )
}

/** Protects app routes: unauthenticated visitors are sent to log in and returned afterwards. */
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (!user) return <Navigate to={ROUTES.login} replace state={{ from: location.pathname }} />
  return <Outlet />
}

/** For login and signup: signed-in users go straight to where they were headed. */
export function GuestOnly() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading />
  if (user) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from ?? ROUTES.app} replace />
  }
  return <Outlet />
}
