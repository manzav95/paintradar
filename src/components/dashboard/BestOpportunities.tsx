import { LeadScore } from '@/components/leads/LeadScore'
import { categoryLabel, formatMiles, formatValueRange } from '@/lib/format'
import { useAppState } from '@/providers/AppState'

export function BestOpportunities() {
  const { visibleLeads, setSelectedLeadId } = useAppState()
  const best = [...visibleLeads].sort((a, b) => b.score - a.score).slice(0, 6)

  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-ink">Best Opportunities Near You</h3>
      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2">
        {best.map((lead) => (
          <button
            key={lead.id}
            onClick={() => setSelectedLeadId(lead.id)}
            className="card-hover min-w-[240px] rounded-2xl border border-line bg-surface p-4 text-left"
          >
            <p className="text-xs uppercase tracking-[0.14em] text-gold">{categoryLabel(lead.category)}</p>
            <p className="mt-2 text-sm font-semibold text-ink">
              {lead.city} · {formatMiles(lead.distanceMiles)}
            </p>
            <p className="mt-1 text-xs text-muted">{formatValueRange(lead.estimatedValueLow, lead.estimatedValueHigh)}</p>
            <div className="mt-3">
              <LeadScore score={lead.score} size="sm" showLabel={false} />
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}
