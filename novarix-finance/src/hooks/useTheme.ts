import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'novarix-theme'

export type ThemePreference = 'light' | 'dark' | 'system'

function getPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch {
    // Storage can be unavailable in restricted browser contexts.
  }
  return 'system'
}

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

const getSnapshot = () => document.documentElement.classList.contains('dark')

/** The initial class is set by the inline script in index.html to avoid a flash. */
export function useTheme() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, () => false)
  const [preference, setPreferenceState] = useState<ThemePreference>(getPreference)

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage can be unavailable in restricted browser contexts.
    }
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyPreference = () => {
      document.documentElement.classList.toggle(
        'dark',
        preference === 'dark' || (preference === 'system' && media.matches),
      )
    }
    applyPreference()
    if (preference === 'system') media.addEventListener('change', applyPreference)
    return () => media.removeEventListener('change', applyPreference)
  }, [preference])

  const toggle = useCallback(() => {
    setPreference(isDark ? 'light' : 'dark')
  }, [isDark, setPreference])

  return { isDark, preference, setPreference, toggle }
}
