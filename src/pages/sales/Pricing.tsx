import type { ReactNode } from 'react'
import { MarkupCompare, MoneyInput, PercentInput } from '@/components/sales/MoneyFields'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { useSales } from '@/providers/SalesState'
import { DOCUMENT_TERMS, REPAIR_LEVELS, type PricingSnapshot } from '@/types/sales'

export function Pricing() {
  const { pricing, updatePricing, business, updateBusiness } = useSales()

  const money = (key: keyof PricingSnapshot, label: string) => (
    <Field label={label}>
      <MoneyInput
        valueCents={Number(pricing[key])}
        onValueCents={(cents) => updatePricing({ [key]: cents } as Partial<PricingSnapshot>)}
      />
    </Field>
  )

  const number = (key: keyof PricingSnapshot, label: string) => (
    <Field label={label}>
      <Input
        type="number"
        value={Number(pricing[key])}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => updatePricing({ [key]: Number(event.target.value) || 0 } as Partial<PricingSnapshot>)}
      />
    </Field>
  )

  const percent = (key: keyof PricingSnapshot, label: string) => (
    <Field label={label}>
      <PercentInput
        value={Number(pricing[key])}
        onValue={(value) => updatePricing({ [key]: value } as Partial<PricingSnapshot>)}
      />
    </Field>
  )

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">PaintLedger</p>
        <h1 className="text-2xl font-semibold">Pricing</h1>
        <p className="text-sm text-muted">Changes apply to new estimates only. Existing estimates keep their snapshot rates.</p>
      </div>

      <Group title="Interior">
        <Field label="Pricing Mode">
          <Select value={pricing.pricingMode} onChange={(event) => updatePricing({ pricingMode: event.target.value as PricingSnapshot['pricingMode'] })}>
            <option value="combined">Combined Surface Rate</option>
            <option value="separate">Separate Wall and Ceiling Rates</option>
          </Select>
        </Field>
        {money('combinedRateCents', 'Combined Surface Rate / SF')}
        {money('wallRateCents', 'Wall Rate / SF')}
        {money('ceilingRateCents', 'Ceiling Rate / SF')}
        {money('trimLfCents', 'Standard Trim Rate / LF')}
        {money('crownLfCents', 'Crown Molding Rate / LF')}
      </Group>

      <Group title="Drywall & Texture">
        {REPAIR_LEVELS.map((level) => (
          <Field key={level} label={`Level ${level}`}>
            <MoneyInput
              valueCents={pricing.repairLevelCents?.[level - 1] ?? 0}
              onValueCents={(cents) => {
                const next: PricingSnapshot['repairLevelCents'] = [
                  pricing.repairLevelCents?.[0] ?? 5000,
                  pricing.repairLevelCents?.[1] ?? 7500,
                  pricing.repairLevelCents?.[2] ?? 10000,
                  pricing.repairLevelCents?.[3] ?? 12500,
                  pricing.repairLevelCents?.[4] ?? 15000,
                ]
                next[level - 1] = cents
                updatePricing({ repairLevelCents: next })
              }}
            />
          </Field>
        ))}
      </Group>

      <Group title="Add-ons">
        {money('stairFlightCents', 'Staircase / Flight')}
        {money('stairRiserCents', 'Painted Riser')}
        {money('handrailLfCents', 'Handrail / LF')}
        {money('closetBuiltInCents', 'Closet with Built-Ins')}
      </Group>

      <Group title="Exterior">
        {money('exteriorBodyCents', 'Body / Siding / SF')}
        {money('exteriorTrimCents', 'Exterior Trim / LF')}
        {money('exteriorFasciaCents', 'Fascia / LF')}
        {money('exteriorSoffitCents', 'Soffit / SF')}
        {money('exteriorGarageDoorCents', 'Garage Door')}
        {money('exteriorEntryDoorCents', 'Exterior Door')}
        {money('exteriorFenceCents', 'Fence / SF')}
        {money('exteriorDeckCents', 'Deck / SF')}
        {percent('storyTwoPercent', '2-Story Uplift')}
        {percent('storyThreePercent', '3-Story Uplift')}
      </Group>

      <Group title="Cabinets">
        {money('cabinetDoorCents', 'Cabinet Door')}
        {money('cabinetDrawerCents', 'Drawer')}
        {money('cabinetBoxCents', 'Box / Door')}
        {money('cabinetIslandCents', 'Island')}
      </Group>

      <Group title="Doors">
        {money('interiorDoorCents', 'Interior Door')}
        {money('bifoldDoorCents', 'Bifold / Shutter')}
        {money('exteriorDoorCents', 'Exterior Door')}
      </Group>

      <Group title="Colors">
        {number('includedColors', 'Included Colors')}
        {money('extraColorCents', 'Additional Color Fee')}
      </Group>

      <Group title="Materials">
        {number('wallCoverage', 'Wall Coverage SF / gal / coat')}
        {number('ceilingCoverage', 'Ceiling Coverage')}
        {number('trimCoverage', 'Trim Coverage')}
        {percent('wasteFactor', 'Waste Factor')}
        {money('paintCostCents', 'Paint Cost / gal')}
        {percent('paintMarkup', 'Paint Markup')}
        <div className="md:col-span-2">
          <MarkupCompare costCents={pricing.paintCostCents} markupPercent={pricing.paintMarkup} />
        </div>
      </Group>

      <Group title="Consumables">
        {money('consumableMinCents', 'Minimum Prep Charge')}
        {money('consumablePerSqFtCents', 'Project Size Rate / SF')}
      </Group>

      <Group title="Business">
        {money('minimumJobCents', 'Minimum Job')}
        {percent('depositPercent', 'Booking Deposit')}
        {percent('progressPercent', 'Progress Payment')}
        {percent('finalPercent', 'Completion')}
        <Field label="Document Term">
          <Select value={business.documentTerm} onChange={(event) => updateBusiness({ documentTerm: event.target.value as typeof business.documentTerm })}>
            {DOCUMENT_TERMS.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Company Name">
          <Input value={business.companyName} onChange={(event) => updateBusiness({ companyName: event.target.value })} />
        </Field>
        <Field label="Terms" className="md:col-span-2">
          <Textarea value={business.terms} onChange={(event) => updateBusiness({ terms: event.target.value })} />
        </Field>
      </Group>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="mb-4 font-semibold">{title}</h2>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  )
}
