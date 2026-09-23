import { EAST_BAY_CITIES } from '@/data/cities'
import { categoryLabel, formatMiles } from '@/lib/format'
import { useAppState } from '@/providers/AppState'
import type { Lead } from '@/types'

function pinColor(lead: Lead) {
  if (lead.urgency === 'urgent') return '#ef6a45'
  if (lead.urgency === 'hot') return '#e8b44a'
  if (lead.urgency === 'new') return '#4d9fff'
  return '#8a8578'
}

const bounds = {
  minLat: 37.64,
  maxLat: 38.08,
  minLng: -122.2,
  maxLng: -121.38,
}

function project(lat: number, lng: number) {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100
  return { x, y }
}

export function MapPreview({ previewLead }: { previewLead?: Lead | null }) {
  const { visibleLeads, setSelectedLeadId, selectedLead } = useAppState()
  const active = previewLead ?? selectedLead

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-line bg-[#0d1218]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(232,180,74,0.08),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent)]" />
        <svg className="absolute inset-0 h-full w-full opacity-30">
          {Array.from({ length: 12 }).map((_, index) => (
            <line key={`h-${index}`} x1="0" x2="100%" y1={`${index * 9}%`} y2={`${index * 9}%`} stroke="rgba(255,255,255,0.08)" />
          ))}
          {Array.from({ length: 12 }).map((_, index) => (
            <line key={`v-${index}`} y1="0" y2="100%" x1={`${index * 9}%`} x2={`${index * 9}%`} stroke="rgba(255,255,255,0.08)" />
          ))}
        </svg>
        {EAST_BAY_CITIES.map((city) => {
          const point = project(city.latitude, city.longitude)
          return (
            <div
              key={city.name}
              className="absolute text-[10px] text-faint"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              {city.name}
            </div>
          )
        })}
        {visibleLeads.map((lead) => {
          const point = project(lead.latitude, lead.longitude)
          return (
            <button
              key={lead.id}
              onClick={() => setSelectedLeadId(lead.id)}
              className="absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 ring-black/20"
              style={{ left: `${point.x}%`, top: `${point.y}%`, background: pinColor(lead) }}
              title={lead.customerName}
            />
          )
        })}
        <div className="absolute bottom-4 left-4 rounded-xl border border-line bg-black/40 px-3 py-2 text-[11px] text-muted backdrop-blur">
          Placeholder map · ready for Mapbox or Google Maps
        </div>
      </div>
      <aside className="rounded-3xl border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold">Lead preview</h3>
        {active ? (
          <div className="mt-4 space-y-2 text-sm">
            <p className="text-lg font-semibold">{active.customerName}</p>
            <p className="text-muted">
              {active.city} · {formatMiles(active.distanceMiles)}
            </p>
            <p>{categoryLabel(active.category)}</p>
            <p className="text-muted">{active.description}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Select a pin to inspect a nearby homeowner request.</p>
        )}
      </aside>
    </div>
  )
}
