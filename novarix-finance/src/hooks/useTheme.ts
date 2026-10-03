import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'novarix-theme'

function subscribe(callback: () => void) {
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  return () => observer.disconnect()
}

const getSnapshot = () => document.documentElement.classList.contains('dark')

/** The initial class is set by the inline script in index.html to avoid a flash. */
export function useTheme() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, () => false)

  const toggle = useCallback(() => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
    } catch {
      /* storage unavailable */
    }
  }, [])

  return { isDark, toggle }
}
