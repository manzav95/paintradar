import { cn } from '@/lib/cn'
import { URGENCY_LABELS, type Urgency } from '@/types'

const styles: Record<Urgency, string> = {
  hot: 'bg-hot/15 text-hot border-hot/25 shadow-[0_0_16px_rgba(240,160,60,0.12)]',
  urgent: 'bg-urgent/15 text-urgent border-urgent/25',
  new: 'bg-info/12 text-info border-info/25',
  normal: 'bg-white/6 text-muted border-white/10',
}

export function UrgencyBadge({ urgency, className }: { urgency: Urgency; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-[0.14em]',
        styles[urgency],
        className,
      )}
    >
      {URGENCY_LABELS[urgency]}
    </span>
  )
}
