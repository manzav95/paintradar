import { useState } from 'react'
import { MarkupCompare, MoneyInput, PercentInput } from '@/components/sales/MoneyFields'
import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { uid } from '@/lib/format'
import { formatCents, formatPercent, markedUpCents } from '@/lib/money'
import { useSales } from '@/providers/SalesState'
import { PAINT_SHEENS, type CatalogMaterial } from '@/types/sales'

const EMPTY: CatalogMaterial = {
  id: '',
  manufacturer: 'Sherwin-Williams',
  productName: '',
  category: 'Wall Paint',
  finish: '',
  sheens: [],
  costPerGallonCents: 0,
  coverage: 375,
  markup: 40,
  active: true,
  notes: '',
}

function withSheens(item: CatalogMaterial): CatalogMaterial {
  return {
    ...item,
    sheens: item.sheens ?? [],
    finish: item.finish ?? '',
  }
}

export function SalesMaterials() {
  const { catalog, upsertCatalogItem, deleteCatalogItem } = useSales()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<CatalogMaterial>(EMPTY)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">PaintLedger</p>
          <h1 className="text-2xl font-semibold">Materials</h1>
          <p className="text-sm text-muted">Product costs stay editable. Nothing here is hard-coded into old estimates.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setDraft({ ...EMPTY, id: uid('matc') })
            setOpen(true)
          }}
        >
          Add Material
        </Button>
      </div>
      <div className="grid gap-3">
        {catalog.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setDraft(withSheens(item))
              setOpen(true)
            }}
            className="rounded-2xl border border-line bg-surface p-5 text-left hover:border-gold/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{item.productName}</p>
                <p className="text-sm text-muted">
                  {item.manufacturer} · {item.category}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {PAINT_SHEENS.filter((sheen) => (item.sheens ?? []).includes(sheen)).map((sheen) => (
                    <span key={sheen} className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold">
                      {sheen}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-right text-sm">
                <p className="text-muted">Cost {formatCents(item.costPerGallonCents)} / gal</p>
                <p className="font-semibold text-ink">
                  Sell {formatCents(markedUpCents(item.costPerGallonCents, item.markup))} / gal
                </p>
                <p className="text-gold">{formatPercent(item.markup)} markup</p>
              </div>
            </div>
          </button>
        ))}
      </div>
      <Modal open={open} title={draft.productName || 'Material'} onClose={() => setOpen(false)}>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Manufacturer">
            <Input value={draft.manufacturer} onChange={(event) => setDraft({ ...draft, manufacturer: event.target.value })} />
          </Field>
          <Field label="Product Name">
            <Input value={draft.productName} onChange={(event) => setDraft({ ...draft, productName: event.target.value })} />
          </Field>
          <Field label="Category">
            <Input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
          </Field>
          <div className="space-y-1.5 md:col-span-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Sheens</p>
            <div className="flex flex-wrap gap-2">
              {PAINT_SHEENS.map((sheen) => {
                const selected = draft.sheens.includes(sheen)
                return (
                  <button
                    key={sheen}
                    type="button"
                    onClick={() => {
                      const sheens = selected ? draft.sheens.filter((item) => item !== sheen) : [...draft.sheens, sheen]
                      setDraft({
                        ...draft,
                        sheens,
                        finish: sheens[0] ?? '',
                      })
                    }}
                    className={`rounded-full px-3 py-2 text-sm font-medium ${
                      selected ? 'bg-gold/15 text-gold' : 'border border-line text-muted'
                    }`}
                  >
                    {sheen}
                  </button>
                )
              })}
            </div>
          </div>
          <Field label="Cost / Gallon">
            <MoneyInput
              valueCents={draft.costPerGallonCents}
              onValueCents={(costPerGallonCents) => setDraft({ ...draft, costPerGallonCents })}
            />
          </Field>
          <Field label="Coverage">
            <Input type="number" value={draft.coverage} onChange={(event) => setDraft({ ...draft, coverage: Number(event.target.value) || 0 })} />
          </Field>
          <Field label="Markup" className="md:col-span-2">
            <PercentInput value={draft.markup} onValue={(markup) => setDraft({ ...draft, markup })} />
          </Field>
          <div className="md:col-span-2">
            <MarkupCompare costCents={draft.costPerGallonCents} markupPercent={draft.markup} />
          </div>
          <Field label="Notes" className="md:col-span-2">
            <Textarea value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
          </Field>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="primary"
            onClick={() => {
              upsertCatalogItem({ ...draft, active: true })
              setOpen(false)
            }}
          >
            Save
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              deleteCatalogItem(draft.id)
              setOpen(false)
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
