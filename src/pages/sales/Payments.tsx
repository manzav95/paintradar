import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'
import { jobHeading } from '@/lib/estimateEngine'
import { formatCents } from '@/lib/money'
import { useSales } from '@/providers/SalesState'

export function Payments() {
  const { payments, invoices, estimates } = useSales()

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">PaintLedger</p>
        <h1 className="text-2xl font-semibold">Payments</h1>
      </div>
      {payments.length === 0 ? (
        <EmptyState title="No payments yet" subtitle="Convert an accepted estimate to create the 10 / 40 / 50 schedule." />
      ) : (
        <div className="space-y-2">
          {payments.map((payment) => {
            const invoice = invoices.find((item) => item.id === payment.invoiceId)
            const estimate = estimates.find((item) => item.id === invoice?.estimateId)
            const jobName = invoice?.jobName || estimate?.jobName || ''
            return (
              <Link
                key={payment.id}
                to={`/sales/invoices/${payment.invoiceId}`}
                className="flex items-center justify-between rounded-2xl border border-line bg-surface px-4 py-4 hover:border-gold/30"
              >
                <div>
                  <p className="font-medium">{jobHeading(jobName, payment.label)}</p>
                  <p className="text-sm text-muted">
                    {jobName ? `${payment.label} · ` : ''}
                    {invoice?.number ?? 'Invoice'}
                    {invoice?.kind === 'change_order' ? ' · Change order' : ''}
                    {' · '}
                    {payment.notes || payment.method || 'Scheduled'}
                  </p>
                </div>
                <p className="font-semibold">
                  {formatCents(payment.amountPaidCents)} / {formatCents(payment.amountDueCents)}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
