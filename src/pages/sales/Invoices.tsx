import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { calculateFromFields, colorPaintLines, customerName, documentCardDetails, hasEstimateColors, jobHeading } from '@/lib/estimateEngine'
import { formatCents } from '@/lib/money'
import { useSales } from '@/providers/SalesState'
import { ESTIMATE_TYPE_LABELS, INVOICE_STATUS_LABELS } from '@/types/sales'

export function Invoices() {
  const { invoices, customers, payments, estimates, deleteInvoice } = useSales()
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">PaintLedger</p>
        <h1 className="text-2xl font-semibold">Invoices</h1>
      </div>
      {invoices.length === 0 ? (
        <EmptyState title="No invoices yet" subtitle="Accept an estimate, then convert it. Scope and pricing carry over automatically." />
      ) : (
        <div className="grid gap-3">
          {invoices.map((invoice) => {
            const totals = calculateFromFields(invoice)
            const paid = payments.filter((item) => item.invoiceId === invoice.id).reduce((sum, item) => sum + item.amountPaidCents, 0)
            const customer = customers.find((item) => item.id === invoice.customerId)
            const details = documentCardDetails(invoice)
            const estimate = estimates.find((item) => item.id === invoice.estimateId)
            const jobName = invoice.jobName || estimate?.jobName || ''
            const relatedOrders = invoices.filter((item) => item.estimateId === invoice.estimateId && item.kind === 'change_order')
            const isChangeOrder = invoice.kind === 'change_order'
            const colorSource = hasEstimateColors(invoice.colors, details.type)
              ? invoice.colors
              : estimate?.colors ?? invoice.colors
            const colorLines = colorPaintLines(colorSource, details.type, totals)
            return (
              <div key={invoice.id} className="rounded-2xl border border-line bg-surface p-5">
                <button className="w-full text-left" onClick={() => navigate(`/sales/invoices/${invoice.id}`)}>
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{jobHeading(jobName, invoice.number)}</p>
                        {jobName ? <span className="text-sm text-muted">{invoice.number}</span> : null}
                        <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">
                          {isChangeOrder ? 'Change Order' : ESTIMATE_TYPE_LABELS[details.type]}
                        </span>
                        {!isChangeOrder && relatedOrders.length ? (
                          <span className="rounded-full bg-urgent/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-urgent">
                            Has change orders
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted">{customer ? customerName(customer.firstName, customer.lastName) : 'Client'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCents(totals.totalCents)}</p>
                      <p className="text-xs text-muted">
                        {INVOICE_STATUS_LABELS[invoice.status]} · Balance {formatCents(Math.max(0, totals.totalCents - paid))}
                      </p>
                    </div>
                  </div>
                  {isChangeOrder && invoice.lineItems.length ? (
                    <p className="mt-3 text-sm text-ink">{invoice.lineItems.map((item) => item.label).join(' · ')}</p>
                  ) : details.facts.length ? (
                    <p className="mt-3 text-sm text-ink">{details.facts.join(' · ')}</p>
                  ) : null}
                  {!isChangeOrder && details.rooms.length ? (
                    <p className="mt-1 text-sm text-muted">
                      {details.rooms.slice(0, 5).join(', ')}
                      {details.rooms.length > 5 ? ` +${details.rooms.length - 5}` : ''}
                    </p>
                  ) : null}
                  {!isChangeOrder && colorLines.length ? (
                    <div className="mt-2 space-y-0.5 text-sm text-muted">
                      {colorLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  ) : null}
                </button>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (window.confirm(`Delete invoice ${invoice.number}? This cannot be undone.`)) {
                        deleteInvoice(invoice.id)
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
