import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Select } from '@/components/ui/Input'
import { MoneyInput } from '@/components/sales/MoneyFields'
import { QUOTE_ACCESS, QUOTE_COLOR_CHANGES, QUOTE_CONDITIONS, QUOTE_HARDWARE, QUOTE_SCOPES } from '@/data/materials'
import { cabinetLabel, cabinetPricing } from '@/lib/estimateEngine'
import { formatCents } from '@/lib/money'
import type { CabinetScope, PricingSnapshot } from '@/types/sales'

export function CabinetBuilder({
  value,
  rates,
  large,
  onChange,
}: {
  value: CabinetScope
  rates: PricingSnapshot
  large?: boolean
  onChange: (next: CabinetScope) => void
}) {
  const priced = cabinetPricing(value, rates)
  const stepper = (key: 'doorQty' | 'drawerQty', label: string) => (
    <div className="space-y-1.5">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</span>
      <div className="flex items-center gap-2">
        <Button type="button" size="sm" onClick={() => onChange({ ...value, [key]: Math.max(0, value[key] - 1) })}>
          <Minus className="h-4 w-4" />
        </Button>
        <span className="min-w-10 text-center text-lg font-semibold">{value[key]}</span>
        <Button type="button" size="sm" onClick={() => onChange({ ...value, [key]: value[key] + 1 })}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <section className="space-y-4">
      <div className="rounded-3xl border border-line bg-surface p-5">
        <h2 className="font-semibold">Cabinet Scope</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="What are we painting?">
            <Select value={value.scope} onChange={(event) => onChange({ ...value, scope: event.target.value })} className={large ? 'h-14 text-lg' : ''}>
              {QUOTE_SCOPES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Condition">
            <Select value={value.condition} onChange={(event) => onChange({ ...value, condition: event.target.value })} className={large ? 'h-14 text-lg' : ''}>
              {QUOTE_CONDITIONS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Color Change">
            <Select value={value.colorChange} onChange={(event) => onChange({ ...value, colorChange: event.target.value })} className={large ? 'h-14 text-lg' : ''}>
              {QUOTE_COLOR_CHANGES.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Hardware">
            <Select value={value.hardware} onChange={(event) => onChange({ ...value, hardware: event.target.value })} className={large ? 'h-14 text-lg' : ''}>
              {QUOTE_HARDWARE.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
          <Field label="Access">
            <Select value={value.access} onChange={(event) => onChange({ ...value, access: event.target.value })} className={large ? 'h-14 text-lg' : ''}>
              {QUOTE_ACCESS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-surface p-5">
        <h2 className="font-semibold">Count & Price</h2>
        <div className="mt-4 flex flex-wrap items-end gap-5">
          {stepper('doorQty', 'Doors')}
          {stepper('drawerQty', 'Drawers')}
          <Field label="Price / Door">
            <MoneyInput valueCents={value.doorPriceCents} onValueCents={(doorPriceCents) => onChange({ ...value, doorPriceCents })} />
          </Field>
          <Field label="Price / Drawer">
            <MoneyInput valueCents={value.drawerPriceCents} onValueCents={(drawerPriceCents) => onChange({ ...value, drawerPriceCents })} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...value, boxes: !value.boxes })}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${value.boxes ? 'bg-gold text-[#1a1406]' : 'border border-line text-muted'}`}
          >
            Paint Boxes
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...value, island: !value.island })}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${value.island ? 'bg-gold text-[#1a1406]' : 'border border-line text-muted'}`}
          >
            Island
          </button>
        </div>
        <p className="mt-4 text-sm text-muted">{cabinetLabel(value)}</p>
        <p className="mt-1 font-semibold">{formatCents(priced.laborCents)}</p>
      </div>
    </section>
  )
}

export function CabinetPresentation({ value, rates }: { value: CabinetScope; rates: PricingSnapshot }) {
  const priced = cabinetPricing(value, rates)
  return (
    <>
      {priced.lines.map((line) => (
        <div key={line.label} className="mt-3 border-t border-line pt-3 first:border-0 first:pt-0">
          <div className="flex justify-between gap-3">
            <p className="font-medium">{line.label}</p>
            <p>
              {formatCents(line.cents)}
              {line.includesMaterial ? <span className="ml-2 text-sm font-normal text-muted">includes material</span> : null}
            </p>
          </div>
          {line.detail ? <p className="text-sm text-muted">{line.detail}</p> : null}
          {line.note ? <p className="mt-1 text-sm text-muted">{line.note}</p> : null}
        </div>
      ))}
    </>
  )
}
