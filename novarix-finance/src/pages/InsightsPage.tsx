import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingRows } from '@/components/ui/StateViews'
import { useFinanceData } from '@/hooks/useFinanceData'
import { ROUTES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { FinancialInsight, InsightSeverity } from '@/types'

const SEVERITY_BADGE: Record<InsightSeverity, { label: string; className: string }> = {
  high: { label: 'High priority', className: 'border-negative/40 bg-negative/10 text-negative' },
  medium: { label: 'Medium priority', className: 'border-warning/40 bg-warning/10 text-warning' },
  low: { label: 'Low priority', className: 'border-border-strong text-muted-foreground' },
}

export function actionLabel(route: string) {
  if (route.startsWith(ROUTES.budgets)) return 'Open budgets'
  if (route.startsWith(ROUTES.goals)) return 'Open goals'
  if (route.startsWith(ROUTES.analytics)) return 'Open analytics'
  return 'View transactions'
}

function InsightRow({ insight, showSeverity }: { insight: FinancialInsight; showSeverity: boolean }) {
  const badge = SEVERITY_BADGE[insight.severity]
  return (
    <li className="px-4 py-3.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h3 className="text-sm font-medium">{insight.title}</h3>
        {showSeverity && <span className={cn('rounded-sm border px-1.5 py-0.5 text-xs', badge.className)}>{badge.label}</span>}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{insight.description}</p>
      <p className="mt-1.5 text-sm">{insight.recommendation}</p>
      <Link to={insight.relatedRoute} className="btn btn-secondary mt-3 h-8">
        {actionLabel(insight.relatedRoute)}
      </Link>
    </li>
  )
}

function Section({
  title,
  description,
  items,
  empty,
  showSeverity = true,
}: {
  title: string
  description: string
  items: FinancialInsight[]
  empty: string
  showSeverity?: boolean
}) {
  return (
    <section className="mt-8 first:mt-6">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <span className="num text-xs text-muted-foreground">{items.length}</span>
      </div>
      <div className="card mt-3">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((i) => (
              <InsightRow key={i.id} insight={i} showSeverity={showSeverity} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export function InsightsPage() {
  const { insights, ready, error, reload, transactions } = useFinanceData()

  const review = insights.filter((i) => i.type === 'warning' || i.type === 'recommendation')
  const know = insights.filter((i) => i.type === 'information')
  const positive = insights.filter((i) => i.type === 'positive')

  return (
    <div>
      <h1 className="text-xl font-semibold">Insights</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Calculated from your own transactions, budgets and goals using fixed rules. Nothing here comes from an AI model.
      </p>

      {error ? (
        <div className="card mt-6">
          <ErrorState message={error} onRetry={reload} />
        </div>
      ) : !ready ? (
        <div className="card mt-6 overflow-hidden">
          <LoadingRows count={4} />
        </div>
      ) : transactions.length === 0 ? (
        <div className="card mt-6">
          <EmptyState
            title="No insights yet"
            description="Insights appear once you have recorded some transactions."
            action={
              <Link to={ROUTES.transactions} className="btn btn-primary">
                Add a transaction
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <Section
            title="Things to Review"
            description="Warnings and suggested changes"
            items={review}
            empty="Nothing needs your attention right now."
          />
          <Section
            title="Things to Know"
            description="Context on where your money is going"
            items={know}
            empty="No notes for this month."
          />
          <Section
            title="Positive Changes"
            description="What is going well"
            items={positive}
            empty="No positive changes detected yet."
            showSeverity={false}
          />
        </>
      )}
    </div>
  )
}
