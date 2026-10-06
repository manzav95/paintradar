import { AnimatePresence, motion } from 'framer-motion'
import { paintMaterialLine } from '@/lib/estimateEngine'
import { formatCents } from '@/lib/money'
import type { EstimateTotals } from '@/types/sales'

export function LiveTotalBar({ totals, compact }: { totals: EstimateTotals; compact?: boolean }) {
  const paint = paintMaterialLine(totals)
  const rows: [string, number][] = [['Labor', totals.laborCents]]
  if (paint) rows.push([`Paint Material · ${paint.detail}`, paint.cents])
  rows.push(['Prep Materials', totals.prepMaterialCents])
  if (totals.extrasCents) rows.push(['Extras', totals.extrasCents])
  if (totals.discountCents) rows.push(['Discounts', -totals.discountCents])

  return (
    <div className="rounded-3xl border border-gold/20 bg-[#14110a] p-5 shadow-card">
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Live Total</p>
      {!compact
        ? rows.map(([label, value]) => (
            <div key={label} className="mt-2 flex items-center justify-between text-sm text-muted">
              <span>{label}</span>
              <span className={value < 0 ? 'text-success' : 'text-ink'}>{formatCents(value)}</span>
            </div>
          ))
        : null}
      <AnimatePresence mode="wait">
        <motion.p
          key={totals.totalCents}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          className="mt-4 text-4xl font-semibold tracking-tight text-gold-soft"
        >
          {formatCents(totals.totalCents)}
        </motion.p>
      </AnimatePresence>
      <p className="mt-1 text-xs text-faint">Tax included</p>
    </div>
  )
}
