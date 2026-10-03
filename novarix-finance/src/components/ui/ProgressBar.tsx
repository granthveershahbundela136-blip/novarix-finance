import { cn } from '@/lib/utils'

const TONES = { positive: 'bg-positive', warning: 'bg-warning', negative: 'bg-negative' } as const

export function ProgressBar({
  percent,
  tone = 'positive',
  label,
}: {
  percent: number
  tone?: keyof typeof TONES
  label: string
}) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className="h-1.5 w-full overflow-hidden rounded-full bg-border"
    >
      <div className={cn('h-full rounded-full', TONES[tone])} style={{ width: `${clamped}%` }} />
    </div>
  )
}
