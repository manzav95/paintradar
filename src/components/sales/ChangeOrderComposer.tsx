import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { MoneyInput } from '@/components/sales/MoneyFields'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { defaultRoomScope } from '@/data/pricingDefaults'
import { addonPricing, roomPricing } from '@/lib/estimateEngine'
import { changeOrderTotalCents } from '@/lib/jobs'
import { uid } from '@/lib/format'
import { formatCents, markedUpCents } from '@/lib/money'
import { useSales } from '@/providers/SalesState'
import {
  ADDON_KINDS,
  ADDON_LABELS,
  CHANGE_ORDER_LINE_LABELS,
  ROOM_PRESETS,
  type AddonKind,
  type ChangeOrder,
  type ChangeOrderLineKind,
  type Estimate,
  type EstimateAddon,
  type EstimateRoom,
  type RoomPreset,
} from '@/types/sales'

function draftRoom(preset: RoomPreset): EstimateRoom {
  return {
    id: uid('room'),
    label: preset,
    preset,
    lengthFt: 12,
    widthFt: 12,
    heightFt: 8,
    heightMode: 'preset',
    vaultedCeiling: false,
    peakHeightFt: null,
    vaultRidge: 'length',
    subtractOpenings: false,
    openingsSqFt: 0,
    scope: defaultRoomScope(),
    baseboardLf: null,
    doorCasingLf: 17,
    windowCasingLf: 0,
    crownLf: null,
    doors: [{ id: uid('door'), type: 'interior', quantity: 1, rateOverrideCents: null }],
    coatsWalls: 2,
    coatsCeiling: 2,
    coatsTrim: 2,
    drywallRepairLevel: null,
    textureLevel: null,
    colorOverride: '',
    status: 'included',
  }
}

function draftAddon(kind: AddonKind, quantity: number): EstimateAddon {
  return {
    id: uid('addon'),
    kind,
    label: ADDON_LABELS[kind],
    quantity,
    doorType: 'interior',
    paintRisers: false,
    riserQty: 0,
    handrailLf: 0,
    rateOverrideCents: null,
    status: 'included',
  }
}

