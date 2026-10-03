import { useEffect, useState } from 'react'
import { getProfile } from '@/lib/api'
import { DEFAULT_CURRENCY } from '@/lib/constants'

/** The signed-in user's currency from their profile (the database defaults it to USD). */
export function useCurrency() {
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY)
  useEffect(() => {
    let active = true
    getProfile()
      .then((p) => {
        if (active && p?.currency) setCurrency(p.currency)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])
  return currency
}
