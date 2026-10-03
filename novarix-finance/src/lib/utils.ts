import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from '@/lib/constants'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY,
  options: { compact?: boolean } = {},
) {
  return new Intl.NumberFormat(DEFAULT_LOCALE, {
    style: 'currency',
    currency,
    notation: options.compact ? 'compact' : 'standard',
    maximumFractionDigits: Number.isInteger(amount) || options.compact ? 0 : 2,
  }).format(amount)
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export function formatDate(value: string | Date, style: 'short' | 'long' = 'short') {
  let date: Date
  if (typeof value === 'string' && DATE_ONLY.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    date = new Date(y, m - 1, d) // local date, avoids UTC day shift
  } else {
    date = new Date(value)
  }
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(
    DEFAULT_LOCALE,
    style === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric' },
  ).format(date)
}
