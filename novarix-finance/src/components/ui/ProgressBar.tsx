import { cn } from '@/lib/utils'

interface ProgressBarProps {
  percent: number
  tone?: 'positive' | 'warning' | 'negative' | 'normal' | string
  label?: string
}

const TONE_CLASSES: Record<string, string> = {
  positive: 'bg-positive',
  warning: 'bg-warning',
  negative: 'bg-negative',
  normal: 'bg-primary',
}

export function ProgressBar({ percent, tone = 'normal', label }: ProgressBarProps) {
  const bounded = Math.min(100, Math.max(0, percent || 0))
  const colorClass = TONE_CLASSES[tone] || 'bg-primary'

  return (
    <div
      role="progressbar"
      aria-valuenow={bounded}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || 'Progress bar'}
      className="h-2 w-full overflow-hidden rounded-full bg-subtle"
    >
      <div className={cn('h-full transition-all duration-300', colorClass)} style={{ width: `${bounded}%` }} />
    </div>
  )
}