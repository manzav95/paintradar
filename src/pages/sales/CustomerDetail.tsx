import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { CustomerForm } from '@/components/sales/CustomerForm'
import { calculateFromFields, customerName, documentCardDetails, jobHeading } from '@/lib/estimateEngine'
import { formatCents } from '@/lib/money'
import { useSales } from '@/providers/SalesState'
import { ESTIMATE_STATUS_LABELS, ESTIMATE_TYPE_LABELS, INVOICE_STATUS_LABELS } from '@/types/sales'

export function CustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { customers, estimates, invoices, payments, changeOrders, upsertCustomer, createEstimate, deleteCustomer } = useSales()
  const customer = customers.find((item) => item.id === id)
  const [editing, setEditing] = useState(false)

  if (!customer) return <p className="text-muted">Customer not found.</p>

  const theirs = estimates.filter((item) => item.customerId === customer.id)
  const theirInvoices = invoices.filter((item) => item.customerId === customer.id)
  const theirPayments = payments.filter((item) => theirInvoices.some((invoice) => invoice.id === item.invoiceId))
  const signed = theirs.filter((item) => item.signature)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Customer</p>
          <h1 className="text-2xl font-semibold">{customerName(customer.firstName, customer.lastName)}</h1>
          <p className="text-sm text-muted">
            {customer.phone || 'No phone'} · {customer.email || 'No email'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setEditing((value) => !value)}>{editing ? 'Close' : 'Edit'}</Button>
          <Button
            variant="primary"
            onClick={() => {
              const estimate = createEstimate(customer.id, 'interior')
              navigate(`/sales/estimates/${estimate.id}`)
            }}
          >
            Start Estimate
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm(`Delete ${customerName(customer.firstName, customer.lastName)}? This cannot be undone.`)) {
                deleteCustomer(customer.id)
                navigate('/sales/customers')
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="rounded-3xl border border-line bg-surface p-5">
          <CustomerForm
            value={customer}
            onChange={(value) => upsertCustomer({ ...value, id: customer.id })}
            submitLabel="Save profile"
            onSubmit={() => setEditing(false)}
          />
        </div>
      ) : (
        <div className="rounded-3xl border border-line bg-surface p-5 text-sm text-muted">
          <p>{customer.address}</p>
          <p>
            {customer.city}, {customer.state} {customer.zip}
          </p>
          {customer.notes ? <p className="mt-3 text-ink">{customer.notes}</p> : null}
        </div>
      )}

      <Section title="Estimates">
        {theirs.map((item) => {
          const details = documentCardDetails(item)
          const orders = changeOrders.filter((order) => order.estimateId === item.id)
          return (
            <Link key={item.id} to={`/sales/jobs/${item.id}`} className="rounded-2xl border border-line px-4 py-3 hover:border-gold/30">
              <div className="flex justify-between gap-3">
                <span>{jobHeading(item.jobName, item.number)}</span>
                <span className="text-muted">{ESTIMATE_STATUS_LABELS[item.status]}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {item.jobName ? `${item.number} · ` : ''}
                {ESTIMATE_TYPE_LABELS[details.type]}
                {details.facts.length ? ` · ${details.facts.join(' · ')}` : ''}
                {orders.length ? ` · ${orders.length} change order${orders.length === 1 ? '' : 's'}` : ''}
              </p>
            </Link>
          )
        })}
        {theirs.length === 0 ? <p className="text-sm text-muted">No estimates yet.</p> : null}
      </Section>

      <Section title="Invoices">
        {theirInvoices.map((item) => {
          const estimate = theirs.find((row) => row.id === item.estimateId)
          const jobName = item.jobName || estimate?.jobName || ''
          return (
            <Link key={item.id} to={`/sales/invoices/${item.id}`} className="rounded-2xl border border-line px-4 py-3 hover:border-gold/30">
              <div className="flex justify-between gap-3">
                <span>{jobHeading(jobName, item.number)}</span>
                <span className="text-muted">{INVOICE_STATUS_LABELS[item.status]}</span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {jobName ? `${item.number} · ` : ''}
                {item.kind === 'change_order' ? 'Change order' : 'Invoice'}
              </p>
            </Link>
          )
        })}
        {theirInvoices.length === 0 ? <p className="text-sm text-muted">No invoices yet.</p> : null}
      </Section>

      <Section title="Payments">
        {theirPayments.map((item) => {
          const invoice = theirInvoices.find((row) => row.id === item.invoiceId)
          const estimate = theirs.find((row) => row.id === invoice?.estimateId)
          const jobName = invoice?.jobName || estimate?.jobName || ''
          return (
            <div key={item.id} className="flex justify-between rounded-2xl border border-line px-4 py-3">
              <div>
                <p>{jobHeading(jobName, item.label)}</p>
                {jobName ? <p className="text-sm text-muted">{item.label} · {invoice?.number}</p> : null}
              </div>
              <span>{formatCents(item.amountPaidCents || item.amountDueCents)}</span>
            </div>
          )
        })}
        {theirPayments.length === 0 ? <p className="text-sm text-muted">No payments yet.</p> : null}
      </Section>

      <Section title="Signed Documents">
        {signed.map((item) => (
          <Link key={item.id} to={`/sales/estimates/${item.id}/print`} className="flex justify-between rounded-2xl border border-line px-4 py-3 hover:border-gold/30">
            <span>{jobHeading(item.jobName, item.number)} signed PDF</span>
            <span className="text-muted">{formatCents(calculateFromFields(item).totalCents)}</span>
          </Link>
        ))}
        {signed.length === 0 ? <p className="text-sm text-muted">No signatures captured yet.</p> : null}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-muted">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
