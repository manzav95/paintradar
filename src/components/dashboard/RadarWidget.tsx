import { useAppState } from '@/providers/AppState'

function pinColor(urgency: string) {
  if (urgency === 'urgent') return '#ef6a45'
  if (urgency === 'hot') return '#e8b44a'
  if (urgency === 'new') return '#4d9fff'
  return '#7c776c'
}

export function RadarWidget() {
  const { visibleLeads, radius, setSelectedLeadId } = useAppState()

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Local Lead Radar</h3>
          <p className="text-xs text-muted">Concentric rings at 10, 25, and 50 miles</p>
        </div>
        <span className="text-xs text-gold">{radius} mi view</span>
      </div>
      <div className="relative mx-auto aspect-square max-w-[360px]">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(232,180,74,0.08),transparent_68%)]" />
        {[1, 0.68, 0.4].map((scale, index) => (
          <div
            key={scale}
            className="absolute rounded-full border border-gold/20"
            style={{ inset: `${(1 - scale) * 50}%` }}
          >
            <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] text-faint">
              {['50 mi', '25 mi', '10 mi'][index]}
            </span>
          </div>
        ))}
        <div className="absolute inset-0 animate-[scan-sweep_8s_linear_infinite] rounded-full">
          <div className="absolute top-1/2 left-1/2 h-1/2 w-px origin-top bg-gradient-to-b from-gold/70 to-transparent -translate-x-1/2 -translate-y-full" />
        </div>
        <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold shadow-[0_0_16px_rgba(232,180,74,0.8)]" />
        {visibleLeads.slice(0, 16).map((lead, index) => {
          const angle = (index * 47 + lead.score) % 360
          const dist = Math.min(0.46, 0.12 + (lead.distanceMiles / 50) * 0.32)
          const x = 50 + Math.cos((angle * Math.PI) / 180) * dist * 100
          const y = 50 + Math.sin((angle * Math.PI) / 180) * dist * 100
          return (
            <button
              key={lead.id}
              onClick={() => setSelectedLeadId(lead.id)}
              className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${x}%`, top: `${y}%`, background: pinColor(lead.urgency) }}
              title={`${lead.customerName} · ${lead.city}`}
            >
              <span
                className="absolute inset-0 rounded-full"
                style={{ animation: 'radar-ping 2.2s infinite', background: pinColor(lead.urgency) }}
              />
            </button>
          )
        })}
      </div>
    </section>
  )
}
