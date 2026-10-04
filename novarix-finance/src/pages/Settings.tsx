import { useState, type FormEvent } from 'react'
import { LogOut } from 'lucide-react'
import { ErrorState, LoadingRows } from '@/components/ui/StateViews'
import { useAuth } from '@/context/AuthContext'
import { useResource } from '@/hooks/useResource'
import { useTheme, type ThemePreference } from '@/hooks/useTheme'
import { errorMessage, getProfile, saveProfile } from '@/lib/api'
import { BRANDING_CREDIT, CURRENCIES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function ProfileForm({ profile, email, fallbackName, onSaved }: { profile: Profile | null; email: string; fallbackName: string; onSaved: () => void }) {
  const [name, setName] = useState(profile?.name ?? fallbackName)
  const [currency, setCurrency] = useState(profile?.currency ?? 'USD')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  // Keep a stored currency selectable even if it is not in the standard list.
  const options = CURRENCIES.some((c) => c.code === currency) ? [...CURRENCIES] : [{ code: currency, label: currency }, ...CURRENCIES]

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    if (!name.trim()) return setError('Enter your name.')
    setSaving(true)
    try {
      await saveProfile({ name: name.trim(), currency })
      setSaved(true)
      onSaved()
    } catch (err) {
      setError(errorMessage(err, 'Couldn’t save your profile.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
      <div>
        <label htmlFor="profile-name" className="label">Name</label>
        <input id="profile-name" className="input" type="text" autoComplete="name" required value={name} onChange={(e) => { setName(e.target.value); setSaved(false) }} />
      </div>
      <div>
        <label htmlFor="profile-email" className="label">Email</label>
        <input id="profile-email" className="input bg-subtle text-muted-foreground" type="email" value={email} readOnly aria-describedby="email-note" />
        <p id="email-note" className="mt-1.5 text-xs text-muted-foreground">Your sign-in email. It can’t be changed here.</p>
      </div>
      <div>
        <label htmlFor="profile-currency" className="label">Currency</label>
        <select id="profile-currency" className="input" value={currency} onChange={(e) => { setCurrency(e.target.value); setSaved(false) }}>
          {options.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}, {c.label}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-muted-foreground">Changes how amounts are displayed. Existing amounts are not converted.</p>
      </div>

      {error && (
        <div role="alert" className="rounded-md border border-negative/40 bg-negative/10 px-3 py-2 text-sm text-negative">
          {error}
        </div>
      )}
      {saved && (
        <div role="status" className="rounded-md border border-positive/40 bg-positive/10 px-3 py-2 text-sm text-positive">
          Profile saved.
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </form>
  )
}

export function Settings() {
  const { user, displayName, signOut } = useAuth()
  const { preference, setPreference } = useTheme()
  const profile = useResource(getProfile, [])

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Profile, currency and preferences.</p>

      <div className="mt-6 space-y-4">
        <Section title="Profile" description="How you appear in Novarix and how amounts are shown">
          {profile.error ? (
            <ErrorState message={profile.error} onRetry={profile.reload} />
          ) : profile.loading && !profile.data ? (
            <LoadingRows count={3} />
          ) : (
            <ProfileForm
              key={profile.data?.id ?? 'new'}
              profile={profile.data}
              email={user?.email ?? ''}
              fallbackName={displayName}
              onSaved={profile.reload}
            />
          )}
        </Section>

        <Section title="Appearance" description="Applies on this device">
          <div role="group" aria-label="Theme" className="inline-flex rounded-md border border-border-strong p-0.5">
            {THEMES.map((t) => (
              <button
                key={t.value}
                type="button"
                aria-pressed={preference === t.value}
                onClick={() => setPreference(t.value)}
                className={cn(
                  'h-8 rounded-sm px-4 text-sm transition-colors',
                  preference === t.value ? 'bg-primary font-medium text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">System follows your device’s light or dark setting.</p>
        </Section>

        <Section title="Account" description={user?.email ? `Signed in as ${user.email}` : 'Signed in'}>
          <button type="button" className="btn btn-secondary" onClick={() => void signOut()}>
            <LogOut size={16} aria-hidden />
            Sign out
          </button>
        </Section>

        <Section title="About" description="Product and founder credit">
          <p className="text-sm text-muted-foreground">{BRANDING_CREDIT}</p>
        </Section>
      </div>
    </div>
  )
}
