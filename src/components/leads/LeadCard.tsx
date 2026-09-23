import { motion } from 'framer-motion'
import { Bookmark, Eye, MapPin, MessageSquare, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { LeadScore } from '@/components/leads/LeadScore'
import { cn } from '@/lib/cn'
import { categoryLabel, formatMiles, formatValueRange, timeAgo } from '@/lib/format'
import { SOURCE_LABELS, type Lead } from '@/types'

export function LeadCard({
  lead,
  highlighted,
  compact,
  onOpen,
  onSave,
  onDismiss,
  onContact,
}: {
  lead: Lead
  highlighted?: boolean
  compact?: boolean
  onOpen: () => void
  onSave: () => void
  onDismiss: () => void
  onContact: () => void
}) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'card-hover rounded-2xl border bg-surface p-5',
        highlighted ? 'border-gold/50 glow-gold' : 'border-line',
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-ink">{lead.customerName}</h3>
            <UrgencyBadge urgency={lead.urgency} />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="h-3.5 w-3.5" />
            {lead.city}, {lead.state}
            <span className="text-faint">•</span>
            {formatMiles(lead.distanceMiles)} away
          </p>
        </div>
        <LeadScore score={lead.score} size={compact ? 'sm' : 'md'} showLabel={!compact} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-muted">
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-gold">{categoryLabel(lead.category)}</span>
        <span className="rounded-full bg-white/5 px-2.5 py-1">{SOURCE_LABELS[lead.source]}</span>
        <span>Posted {timeAgo(lead.postedAt)}</span>
      </div>

      <p className="mt-3 text-sm leading-6 text-ink/85">{lead.description}</p>

      {lead.hasPhotos ? (
        <div className="mt-4 flex gap-2">
          {lead.photos.slice(0, 3).map((photo) => (
            <img
              key={photo.id}
              src={photo.imageUrl}
              alt=""
              className="h-16 w-20 rounded-xl object-cover ring-1 ring-white/10"
            />
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Estimated value</p>
          <p className="text-sm font-semibold text-ink">
            {formatValueRange(lead.estimatedValueLow, lead.estimatedValueHigh)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="primary" onClick={onOpen}>
            <Eye className="h-3.5 w-3.5" />
            View Lead
          </Button>
          <Button size="sm" variant={lead.saved ? 'gold' : 'secondary'} onClick={onSave}>
            <Bookmark className="h-3.5 w-3.5" />
            {lead.saved ? 'Saved' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onContact}>
            <MessageSquare className="h-3.5 w-3.5" />
            Contacted
          </Button>
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <X className="h-3.5 w-3.5" />
            Dismiss
          </Button>
          <Link to={`/leads/${lead.id}`} className="text-xs font-semibold text-muted hover:text-gold">
            Full page
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
