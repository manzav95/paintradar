import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CabinetPresentation } from '@/components/sales/CabinetBuilder'
import { ExteriorPresentation } from '@/components/sales/ExteriorBuilder'
import { MoneyInput } from '@/components/sales/MoneyFields'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Input'
import { addonPricing, bundledAddonLabel, bundledRoomLabel, calculateFromFields, colorPaintLines, customerName, hasEstimateColors, jobHeading, paintMaterialLine, roomPricing } from '@/lib/estimateEngine'
import { formatCents } from '@/lib/money'
import { useSales } from '@/providers/SalesState'
import { INVOICE_STATUS_LABELS, PAYMENT_KIND_LABELS, PAYMENT_KINDS, type PaymentKind } from '@/types/sales'

function remainingForKind(rows: { invoiceId: string; kind: PaymentKind; amountDueCents: number; amountPaidCents: number }[], invoiceId: string, kind: PaymentKind) {
  const open = rows.find((item) => item.invoiceId === invoiceId && item.kind === kind && item.amountPaidCents < item.amountDueCents)
  if (open) return Math.max(0, open.amountDueCents - open.amountPaidCents)
  const any = rows.find((item) => item.invoiceId === invoiceId && item.kind === kind)
  return any ? Math.max(0, any.amountDueCents - any.amountPaidCents) : 0
}

