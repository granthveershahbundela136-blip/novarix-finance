import type { ReactNode } from 'react'

export function EmptyState({
  title = 'No items found',
  description,
  action,
}: {
  title?: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <h3 className="text-sm font-semibold">{title}</h3>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-sm font-medium text-negative">{message || 'Something went wrong.'}</p>
      {onRetry ? (
        <button type="button" onClick={onRetry} className="btn btn-secondary mt-4 h-8">
          Try again
        </button>
      ) : null}
    </div>
  )
}

export function LoadingRows({ count = 3 }: { count?: number }) {
  return (
    <div className="animate-pulse divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-4">
          <div className="space-y-2">
            <div className="h-4 w-32 rounded bg-subtle" />
            <div className="h-3 w-20 rounded bg-subtle" />
          </div>
          <div className="h-4 w-16 rounded bg-subtle" />
        </div>
      ))}
    </div>
  )
}