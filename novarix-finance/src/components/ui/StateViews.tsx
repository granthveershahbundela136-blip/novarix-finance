import React from 'react'
import { AlertCircle, FolderOpen } from 'lucide-react'

export function LoadingRows({ rows, count }: { rows?: number; count?: number }) {
  const rowCount = rows ?? count ?? 3
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rowCount }).map((_, i) => (
        <div key={i} className="h-10 w-full animate-pulse rounded-md bg-subtle" />
      ))}
    </div>
  )
}

export function EmptyState({
  title = 'No items found',
  description = 'There is no data to display right now.',
  action,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <FolderOpen className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'Failed to load data. Please try again.',
  message,
  retry,
  onRetry,
}: {
  title?: string
  description?: string
  message?: string
  retry?: () => void
  onRetry?: () => void
}) {
  const detail = message ?? description
  const retryAction = onRetry ?? retry
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <h3 className="mt-4 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      {retryAction && (
        <button
          type="button"
          onClick={retryAction}
          className="mt-4 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          Try Again
        </button>
      )}
    </div>
  )
}