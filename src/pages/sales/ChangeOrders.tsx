import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { customerName, documentCardDetails, jobHeading } from '@/lib/estimateEngine'
import { isActiveJob, jobMoney } from '@/lib/jobs'
import { formatCents } from '@/lib/money'
import { useSales } from '@/providers/SalesState'
import { ESTIMATE_STATUS_LABELS, ESTIMATE_TYPE_LABELS } from '@/types/sales'

export function ChangeOrders() {
  const { estimates, invoices, customers, changeOrders, payments } = useSales()
  const navigate = useNavigate()
  const projects = estimates.filter((estimate) =>
    isActiveJob(estimate.status, invoices.some((invoice) => invoice.estimateId === estimate.id)),
  )

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">PaintLedger</p>
        <h1 className="text-2xl font-semibold">Change Orders</h1>
        <p className="text-sm text-muted">Open a current job, add extra scope, and issue a new invoice. The original estimate stays locked.</p>
      </div>
      {projects.length === 0 ? (
        <EmptyState
          title="No current projects"
          subtitle="Accept or convert an estimate first. Change orders attach to jobs that are already underway."
          action={<Button variant="primary" onClick={() => navigate('/sales/estimates')}>View estimates</Button>}
        />
      ) : (
        <div className="grid gap-3">
          {projects.map((estimate) => {
            const customer = customers.find((item) => item.id === estimate.customerId)
            const details = documentCardDetails(estimate)
            const money = jobMoney(estimate, invoices, changeOrders, payments)
            const orders = changeOrders.filter((item) => item.estimateId === estimate.id)
            return (
              <button
                key={estimate.id}
                className="w-full rounded-2xl border border-line bg-surface p-5 text-left hover:border-gold/30"
                onClick={() => navigate(`/sales/jobs/${estimate.id}`)}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
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
                    {details.rooms.length ? <p className="mt-1 text-sm text-muted">{details.rooms.slice(0, 4).join(', ')}</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gold-soft">{formatCents(money.jobTotalCents)}</p>
                    <p className="text-xs text-muted">{ESTIMATE_STATUS_LABELS[estimate.status]}</p>
                    {money.changeCents ? <p className="mt-1 text-xs text-urgent">+{formatCents(money.changeCents)} in change orders</p> : null}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