export function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { invoices, customers, estimates, changeOrders, payments, recordPayment, deletePayment, deleteInvoice } = useSales()
  const invoice = invoices.find((item) => item.id === id)
  const customer = customers.find((item) => item.id === invoice?.customerId)
  const estimate = estimates.find((item) => item.id === invoice?.estimateId)
  const totals = useMemo(() => (invoice ? calculateFromFields(invoice) : null), [invoice])
  const [amountCents, setAmountCents] = useState(0)
  const [method, setMethod] = useState('Card')
  const [kind, setKind] = useState<PaymentKind>(invoice?.kind === 'change_order' ? 'custom' : 'booking')

  useEffect(() => {
    if (!invoice) return
    if (invoice.kind === 'change_order') setKind('custom')
    if (kind === 'custom') return
    setAmountCents(remainingForKind(payments, invoice.id, kind))
  }, [invoice?.id, invoice?.kind, kind, payments])

  if (!invoice || !totals) return <p className="text-muted">Invoice not found.</p>

  const related = payments.filter((item) => item.invoiceId === invoice.id)
  const paid = related.reduce((sum, item) => sum + item.amountPaidCents, 0)
  const balance = Math.max(0, totals.totalCents - paid)
  const colorSource = hasEstimateColors(invoice.colors, estimate?.type) ? invoice.colors : estimate?.colors ?? invoice.colors
  const colorLines = colorPaintLines(colorSource, estimate?.type, totals)
  const paintLine = paintMaterialLine(totals)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">{invoice.number}</p>
          <h1 className="text-2xl font-semibold">
            {jobHeading(invoice.jobName || estimate?.jobName, customer ? customerName(customer.firstName, customer.lastName) : 'Invoice')}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {invoice.kind === 'change_order' ? (
              <span className="rounded-full bg-urgent/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-urgent">
                Change order
              </span>
            ) : changeOrders.some((item) => item.estimateId === invoice.estimateId) ? (
              <span className="rounded-full bg-urgent/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-urgent">
                Has change orders
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted">
            {customer ? customerName(customer.firstName, customer.lastName) : 'Client'}
            {invoice.jobName || estimate?.jobName ? ` · ${invoice.number}` : ''}
          </p>
          <p className="text-sm text-muted">{invoice.projectAddress}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate(`/sales/jobs/${invoice.estimateId}`)}>Job</Button>
          <Button onClick={() => window.open(`/sales/estimates/${invoice.id}/print`, '_blank')}>Print / PDF</Button>
          <Button
            variant="danger"
            onClick={() => {
              if (window.confirm(`Delete invoice ${invoice.number}? This cannot be undone.`)) {
                deleteInvoice(invoice.id)
                navigate('/sales/invoices')
              }
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Invoice Total" value={formatCents(totals.totalCents)} />
        <Metric label="Amount Paid" value={formatCents(paid)} />
        <Metric label="Balance Due" value={formatCents(balance)} />
      </div>
      <p className="text-sm text-muted">{INVOICE_STATUS_LABELS[invoice.status]}</p>

      {invoice.kind === 'change_order' ? null : colorLines.length ? (
        <section className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Selected Colors</h2>
          <div className="mt-2 space-y-1 text-sm text-muted">
            {colorLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </section>
      ) : null}

      {invoice.kind === 'change_order' && invoice.lineItems.length ? (
        <section className="rounded-3xl border border-urgent/30 bg-surface p-5">
          <h2 className="font-semibold">Change Order Scope</h2>
          <div className="mt-3 space-y-2">
            {invoice.lineItems.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium">{item.label}</p>
                  {item.detail ? <p className="text-muted">{item.detail}</p> : null}
                </div>
                <p>{formatCents(item.amountCents)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {invoice.kind !== 'change_order' && invoices.some((item) => item.estimateId === invoice.estimateId && item.kind === 'change_order') ? (
        <section className="rounded-3xl border border-urgent/30 bg-surface p-5">
          <h2 className="font-semibold">Change Orders on this job</h2>
          <div className="mt-3 space-y-2">
            {invoices
              .filter((item) => item.estimateId === invoice.estimateId && item.kind === 'change_order')
              .map((item) => (
                <button
                  key={item.id}
                  className="flex w-full items-center justify-between rounded-2xl bg-bg-soft px-4 py-3 text-left text-sm"
                  onClick={() => navigate(`/sales/invoices/${item.id}`)}
                >
                  <span>{item.number}{item.jobName ? ` · ${item.jobName}` : ''}</span>
                  <span>{formatCents(calculateFromFields(item).totalCents)}</span>
                </button>
              ))}
          </div>
        </section>
      ) : null}

      {invoice.kind === 'change_order' && !invoice.rooms.length && !invoice.exterior && !invoice.cabinets && !(invoice.addons ?? []).length ? null : (
      <section className="rounded-3xl border border-line bg-surface p-5">
        <h2 className="font-semibold">Accepted Scope</h2>
        {invoice.exterior ? <ExteriorPresentation value={invoice.exterior} rates={invoice.rates} /> : null}
        {invoice.cabinets ? <CabinetPresentation value={invoice.cabinets} rates={invoice.rates} /> : null}
        {(invoice.addons ?? [])
          .filter((addon) => addon.status === 'included')
          .map((addon) => (
            <div key={addon.id} className="mt-3 flex justify-between border-t border-line pt-3 first:border-0 first:pt-0">
              <div>
                <p className="font-medium">{addon.label}</p>
                <p className="text-sm text-muted">{bundledAddonLabel(addon)}</p>
              </div>
              <p>{formatCents(addonPricing(addon, invoice.rates))}</p>
            </div>
          ))}
        {invoice.rooms
          .filter((room) => room.status === 'included')
          .map((room) => (
            <div key={room.id} className="mt-3 flex justify-between border-t border-line pt-3 first:border-0 first:pt-0">
              <div>
                <p className="font-medium">{room.label}</p>
                <p className="text-sm text-muted">{bundledRoomLabel(room)}</p>
              </div>
              <p>{formatCents(roomPricing(room, invoice.rates).totalCents)}</p>
            </div>
          ))}
        {paintLine ? (
          <div className="mt-3 flex justify-between border-t border-line pt-3">
            <div>
              <p className="font-medium">{paintLine.label}</p>
              <p className="text-sm text-muted">{paintLine.detail}</p>
            </div>
            <p>{formatCents(paintLine.cents)}</p>
          </div>
        ) : null}
        {totals.prepMaterialCents ? (
          <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm">
            <span>Prep & Protection Materials</span>
            <span>{formatCents(totals.prepMaterialCents)}</span>
          </div>
        ) : null}
        {totals.discountCents ? (
          <p className="mt-3 text-sm text-success">
            {invoice.discount.label || 'Discount'} -{formatCents(totals.discountCents)}
          </p>
        ) : null}
      </section>
      )}

      <section className="rounded-3xl border border-line bg-surface p-5">
        <h2 className="font-semibold">Payments</h2>
        <div className="mt-3 space-y-2">
          {related.map((item) => {
            const closed = item.amountDueCents > 0 && item.amountPaidCents >= item.amountDueCents
            return (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-bg-soft px-4 py-3 text-sm">
                <div>
                  <p>
                    {item.label} · {item.method || 'Scheduled'}
                    {closed ? <span className="ml-2 text-xs font-semibold text-success">Paid</span> : null}
                  </p>
                  <p className="text-muted">
                    Due {formatCents(item.amountDueCents)} · Paid {formatCents(item.amountPaidCents)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(`Remove ${item.label}?`)) deletePayment(item.id)
                  }}
                >
                  Delete
                </Button>
              </div>
            )
          })}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Field label="Kind">
            <Select
              value={kind}
              onChange={(event) => {
                const next = event.target.value as PaymentKind
                setKind(next)
                if (next !== 'custom') setAmountCents(remainingForKind(related, invoice.id, next))
              }}
            >
              {PAYMENT_KINDS.map((item) => (
                <option key={item} value={item}>
                  {PAYMENT_KIND_LABELS[item]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Amount">
            <MoneyInput valueCents={amountCents} onValueCents={setAmountCents} />
          </Field>
          <Field label="Method">
            <Input value={method} onChange={(event) => setMethod(event.target.value)} placeholder="Venmo, Card, Check..." />
          </Field>
          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={() => {
                if (!amountCents) return
                recordPayment({
                  invoiceId: invoice.id,
                  kind,
                  label: kind === 'booking' ? 'Booking Deposit' : kind === 'progress' ? 'Progress Payment' : kind === 'final' ? 'Final Payment' : 'Custom Payment',
                  amountDueCents: amountCents,
                  amountPaidCents: amountCents,
                  dueDate: new Date().toISOString().slice(0, 10),
                  paidAt: new Date().toISOString(),
                  method,
                  notes: '',
                })
              }}
            >
              Record Payment
            </Button>
          </div>
        </div>
        {kind !== 'custom' ? (
          <p className="mt-2 text-sm text-muted">
            {PAYMENT_KIND_LABELS[kind]} remaining {formatCents(remainingForKind(related, invoice.id, kind))}. Recording this marks the scheduled line paid.
          </p>
        ) : null}
      </section>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
