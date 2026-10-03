import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { ROUTES } from '@/lib/constants'
import { isSupabaseConfigured } from '@/lib/supabase'

export function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup'
  const { signIn, signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setSubmitting(true)
    const result = isSignup
      ? await signUp(name.trim(), email.trim(), password)
      : await signIn(email.trim(), password)
    setSubmitting(false)
    if (result.error) setError(result.error)
    else if (result.needsConfirmation)
      setNotice(`We sent a confirmation link to ${email.trim()}. Open it to finish creating your account.`)
    // On success with a session, GuestOnly redirects into the app.
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-12 items-center border-b border-border bg-surface px-4 md:px-8">
        <Link to={ROUTES.landing} className="text-sm font-semibold tracking-wide">
          NOVARIX FINANCE
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-12 md:items-center md:py-0">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold">{isSignup ? 'Create your account' : 'Log in to Novarix'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isSignup ? 'Start tracking your money in a couple of minutes.' : 'Welcome back. Enter your details to continue.'}
          </p>

          {!isSupabaseConfigured && (
            <div role="status" className="mt-5 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm">
              Supabase isn’t configured. Copy <code className="font-mono text-xs">.env.example</code> to{' '}
              <code className="font-mono text-xs">.env</code> and add your project URL and anon key.
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate={false}>
            {isSignup && (
              <div>
                <label htmlFor="name" className="label">Full name</label>
                <input id="name" className="input" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                minLength={isSignup ? 8 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {isSignup && <p className="mt-1.5 text-xs text-muted-foreground">Use at least 8 characters.</p>}
            </div>

            {error && (
              <div role="alert" className="rounded-md border border-negative/40 bg-negative/10 px-3 py-2 text-sm text-negative">
                {error}
              </div>
            )}
            {notice && (
              <div role="status" className="rounded-md border border-positive/40 bg-positive/10 px-3 py-2 text-sm text-positive">
                {notice}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting ? (isSignup ? 'Creating account…' : 'Logging in…') : isSignup ? 'Create account' : 'Log in'}
            </button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground">
            {isSignup ? 'Already have an account? ' : 'New to Novarix? '}
            <Link to={isSignup ? ROUTES.login : ROUTES.signup} className="font-medium text-foreground underline underline-offset-4">
              {isSignup ? 'Log in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