export function ChangeOrderComposer({ estimate, draft }: { estimate: Estimate; draft: ChangeOrder | null }) {
  const {
    catalog,
    ensureOpenChangeOrder,
    addChangeOrderLine,
    updateChangeOrderLine,
    removeChangeOrderLine,
    updateChangeOrder,
    invoiceChangeOrder,
    deleteChangeOrder,
  } = useSales()
  const [kind, setKind] = useState<ChangeOrderLineKind>('flat')
  const [label, setLabel] = useState('')
  const [amountCents, setAmountCents] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [roomPreset, setRoomPreset] = useState<RoomPreset>('Bedroom')
  const [addonKind, setAddonKind] = useState<AddonKind>('extraDoors')
  const [materialId, setMaterialId] = useState(catalog[0]?.id ?? '')

  const qty = Math.max(1, quantity)
  const pricedRoom = roomPricing(draftRoom(roomPreset), estimate.rates).totalCents * qty
  const pricedAddon = addonPricing(draftAddon(addonKind, qty), estimate.rates)
  const material = catalog.find((item) => item.id === materialId)
  const materialCents = material ? markedUpCents(material.costPerGallonCents, material.markup) * qty : 0
  const suggestedAmount =
    kind === 'room' ? pricedRoom : kind === 'addon' ? pricedAddon : kind === 'material' ? materialCents : amountCents

  const addLine = () => {
    const open = draft ?? ensureOpenChangeOrder(estimate.id)
    if (!open) return
    if (kind === 'flat' && (!label.trim() || !amountCents)) return
    const line =
      kind === 'room'
        ? {
            kind,
            label: qty > 1 ? `${qty} × ${roomPreset} Painting` : `${roomPreset} Painting`,
            detail: 'Standard room added to accepted scope',
            amountCents: pricedRoom,
          }
        : kind === 'addon'
          ? {
              kind,
              label: qty > 1 ? `${qty} × ${ADDON_LABELS[addonKind]}` : ADDON_LABELS[addonKind],
              detail: 'Added to accepted scope',
              amountCents: pricedAddon,
            }
          : kind === 'material'
            ? {
                kind,
                label: material?.productName ?? 'Material',
                detail: material ? `${material.manufacturer} · ${qty} gal` : `${qty} extra material`,
                amountCents: materialCents || amountCents,
              }
            : {
                kind,
                label: label.trim(),
                detail: 'Flat-rate change',
                amountCents,
              }
    if (!line.amountCents) return
    addChangeOrderLine(open.id, line)
    setLabel('')
    setAmountCents(0)
    setQuantity(1)
  }

  const draftTotal = draft ? changeOrderTotalCents(draft) : 0

  return (
    <section id="change-order" className="rounded-3xl border border-line bg-surface p-5">
      <h2 className="font-semibold">{draft ? draft.number : 'New change order'}</h2>
      <p className="mt-1 text-sm text-muted">
        Add rooms, add-ons, materials, or a flat rate. Issuing this creates a new invoice and leaves the original job locked.
      </p>

      {!draft ? (
        <div className="mt-4">
          <Button variant="primary" onClick={() => ensureOpenChangeOrder(estimate.id)}>
            Start change order
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <Field label="Title">
              <Input value={draft.title} onChange={(event) => updateChangeOrder(draft.id, { title: event.target.value })} />
            </Field>
            <Field label="Notes">
              <Textarea
                className="min-h-12"
                value={draft.notes}
                onChange={(event) => updateChangeOrder(draft.id, { notes: event.target.value })}
                placeholder="Why this changed..."
              />
            </Field>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <Field label="Add">
              <Select value={kind} onChange={(event) => setKind(event.target.value as ChangeOrderLineKind)}>
                <option value="flat">Flat rate</option>
                <option value="room">Room</option>
                <option value="addon">Add-on</option>
                <option value="material">Material</option>
              </Select>
            </Field>
            {kind === 'flat' ? (
              <>
                <Field label="What changed" className="md:col-span-2">
                  <Input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Extra bedroom, extra coat..." />
                </Field>
                <Field label="Amount">
                  <MoneyInput valueCents={amountCents} onValueCents={setAmountCents} />
                </Field>
              </>
            ) : null}
            {kind === 'room' ? (
              <>
                <Field label="Room">
                  <Select value={roomPreset} onChange={(event) => setRoomPreset(event.target.value as RoomPreset)}>
                    {ROOM_PRESETS.map((preset) => (
                      <option key={preset} value={preset}>
                        {preset}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Qty">
                  <Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value) || 1)} />
                </Field>
              </>
            ) : null}
            {kind === 'addon' ? (
              <>
                <Field label="Add-on">
                  <Select value={addonKind} onChange={(event) => setAddonKind(event.target.value as AddonKind)}>
                    {ADDON_KINDS.map((item) => (
                      <option key={item} value={item}>
                        {ADDON_LABELS[item]}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Qty">
                  <Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value) || 1)} />
                </Field>
              </>
            ) : null}
            {kind === 'material' ? (
              <>
                <Field label="Material">
                  <Select value={materialId} onChange={(event) => setMaterialId(event.target.value)}>
                    {catalog.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.productName}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Gallons">
                  <Input type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value) || 1)} />
                </Field>
              </>
            ) : null}
            <div className="flex items-end">
              <Button variant="primary" onClick={addLine}>
                <Plus className="h-4 w-4" /> Add {formatCents(suggestedAmount)}
              </Button>
            </div>
          </div>

          <div className="mt-5 space-y-2">
            {draft.lines.map((line) => (
              <div key={line.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-bg-soft px-4 py-3 text-sm">
                <div>
                  <p className="font-medium">{line.label}</p>
                  <p className="text-muted">
                    {CHANGE_ORDER_LINE_LABELS[line.kind]} · {line.detail}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32">
                    <MoneyInput
                      valueCents={line.amountCents}
                      onValueCents={(value) => updateChangeOrderLine(draft.id, line.id, { amountCents: value })}
                    />
                  </div>
                  <Button size="sm" variant="danger" onClick={() => removeChangeOrderLine(draft.id, line.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {draft.lines.length === 0 ? <p className="text-sm text-muted">No extra scope yet.</p> : null}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-semibold">Change order total {formatCents(draftTotal)}</p>
            <div className="flex gap-2">
              <Button
                variant="danger"
                onClick={() => {
                  if (window.confirm(`Discard ${draft.number}?`)) deleteChangeOrder(draft.id)
                }}
              >
                Discard
              </Button>
              <Button
                variant="primary"
                disabled={draft.lines.length === 0}
                onClick={() => invoiceChangeOrder(draft.id)}
              >
                Issue invoice
              </Button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
