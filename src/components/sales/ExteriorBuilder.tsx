import { MeasureInput } from '@/components/sales/MeasureInput'
import type { ExteriorScope, ExteriorSurface, PricingSnapshot, ScopeStatus } from '@/types/sales'
import { formatCents } from '@/lib/money'
import { exteriorPricing } from '@/lib/estimateEngine'

const STORIES = [1, 2, 3] as const

export function ExteriorBuilder({
  value,
  rates,
  large,
  onChange,
}: {
  value: ExteriorScope
  rates: PricingSnapshot
  large?: boolean
  onChange: (next: ExteriorScope) => void
}) {
  const priced = exteriorPricing(value, rates)

  const patchSurface = (id: string, patch: Partial<ExteriorSurface>) => {
    onChange({
      ...value,
      surfaces: value.surfaces.map((surface) => (surface.id === id ? { ...surface, ...patch } : surface)),
    })
  }

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-line bg-surface p-5">
        <h2 className="font-semibold">Stories</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STORIES.map((stories) => (
            <button
              key={stories}
              type="button"
              onClick={() => onChange({ ...value, stories })}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${value.stories === stories ? 'bg-gold text-[#1a1406]' : 'border border-line text-muted'}`}
            >
              {stories}-Story
            </button>
          ))}
        </div>
        {value.stories > 1 ? (
          <p className="mt-3 text-sm text-muted">
            {value.stories === 2 ? rates.storyTwoPercent ?? 15 : rates.storyThreePercent ?? 25}% added for height on body, trim, fascia, soffit, and doors.
          </p>
        ) : null}
      </div>

      {value.surfaces.map((surface) => (
        <article
          key={surface.id}
          className={`rounded-3xl border bg-surface p-5 ${surface.enabled && surface.status !== 'excluded' ? 'border-line' : 'border-line/60 opacity-70'}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => patchSurface(surface.id, { enabled: !surface.enabled })}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${surface.enabled ? 'bg-gold text-[#1a1406]' : 'border border-line text-muted'}`}
            >
              {surface.label}
            </button>
            <div className="flex flex-wrap gap-2">
              {(['included', 'optional', 'excluded'] as ScopeStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => patchSurface(surface.id, { status })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${surface.status === status ? 'bg-gold text-[#1a1406]' : 'border border-line text-muted'}`}
                >
                  {status === 'excluded' ? 'Excluded From Scope' : status}
                </button>
              ))}
            </div>
          </div>
          {surface.enabled ? (
            <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
              <div className="w-40">
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {surface.unit === 'lf' ? 'Length' : surface.unit === 'qty' ? 'Quantity' : 'Area'}
                </p>
                <MeasureInput
                  value={surface.quantity}
                  onChange={(quantity) => patchSurface(surface.id, { quantity })}
                  large={large}
                  suffix={surface.unit === 'lf' ? 'lf' : surface.unit === 'qty' ? 'qty' : 'sf'}
                />
              </div>
              <p className="font-semibold">{formatCents(priced.lines.find((line) => line.id === surface.id)?.cents ?? 0)}</p>
            </div>
          ) : null}
        </article>
      ))}
    </section>
  )
}

export function ExteriorPresentation({ value, rates }: { value: ExteriorScope; rates: PricingSnapshot }) {
  const priced = exteriorPricing(value, rates)
  return (
    <>
      {priced.lines.map((line) => (
        <div key={line.id} className="mt-3 border-t border-line pt-3 first:border-0 first:pt-0">
          <div className="flex justify-between gap-3">
            <p className="font-medium">
              {line.label}
              {line.optional ? <span className="ml-2 text-xs text-gold">Optional</span> : null}
            </p>
            <p>{line.optional ? `+${formatCents(line.cents)}` : formatCents(line.cents)}</p>
          </div>
          <p className="text-sm text-muted">{line.detail}</p>
        </div>
      ))}
    </>
  )
}
