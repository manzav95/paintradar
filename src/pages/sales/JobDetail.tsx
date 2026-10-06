import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChangeOrderComposer } from '@/components/sales/ChangeOrderComposer'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { calculateFromFields, customerName, documentCardDetails, jobHeading } from '@/lib/estimateEngine'
import { changeOrderTotalCents, jobInvoices, jobMoney, originalInvoice } from '@/lib/jobs'
import { formatCents } from '@/lib/money'
import { useSales } from '@/providers/SalesState'
import { CHANGE_ORDER_LINE_LABELS, ESTIMATE_STATUS_LABELS, ESTIMATE_TYPE_LABELS, INVOICE_STATUS_LABELS } from '@/types/sales'

export function JobDetail() {
  const { estimateId } = useParams()
  const navigate = useNavigate()
  const { estimates, invoices, customers, changeOrders, payments, updateEstimate, convertToInvoice } = useSales()
  const estimate = estimates.find((item) => item.id === estimateId)
  const customer = customers.find((item) => item.id === estimate?.customerId)

  if (!estimate) return <p className="text-muted">Job not found.</p>

  const details = documentCardDetails(estimate)
  const orders = changeOrders.filter((item) => item.estimateId === estimate.id)
  const issued = orders.filter((item) => item.invoiceId)
  const draft = orders.find((item) => !item.invoiceId) ?? null
  const money = jobMoney(estimate, invoices, changeOrders, payments)
  const original = originalInvoice(invoices, estimate)
  const relatedInvoices = jobInvoices(invoices, estimate.id)
  const relatedPayments = payments.filter((item) => relatedInvoices.some((invoice) => invoice.id === item.invoiceId))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Job</p>
          <h1 className="text-2xl font-semibold">
            {jobHeading(estimate.jobName, customer ? customerName(customer.firstName, customer.lastName) : estimate.number)}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-gold">
              {ESTIMATE_TYPE_LABELS[details.type]}
            </span>
            <span className="text-xs text-muted">{ESTIMATE_STATUS_LABELS[estimate.status]}</span>
            {issued.length ? (
              <span className="rounded-full bg-urgent/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-urgent">
                {issued.length} change order{issued.length === 1 ? '' : 's'}
              </span>
            ) : (
              <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                No change orders
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-muted">
            {estimate.number}
            {customer ? ` · ${customerName(customer.firstName, customer.lastName)}` : ''}
            {' · '}
            {estimate.projectAddress || customer?.address || 'No address'} · {estimate.projectCity || customer?.city}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate('/sales/change-orders')}>All jobs</Button>
          <Button onClick={() => navigate(`/sales/estimates/${estimate.id}`)}>Estimate</Button>
          {!original ? (
            <Button
              variant="primary"
              onClick={() => {
                const invoice = convertToInvoice(estimate.id)
                if (invoice) navigate(`/sales/invoices/${invoice.id}`)
              }}
            >
              Convert to invoice
            </Button>
          ) : null}
        </div>
      </div>

      <section className="rounded-3xl border border-line bg-surface p-5">
        <Field label="Job name">
          <Input
            value={estimate.jobName}
            onChange={(event) => updateEstimate(estimate.id, { jobName: event.target.value })}
            placeholder="Name this job so invoices and payments are easy to spot"
          />
        </Field>
      </section>

      <div className="grid gap-3 md:grid-cols-5">
        <Metric label="Original" value={formatCents(money.originalCents)} />
        <Metric label="Change orders" value={formatCents(money.changeCents)} emphasis={Boolean(money.changeCents)} />
        <Metric label="Job total" value={formatCents(money.jobTotalCents)} />
        <Metric label="Paid" value={formatCents(money.paidCents)} />
        <Metric label="Balance" value={formatCents(money.balanceCents)} />
      </div>

      <section className="rounded-3xl border border-line bg-surface p-5">
        <h2 className="font-semibold">Job documents</h2>
        <div className="mt-3 space-y-2">
          <Link to={`/sales/estimates/${estimate.id}`} className="flex justify-between rounded-2xl bg-bg-soft px-4 py-3 text-sm hover:border-gold/30">
            <span>Estimate {estimate.number}</span>
            <span>{formatCents(calculateFromFields(estimate).totalCents)}</span>
          </Link>
          {original ? (
            <Link to={`/sales/invoices/${original.id}`} className="flex justify-between rounded-2xl bg-bg-soft px-4 py-3 text-sm">
              <span>Original invoice {original.number}</span>
              <span>
                {INVOICE_STATUS_LABELS[original.status]} · {formatCents(calculateFromFields(original).totalCents)}
              </span>
            </Link>
          ) : (
            <p className="text-sm text-muted">No original invoice yet. Convert the estimate when the client accepts.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-urgent/30 bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">Change orders</h2>
            {issued.length ? (
              <span className="rounded-full bg-urgent/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-urgent">
                This job has change orders
              </span>
            ) : null}
          </div>
          {details.rooms.length ? <p className="text-sm text-muted">Accepted rooms: {details.rooms.join(', ')}</p> : null}
        </div>
        {issued.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No issued change orders. Extra rooms, materials, or flat-rate work will show here and create a new invoice.</p>
        ) : (
          <div className="mt-3 space-y-3">
            {issued.map((order) => {
              const invoice = invoices.find((item) => item.id === order.invoiceId)
              return (
                <div key={order.id} className="rounded-2xl border border-urgent/20 bg-bg-soft p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-urgent">{order.number} issued</p>
                      <p className="font-semibold">{order.title}</p>
                      {order.notes ? <p className="mt-1 text-sm text-muted">{order.notes}</p> : null}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCents(changeOrderTotalCents(order))}</p>
                      {invoice ? (
                        <Button size="sm" className="mt-2" onClick={() => navigate(`/sales/invoices/${invoice.id}`)}>
                          {invoice.number}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {order.lines.map((line) => (
                      <div key={line.id} className="flex justify-between text-sm">
                        <span>
                          {line.label}
                          <span className="ml-2 text-muted">{CHANGE_ORDER_LINE_LABELS[line.kind]}</span>
                        </span>
                        <span>{formatCents(line.amountCents)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <ChangeOrderComposer estimate={estimate} draft={draft} />

      <section className="rounded-3xl border border-line bg-surface p-5">
        <h2 className="font-semibold">Payments on this job</h2>
        <div className="mt-3 space-y-2">
          {relatedPayments.map((item) => {
            const invoice = relatedInvoices.find((invoice) => invoice.id === item.invoiceId)
            return (
              <Link
                key={item.id}
                to={`/sales/invoices/${item.invoiceId}`}
                className="flex justify-between rounded-2xl bg-bg-soft px-4 py-3 text-sm"
              >
                <span>
                  {item.label}
                  {invoice?.kind === 'change_order' ? ' · Change order' : ''}
                  {invoice ? ` · ${invoice.number}` : ''}
                </span>
                <span>
                  {formatCents(item.amountPaidCents)} / {formatCents(item.amountDueCents)}
                </span>
              </Link>
            )
          })}
          {relatedPayments.length === 0 ? <p className="text-sm text-muted">No payments on this job yet.</p> : null}
        </div>
      </section>
    </div>
  )
}

function Metric({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${emphasis ? 'border-urgent/30 bg-urgent/5' : 'border-line bg-surface'}`}>
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${emphasis ? 'text-urgent' : ''}`}>{value}</p>
    </div>
  )
}
