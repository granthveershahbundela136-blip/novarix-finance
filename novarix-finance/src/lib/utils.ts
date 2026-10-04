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

function parseLocalDate(value: string | Date) {
  if (typeof value === 'string' && DATE_ONLY.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(value)
}

export function formatDate(value?: string | Date, style: 'short' | 'long' = 'short') {
  if (!value) return '—'
  const date = parseLocalDate(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(
    DEFAULT_LOCALE,
    style === 'long'
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'short', year: 'numeric' },
  ).format(date)
}

export function toISODate(d: Date = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Whole days from `from` (defaults to today) until `dateString`. */
export function daysUntil(dateString?: string, from: Date = new Date()) {
  if (!dateString) return 0
  const target = parseLocalDate(dateString)
  if (Number.isNaN(target.getTime())) return 0
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export function monthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { start: toISODate(start), end: toISODate(end) }
}
