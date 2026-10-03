import type { ReactNode } from 'react'

export function LoadingRows({ count = 5 }: { count?: number }) {
  return (
    <div role="status" aria-label="Loading" className="divide-y divide-border">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <div className="space-y-1.5">
            <div className="h-3.5 w-40 animate-pulse rounded-sm bg-subtle" />
            <div className="h-3 w-24 animate-pulse rounded-sm bg-subtle" />
          </div>
          <div className="h-3.5 w-16 animate-pulse rounded-sm bg-subtle" />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = 'Couldn’t load this page',
  message,
  onRetry,
}: {
  title?: string
  message: string
  onRetry?: () => void
}) {
  return (
    <div role="alert" className="px-4 py-12 text-center">
      <p className="text-sm font-medium text-negative">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <div className="mt-4 flex justify-center">
          <button type="button" className="btn btn-secondary" onClick={onRetry}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
