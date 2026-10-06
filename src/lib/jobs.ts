import { calculateFromFields } from '@/lib/estimateEngine'
import type { ChangeOrder, Estimate, Invoice, PaymentRecord } from '@/types/sales'

export function isActiveJob(status: Estimate['status'], hasInvoice: boolean) {
  return hasInvoice || status === 'accepted' || status === 'converted' || status === 'sent' || status === 'viewed'
}

export function changeOrderTotalCents(order: Pick<ChangeOrder, 'lines'>) {
  return order.lines.reduce((sum, line) => sum + line.amountCents, 0)
}

export function jobInvoices(invoices: Invoice[], estimateId: string) {
  return invoices.filter((item) => item.estimateId === estimateId)
}

export function jobChangeOrders(changeOrders: ChangeOrder[], estimateId: string) {
  return changeOrders.filter((item) => item.estimateId === estimateId)
}

export function originalInvoice(invoices: Invoice[], estimate: Estimate) {
  return invoices.find((item) => item.estimateId === estimate.id && item.kind !== 'change_order')
    ?? invoices.find((item) => item.id === estimate.invoiceId)
    ?? null
}

export function jobMoney(
  estimate: Estimate,
  invoices: Invoice[],
  changeOrders: ChangeOrder[],
  payments: PaymentRecord[],
) {
  const original = originalInvoice(invoices, estimate)
  const originalCents = calculateFromFields(original ?? estimate).totalCents
  const issued = jobChangeOrders(changeOrders, estimate.id).filter((item) => item.invoiceId)
  const changeCents = issued.reduce((sum, order) => sum + changeOrderTotalCents(order), 0)
  const related = jobInvoices(invoices, estimate.id)
  const paidCents = payments
    .filter((item) => related.some((invoice) => invoice.id === item.invoiceId))
    .reduce((sum, item) => sum + item.amountPaidCents, 0)
  const jobTotalCents = originalCents + changeCents
  return {
    originalCents,
    changeCents,
    jobTotalCents,
    paidCents,
    balanceCents: Math.max(0, jobTotalCents - paidCents),
    issuedCount: issued.length,
    draftCount: jobChangeOrders(changeOrders, estimate.id).filter((item) => !item.invoiceId).length,
  }
}
