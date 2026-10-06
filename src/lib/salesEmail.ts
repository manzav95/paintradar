import { colorPaintLines, customerName } from '@/lib/estimateEngine'
import { formatCents } from '@/lib/money'
import type { Customer, Estimate, EstimateTotals } from '@/types/sales'

export function prepareEstimateEmail(estimate: Estimate, customer: Customer | undefined, totals: EstimateTotals) {
  const name = customer ? customerName(customer.firstName, customer.lastName) : 'there'
  const subject = `${estimate.jobName ? `${estimate.jobName} · ` : ''}${estimate.number} · Painting ${estimate.type} estimate`
  const colors = colorPaintLines(estimate.colors, estimate.type, totals)
  const body = [
    `Hi ${name.split(' ')[0] || 'there'},`,
    '',
    `Thank you for walking the property with us. Your estimate ${estimate.number}${estimate.jobName ? ` (${estimate.jobName})` : ''} is ready.`,
    '',
    `Project: ${estimate.jobName ? `${estimate.jobName} · ` : ''}${estimate.projectAddress}, ${estimate.projectCity}`,
    `Total: ${formatCents(totals.totalCents)}`,
    ...(colors.length ? ['', ...colors] : []),
    '',
    'A signed PDF copy is attached when email delivery is connected. For now you can reply to this message or print the estimate from PaintLedger.',
    '',
    'Bayline Painting',
  ].join('\n')

  return {
    to: customer?.email ?? '',
    subject,
    body,
    mailto: `mailto:${encodeURIComponent(customer?.email ?? '')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    sms: `sms:${customer?.phone ?? ''}?&body=${encodeURIComponent(`${subject} — ${formatCents(totals.totalCents)}`)}`,
  }
}
