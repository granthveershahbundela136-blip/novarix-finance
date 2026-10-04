export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-sm text-negative font-medium">{message || 'Something went wrong.'}</p>
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
    <div className="divide-y divide-border animate-pulse">
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