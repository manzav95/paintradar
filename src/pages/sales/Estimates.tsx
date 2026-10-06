import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { calculateFromFields, colorPaintLines, customerName, documentCardDetails, jobHeading } from '@/lib/estimateEngine'
import { formatCents } from '@/lib/money'
import { useSales } from '@/providers/SalesState'
import { ESTIMATE_STATUS_LABELS, ESTIMATE_TYPE_LABELS } from '@/types/sales'

export function Estimates({ term = 'Estimate' }: { term?: string }) {
  const { estimates, customers, changeOrders, duplicateEstimate, deleteEstimate } = useSales()
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">PaintLedger</p>
          <h1 className="text-2xl font-semibold">{term}s</h1>
        </div>
        <Button variant="primary" onClick={() => navigate('/sales/estimates/new')}>
          New {term}
        </Button>
      </div>
      {estimates.length === 0 ? (
        <EmptyState
          title={`No ${term.toLowerCase()}s yet`}
          subtitle="Create a customer, walk the house, and watch the total build live."
          action={<Button variant="primary" onClick={() => navigate('/sales/estimates/new')}>Start interior estimate</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {estimates.map((estimate) => {
            const customer = customers.find((item) => item.id === estimate.customerId)
            const totals = calculateFromFields(estimate)
            const details = documentCardDetails(estimate)
            const orders = changeOrders.filter((item) => item.estimateId === estimate.id)
            const colorLines = colorPaintLines(estimate.colors, estimate.type, totals)
            return (
              <div key={estimate.id} className="rounded-2xl border border-line bg-surface p-5">
                <button className="w-full text-left" onClick={() => navigate(`/sales/estimates/${estimate.id}`)}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{jobHeading(estimate.jobName, estimate.number)}</p>
                        {estimate.jobName ? <span className="text-sm text-muted">{estimate.number}</span> : null}
                        <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">
                          {ESTIMATE_TYPE_LABELS[details.type]}
                        </span>
                        {orders.length ? (
                          <span className="rounded-full bg-urgent/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-urgent">
                            {orders.length} change order{orders.length === 1 ? '' : 's'}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted">
                        {customer ? customerName(customer.firstName, customer.lastName) : 'Unknown'}
                        {estimate.projectCity ? ` · ${estimate.projectCity}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gold-soft">{formatCents(totals.totalCents)}</p>
                      <p className="text-xs text-muted">{ESTIMATE_STATUS_LABELS[estimate.status]}</p>
                    </div>
                  </div>
                  {details.facts.length ? (
                    <p className="mt-3 text-sm text-ink">{details.facts.join(' · ')}</p>
                  ) : null}
                  {details.rooms.length ? (
                    <p className="mt-1 text-sm text-muted">{details.rooms.slice(0, 5).join(', ')}{details.rooms.length > 5 ? ` +${details.rooms.length - 5}` : ''}</p>
                  ) : null}
                  {colorLines.length ? (
                    <div className="mt-2 space-y-0.5 text-sm text-muted">
                      {colorLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  ) : null}
                  {details.roomColors.length ? (
                    <p className="mt-1 text-sm text-muted">{details.roomColors.join(' · ')}</p>
                  ) : null}
                </button>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => navigate(`/sales/jobs/${estimate.id}`)}>
                    Job
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const copy = duplicateEstimate(estimate.id)
                      if (copy) navigate(`/sales/estimates/${copy.id}`)
                    }}
                  >
                    Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(`Delete ${term.toLowerCase()} ${estimate.number}? This cannot be undone.`)) {
                        deleteEstimate(estimate.id)
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Quotes() {
  return <Estimates term="Quote" />
}
