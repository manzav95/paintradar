import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Copy, Minus, Plus, Trash2 } from 'lucide-react'
import { CabinetBuilder, CabinetPresentation } from '@/components/sales/CabinetBuilder'
import { ColorSection } from '@/components/sales/ColorSection'
import { ExteriorBuilder, ExteriorPresentation } from '@/components/sales/ExteriorBuilder'
import { LiveTotalBar } from '@/components/sales/LiveTotalBar'
import { MarkupCompare, MoneyInput, PercentInput } from '@/components/sales/MoneyFields'
import { MeasureInput } from '@/components/sales/MeasureInput'
import { SignaturePad } from '@/components/sales/SignaturePad'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import {
  addonPricing,
  bundledAddonLabel,
  bundledRoomLabel,
  calculateFromFields,
  colorPaintLines,
  customerName,
  jobHeading,
  paintMaterialLine,
  paymentSchedule,
  repairLevelRateCents,
  roomMath,
  roomPricing,
} from '@/lib/estimateEngine'
import { normalizeColors } from '@/data/pricingDefaults'
import { formatCents } from '@/lib/money'
import { prepareEstimateEmail } from '@/lib/salesEmail'
import { useSales } from '@/providers/SalesState'
import {
  ADDON_KINDS,
  ADDON_LABELS,
  ESTIMATE_TYPE_LABELS,
  DOOR_LABELS,
  DOOR_TYPES,
  HEIGHT_PRESETS,
  REPAIR_LEVELS,
  ROOM_PRESETS,
  type DoorType,
  type EstimateAddon,
  type EstimateRoom,
  type HeightMode,
  type RepairLevel,
  type RoomPreset,
  type RoomScope,
  type ScopeStatus,
  type VaultRidge,
} from '@/types/sales'
const SCOPE_KEYS: { key: keyof RoomScope; label: string }[] = [
  { key: 'walls', label: 'Walls' },
  { key: 'ceiling', label: 'Ceiling' },
  { key: 'baseboards', label: 'Baseboards' },
  { key: 'doorCasing', label: 'Door Casing' },
  { key: 'windowCasing', label: 'Window Casing' },
  { key: 'crown', label: 'Crown Molding' },
  { key: 'doors', label: 'Doors' },
  { key: 'closet', label: 'Closet' },
  { key: 'accentWall', label: 'Accent Wall' },
  { key: 'drywallRepair', label: 'Drywall Repair' },
  { key: 'texture', label: 'Texture' },
  { key: 'builtIns', label: 'Built-Ins' },
]

export function EstimateBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    estimates,
    customers,
    catalog,
    changeOrders,
    saveStatus,
    addRoom,
    updateRoom,
    duplicateRoom,
    removeRoom,
    addAddon,
    updateAddon,
    removeAddon,
    updateEstimate,
    signEstimate,
    convertToInvoice,
  } = useSales()
  const estimate = estimates.find((item) => item.id === id)
  const customer = customers.find((item) => item.id === estimate?.customerId)
  const [presetOpen, setPresetOpen] = useState(false)
  const [addonOpen, setAddonOpen] = useState(false)
  const [signOpen, setSignOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [signatureData, setSignatureData] = useState('')
  const [printedName, setPrintedName] = useState(customer ? customerName(customer.firstName, customer.lastName) : '')

  const totals = useMemo(() => (estimate ? calculateFromFields(estimate) : null), [estimate])
  const schedule = useMemo(
    () => (estimate && totals ? paymentSchedule(totals.totalCents, estimate.rates) : []),
    [estimate, totals],
  )

  if (!estimate || !totals) return <p className="text-muted">Estimate not found.</p>

  const large = estimate.fieldMode
  const email = prepareEstimateEmail(estimate, customer, totals)
  const paintLine = paintMaterialLine(totals)
  const paintCost = Math.round(totals.paintLineGal * estimate.rates.paintCostCents)
  const profit = totals.totalCents - paintCost - totals.prepMaterialCents
  const colorLines = colorPaintLines(estimate.colors, estimate.type, totals)

  const nextBedroomLabel = () => {
    const count = estimate.rooms.filter((room) => room.preset === 'Bedroom' || room.label.startsWith('Bedroom')).length
    return `Bedroom ${count + 1}`
  }

  const addPreset = (preset: RoomPreset) => {
    addRoom(estimate.id, preset, preset === 'Bedroom' ? nextBedroomLabel() : preset)
    setPresetOpen(false)
  }

  return (
    <div className={`space-y-5 pb-36 ${large ? 'text-[15px]' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">{estimate.number}</p>
          <h1 className="text-2xl font-semibold">
            {jobHeading(
              estimate.jobName,
              customer ? customerName(customer.firstName, customer.lastName) : `${ESTIMATE_TYPE_LABELS[estimate.type]} Estimate`,
            )}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">{ESTIMATE_TYPE_LABELS[estimate.type]}</p>
            {changeOrders.some((item) => item.estimateId === estimate.id) ? (
              <span className="rounded-full bg-urgent/15 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-urgent">
                Has change orders
              </span>
            ) : null}
          </div>
          <p className="text-sm text-muted">
            {customer ? customerName(customer.firstName, customer.lastName) : 'Customer'}
            {estimate.jobName ? ` · ${estimate.number}` : ''}
            {' · '}
            {estimate.projectAddress || customer?.address || 'Add project address'} · {estimate.projectCity || customer?.city}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
            {saveStatus === 'saved' ? 'Saved' : saveStatus === 'saving' ? 'Saving...' : 'Offline changes pending'}
          </span>
          <Button size="sm" onClick={() => navigate(`/sales/jobs/${estimate.id}`)}>
            Job
          </Button>
          <Button size="sm" onClick={() => updateEstimate(estimate.id, { fieldMode: !estimate.fieldMode })}>
            {estimate.fieldMode ? 'Field Mode On' : 'Field Mode'}
          </Button>
          <Button size="sm" onClick={() => updateEstimate(estimate.id, { clientView: estimate.clientView === 'bundled' ? 'detailed' : 'bundled' })}>
            Client View: {estimate.clientView === 'bundled' ? 'Bundled' : 'Detailed'}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="rounded-3xl border border-line bg-surface p-5">
            <Field label="Job name">
              <Input
                value={estimate.jobName}
                onChange={(event) => updateEstimate(estimate.id, { jobName: event.target.value })}
                placeholder="Name this job so invoices and payments are easy to spot"
              />
            </Field>
          </div>
          <ColorSection
            type={estimate.type}
            colors={normalizeColors(estimate.colors)}
            catalog={catalog}
            gallons={{
              walls: totals.wallNeedGal,
              ceiling: totals.ceilingNeedGal,
              trim: totals.trimNeedGal,
              primer: totals.primerNeedGal,
              paint: totals.paintNeedGal,
            }}
            onChange={(colors) =>
              updateEstimate(estimate.id, {
                colors,
                ...(estimate.cabinets
                  ? { cabinets: { ...estimate.cabinets, sheen: colors.cabinets.sheen || estimate.cabinets.sheen } }
                  : {}),
              })
            }
          />

          {estimate.type === 'exterior' || estimate.type === 'mixed' ? (
            estimate.exterior ? (
              <ExteriorBuilder
                value={estimate.exterior}
                rates={estimate.rates}
                large={large}
                onChange={(exterior) => updateEstimate(estimate.id, { exterior })}
              />
            ) : null
          ) : null}

          {estimate.type === 'cabinets' || estimate.type === 'mixed' ? (
            estimate.cabinets ? (
              <CabinetBuilder
                value={estimate.cabinets}
                rates={estimate.rates}
                large={large}
                onChange={(cabinets) => updateEstimate(estimate.id, { cabinets })}
              />
            ) : null
          ) : null}

          {estimate.type === 'interior' || estimate.type === 'mixed' ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" size={large ? 'lg' : 'md'} onClick={() => setPresetOpen(true)}>
              <Plus className="h-4 w-4" /> Add Room
            </Button>
            <Button size={large ? 'lg' : 'md'} onClick={() => addPreset('Bedroom')}>
              Fast Bedroom
            </Button>
            <Button size={large ? 'lg' : 'md'} onClick={() => setAddonOpen(true)}>
              <Plus className="h-4 w-4" /> Add-on
            </Button>
          </div>
          ) : null}

          {estimate.type === 'interior' || estimate.type === 'mixed'
            ? (estimate.addons ?? []).map((addon) => (
                <AddonCard
                  key={addon.id}
                  addon={addon}
                  rates={estimate.rates}
                  large={large}
                  onChange={(patch) => updateAddon(estimate.id, addon.id, patch)}
                  onDelete={() => removeAddon(estimate.id, addon.id)}
                />
              ))
            : null}

          {estimate.type === 'interior' || estimate.type === 'mixed'
            ? estimate.rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  rates={estimate.rates}
                  large={large}
                  clientView={estimate.clientView}
                  onChange={(patch) => updateRoom(estimate.id, room.id, patch)}
                  onDuplicate={() => duplicateRoom(estimate.id, room.id)}
                  onDelete={() => removeRoom(estimate.id, room.id)}
                />
              ))
            : null}

          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-semibold">Discount & Extra Color Fees</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Field label="Additional Colors">
                <Input
                  type="number"
                  min={0}
                  value={estimate.extraColors}
                  onFocus={(event) => event.currentTarget.select()}
                  onChange={(event) => updateEstimate(estimate.id, { extraColors: Number(event.target.value) || 0 })}
                />
              </Field>
              <Field label="Discount Label">
                <Input
                  value={estimate.discount.label}
                  onChange={(event) => updateEstimate(estimate.id, { discount: { ...estimate.discount, label: event.target.value } })}
                  placeholder="Referral Discount"
                />
              </Field>
              <Field label={estimate.discount.kind === 'percent' ? 'Discount' : 'Discount'}>
                {estimate.discount.kind === 'percent' ? (
                  <PercentInput
                    value={estimate.discount.value}
                    onValue={(value) => updateEstimate(estimate.id, { discount: { ...estimate.discount, value } })}
                  />
                ) : (
                  <MoneyInput
                    valueCents={Math.round((estimate.discount.value || 0) * 100)}
                    onValueCents={(cents) =>
                      updateEstimate(estimate.id, { discount: { ...estimate.discount, value: cents / 100 } })
                    }
                  />
                )}
              </Field>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => updateEstimate(estimate.id, { waiveColorFee: !estimate.waiveColorFee })}>
                {estimate.waiveColorFee ? 'Color Fee Waived' : 'Waive Additional Color Fee'}
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  updateEstimate(estimate.id, {
                    discount: { ...estimate.discount, kind: estimate.discount.kind === 'percent' ? 'flat' : 'percent' },
                  })
                }
              >
                {estimate.discount.kind === 'percent' ? 'Using %' : 'Using $'}
              </Button>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-5">
            <h2 className="font-semibold">Payment Schedule</h2>
            <div className="mt-3 space-y-2">
              {schedule.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl bg-bg-soft px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-muted">{item.percent}% · {item.dueLabel}</p>
                  </div>
                  <p className="font-semibold">{formatCents(item.amountCents)}</p>
                </div>
              ))}
            </div>
          </div>

          <Field label="Notes">
            <Textarea value={estimate.notes} onChange={(event) => updateEstimate(estimate.id, { notes: event.target.value })} />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => setSignOpen(true)}>
              Capture Signature
            </Button>
            <Button onClick={() => window.open(`/sales/estimates/${estimate.id}/print`, '_blank')}>Download / Print PDF</Button>
            <Button onClick={() => setEmailOpen(true)}>Email / Share</Button>
            <Button
              onClick={() => {
                const invoice = convertToInvoice(estimate.id)
                if (invoice) navigate(`/sales/invoices/${invoice.id}`)
              }}
            >
              Convert to Invoice
            </Button>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <LiveTotalBar totals={totals} />
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h3 className="font-semibold">Internal Breakdown</h3>
            <Stat label="Wall Sq Ft" value={totals.wallSqFt.toFixed(0)} />
            <Stat label="Ceiling Sq Ft" value={totals.ceilingSqFt.toFixed(0)} />
            <Stat label="Surface Sq Ft" value={totals.surfaceSqFt.toFixed(0)} />
            <Stat label="Trim LF" value={totals.trimLf.toFixed(1)} />
            <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted">Paint needed</p>
            {estimate.type === 'cabinets' ? (
              <>
                <Stat label="Primer" value={`${totals.primerNeedGal} gal`} />
                <Stat label="Paint" value={`${totals.paintNeedGal} gal`} />
              </>
            ) : (
              <>
                <Stat label="Walls" value={`${totals.wallNeedGal} gal`} />
                <Stat label="Ceiling" value={`${totals.ceilingNeedGal} gal`} />
                <Stat label="Trim" value={`${totals.trimNeedGal} gal`} />
                {estimate.type === 'mixed' && (totals.primerNeedGal || totals.paintNeedGal) ? (
                  <>
                    <Stat label="Cabinet primer" value={`${totals.primerNeedGal} gal`} />
                    <Stat label="Cabinet paint" value={`${totals.paintNeedGal} gal`} />
                  </>
                ) : null}
              </>
            )}
            <div className="mt-3">
              <MarkupCompare costCents={paintCost} markupPercent={estimate.rates.paintMarkup} />
            </div>
            <Stat label="Est. Profit" value={formatCents(profit)} />
            {totals.belowMinimum ? (
              <p className="mt-3 rounded-xl bg-urgent/15 px-3 py-2 text-sm text-urgent">
                Below minimum job charge ({formatCents(estimate.rates.minimumJobCents)}).
              </p>
            ) : null}
          </div>
          <div className="rounded-3xl border border-line bg-surface p-5">
            <h3 className="font-semibold">Client Presentation</h3>
            {colorLines.length ? (
              <div className="mb-3 space-y-1 text-sm text-muted">
                {colorLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            ) : null}
            {estimate.exterior ? <ExteriorPresentation value={estimate.exterior} rates={estimate.rates} /> : null}
            {estimate.cabinets ? <CabinetPresentation value={estimate.cabinets} rates={estimate.rates} /> : null}
            {(estimate.addons ?? [])
              .filter((addon) => addon.status !== 'excluded')
              .map((addon) => {
                const amount = addonPricing(addon, estimate.rates)
                return (
                  <div key={addon.id} className="mt-3 border-t border-line pt-3 first:border-0 first:pt-0">
                    <div className="flex justify-between gap-3">
                      <p className="font-medium">
                        {addon.label}
                        {addon.status === 'optional' ? <span className="ml-2 text-xs text-gold">Optional</span> : null}
                      </p>
                      <p>{addon.status === 'optional' ? `+${formatCents(amount)}` : formatCents(amount)}</p>
                    </div>
                    <p className="text-sm text-muted">{bundledAddonLabel(addon)}</p>
                  </div>
                )
              })}
            {estimate.rooms
              .filter((room) => room.status !== 'excluded')
              .map((room) => {
                const priced = roomPricing(room, estimate.rates)
                return (
                  <div key={room.id} className="mt-3 border-t border-line pt-3 first:border-0 first:pt-0">
                    <div className="flex justify-between gap-3">
                      <p className="font-medium">
                        {room.label} Painting
                        {room.status === 'optional' ? <span className="ml-2 text-xs text-gold">Optional</span> : null}
                      </p>
                      <p>{room.status === 'optional' ? `+${formatCents(priced.totalCents)}` : formatCents(priced.totalCents)}</p>
                    </div>
                    {estimate.clientView === 'bundled' ? (
                      <p className="text-sm text-muted">{bundledRoomLabel(room)}</p>
                    ) : (
                      <div className="mt-1 space-y-1 text-sm text-muted">
                        <p>Walls / Ceiling {formatCents(priced.surfaceCents)}</p>
                        <p>Trim {formatCents(priced.trimCents)}</p>
                        {priced.crownCents ? <p>Crown {formatCents(priced.crownCents)}</p> : null}
                        {priced.doorsCents ? <p>Doors {formatCents(priced.doorsCents)}</p> : null}
                        {priced.drywallCents ? <p>Drywall Repair {formatCents(priced.drywallCents)}</p> : null}
                        {priced.textureCents ? <p>Texture {formatCents(priced.textureCents)}</p> : null}
                      </div>
                    )}
                  </div>
                )
              })}
            {paintLine ? (
              <div className="mt-3 flex justify-between border-t border-line pt-3">
                <div>
                  <p className="font-medium">{paintLine.label}</p>
                  <p className="text-sm text-muted">{paintLine.detail}</p>
                </div>
                <p>{formatCents(paintLine.cents)}</p>
              </div>
            ) : null}
            {totals.prepMaterialCents ? (
              <div className="mt-3 flex justify-between border-t border-line pt-3 text-sm">
                <span>Prep & Protection Materials</span>
                <span>{formatCents(totals.prepMaterialCents)}</span>
              </div>
            ) : null}
            {totals.extrasCents ? (
              <div className="mt-2 flex justify-between text-sm">
                <span>Additional Colors</span>
                <span>{formatCents(totals.extrasCents)}</span>
              </div>
            ) : null}
            {totals.discountCents ? (
              <div className="mt-2 flex justify-between text-sm text-success">
                <span>{estimate.discount.label || 'Discount'}</span>
                <span>-{formatCents(totals.discountCents)}</span>
              </div>
            ) : null}
          </div>
        </aside>
      </div>

      <div className="fixed right-4 bottom-4 left-4 z-40 xl:hidden">
        <LiveTotalBar totals={totals} compact />
      </div>

      <Modal open={addonOpen} title="Add-on" subtitle="Extra doors, stairs, and closets with built-ins." onClose={() => setAddonOpen(false)}>
        <div className="grid gap-2">
          {ADDON_KINDS.map((kind) => (
            <button
              key={kind}
              onClick={() => {
                addAddon(estimate.id, kind)
                setAddonOpen(false)
              }}
              className="rounded-2xl border border-line px-4 py-4 text-left font-medium hover:border-gold/40 hover:bg-gold/10"
            >
              {ADDON_LABELS[kind]}
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={presetOpen} title="Add Room" subtitle="Choose a preset, then edit the label if needed." onClose={() => setPresetOpen(false)}>
        <div className="grid grid-cols-2 gap-2">
          {ROOM_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => addPreset(preset)}
              className="rounded-2xl border border-line px-3 py-4 text-left font-medium hover:border-gold/40 hover:bg-gold/10"
            >
              {preset === 'Bedroom' ? nextBedroomLabel() : preset}
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={signOpen} title="Client signature" subtitle="Sign with a finger, stylus, or mouse." onClose={() => setSignOpen(false)} wide>
        <SignaturePad onChange={setSignatureData} />
        <Field label="Printed Name" className="mt-4">
          <Input value={printedName} onChange={(event) => setPrintedName(event.target.value)} />
        </Field>
        <p className="mt-3 text-sm text-muted">Accepted amount {formatCents(totals.totalCents)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant="primary"
            disabled={!signatureData || !printedName.trim()}
            onClick={() => {
              signEstimate(estimate.id, {
                imageData: signatureData,
                printedName: printedName.trim(),
                signedAt: new Date().toISOString(),
                acceptedAmountCents: totals.totalCents,
              })
              setSignOpen(false)
              window.open(`/sales/estimates/${estimate.id}/print`, '_blank')
            }}
          >
            Sign & Send Copy
          </Button>
        </div>
      </Modal>

      <Modal open={emailOpen} title="Email / Share" onClose={() => setEmailOpen(false)}>
        <Field label="Recipient">
          <Input defaultValue={email.to} />
        </Field>
        <Field label="Subject" className="mt-3">
          <Input defaultValue={email.subject} />
        </Field>
        <Field label="Message" className="mt-3">
          <Textarea defaultValue={email.body} />
        </Field>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={() => window.open(email.mailto)}>
            Open Email
          </Button>
          <Button onClick={() => window.open(email.sms)}>Text Link</Button>
          <Button
            onClick={() => {
              void navigator.clipboard.writeText(`${window.location.origin}/sales/estimates/${estimate.id}`)
            }}
          >
            Share Link
          </Button>
        </div>
        <p className="mt-3 text-xs text-faint">Email delivery can be connected later. This prepares the message and PDF now.</p>
      </Modal>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2 flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </div>
  )
}

function RoomCard({
  room,
  rates,
  large,
  clientView,
  onChange,
  onDuplicate,
  onDelete,
}: {
  room: EstimateRoom
  rates: ReturnType<typeof calculateFromFields> extends never ? never : import('@/types/sales').PricingSnapshot
  large: boolean
  clientView: 'bundled' | 'detailed'
  onChange: (patch: Partial<EstimateRoom>) => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const math = roomMath(room)
  const priced = roomPricing(room, rates)
  const [repairPrompt, setRepairPrompt] = useState<'drywallRepair' | 'texture' | null>(null)
  const [ceilingOpen, setCeilingOpen] = useState(false)
  const setScope = (key: keyof RoomScope) => {
    if (key === 'ceiling') {
      setCeilingOpen(true)
      return
    }
    if (key === 'drywallRepair' || key === 'texture') {
      setRepairPrompt(key)
      return
    }
    onChange({ scope: { ...room.scope, [key]: !room.scope[key] } })
  }
  const applyCeiling = (choice: 'flat' | 'vaulted' | 'none') => {
    if (choice === 'none') {
      onChange({
        vaultedCeiling: false,
        scope: { ...room.scope, ceiling: false },
      })
    } else if (choice === 'vaulted') {
      onChange({
        vaultedCeiling: true,
        peakHeightFt: room.peakHeightFt ?? 20,
        vaultRidge: room.vaultRidge ?? 'length',
        scope: { ...room.scope, ceiling: true },
      })
    } else {
      onChange({
        vaultedCeiling: false,
        scope: { ...room.scope, ceiling: true },
      })
    }
    setCeilingOpen(false)
  }
  const applyRepairLevel = (level: RepairLevel) => {
    if (!repairPrompt) return
    onChange({
      scope: { ...room.scope, [repairPrompt]: true },
      ...(repairPrompt === 'drywallRepair' ? { drywallRepairLevel: level } : { textureLevel: level }),
    })
    setRepairPrompt(null)
  }
  const clearRepair = () => {
    if (!repairPrompt) return
    onChange({
      scope: { ...room.scope, [repairPrompt]: false },
      ...(repairPrompt === 'drywallRepair' ? { drywallRepairLevel: null } : { textureLevel: null }),
    })
    setRepairPrompt(null)
  }
  const heightMode: HeightMode = room.heightMode === 'vaulted' ? 'preset' : (room.heightMode ?? 'preset')
  const vaulted = Boolean(room.vaultedCeiling || room.heightMode === 'vaulted')
  const currentRepairLevel = repairPrompt === 'texture' ? room.textureLevel : room.drywallRepairLevel
  const repairOn = repairPrompt ? room.scope[repairPrompt] : false
  const heightSelectValue = heightMode === 'custom' || !HEIGHT_PRESETS.includes(room.heightFt as (typeof HEIGHT_PRESETS)[number])
    ? 'custom'
    : String(room.heightFt)

  return (
    <article className={`rounded-3xl border bg-surface p-5 ${room.status === 'excluded' ? 'border-urgent/30 opacity-70' : 'border-line'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Input
          className={large ? 'h-14 max-w-xs text-lg font-semibold' : 'max-w-xs font-semibold'}
          value={room.label}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => onChange({ label: event.target.value })}
        />
        <div className="flex flex-wrap gap-2">
          {(['included', 'optional', 'excluded'] as ScopeStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => onChange({ status })}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${room.status === status ? 'bg-gold text-[#1a1406]' : 'border border-line text-muted'}`}
            >
              {status === 'excluded' ? 'Excluded From Scope' : status}
            </button>
          ))}
          <Button size="sm" onClick={onDuplicate}>
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </Button>
          <Button size="sm" variant="danger" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <Field label="Length">
          <MeasureInput value={room.lengthFt} onChange={(lengthFt) => onChange({ lengthFt })} large={large} />
        </Field>
        <Field label="Width">
          <MeasureInput value={room.widthFt} onChange={(widthFt) => onChange({ widthFt })} large={large} />
        </Field>
        <Field label="Wall Height">
          <Select
            value={heightSelectValue}
            onChange={(event) => {
              const value = event.target.value
              if (value === 'custom') onChange({ heightMode: 'custom', heightFt: room.heightFt || 8 })
              else onChange({ heightMode: 'preset', heightFt: Number(value) })
            }}
            className={large ? 'h-14 text-lg' : ''}
          >
            {HEIGHT_PRESETS.map((height) => (
              <option key={height} value={height}>
                {height} ft
              </option>
            ))}
            <option value="custom">Custom</option>
          </Select>
        </Field>
        {heightMode === 'custom' ? (
          <Field label="Custom Height">
            <MeasureInput value={room.heightFt} onChange={(heightFt) => onChange({ heightFt, heightMode: 'custom' })} large={large} />
          </Field>
        ) : (
          <div className="rounded-2xl bg-bg-soft px-3 py-3 text-sm text-muted">
            Floor {math.floorSqFt.toFixed(0)} · Walls {math.wallSqFt.toFixed(0)} · Ceiling {math.ceilingSqFt.toFixed(0)}
            {vaulted ? ' · sloped' : ''}
          </div>
        )}
        {heightMode === 'custom' ? (
          <div className="rounded-2xl bg-bg-soft px-3 py-3 text-sm text-muted md:col-span-4">
            Floor {math.floorSqFt.toFixed(0)} · Walls {math.wallSqFt.toFixed(0)} · Ceiling {math.ceilingSqFt.toFixed(0)}
          </div>
        ) : null}
      </div>
      <Field label="This room only" className="mt-4">
        <Input
          value={room.colorOverride ?? ''}
          onChange={(event) => onChange({ colorOverride: event.target.value })}
          placeholder="Leave blank to use house colors"
        />
      </Field>

      {vaulted ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Peak / Center Height">
            <MeasureInput
              value={room.peakHeightFt ?? 20}
              onChange={(peakHeightFt) => onChange({ peakHeightFt, vaultedCeiling: true })}
              large={large}
            />
          </Field>
          <Field label="Peak Runs Along">
            <Select
              value={room.vaultRidge ?? 'length'}
              onChange={(event) => onChange({ vaultRidge: event.target.value as VaultRidge, vaultedCeiling: true })}
              className={large ? 'h-14 text-lg' : ''}
            >
              <option value="length">Length</option>
              <option value="width">Width</option>
            </Select>
          </Field>
          <p className="text-sm text-muted md:col-span-2">
            Wall height is the low ends. Peak is the center. Example: 9 ft walls, 20 ft peak.
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {SCOPE_KEYS.map((item) => {
          const level = item.key === 'drywallRepair' ? room.drywallRepairLevel : item.key === 'texture' ? room.textureLevel : null
          const ceilingOn = item.key === 'ceiling' && room.scope.ceiling
          const label = item.key === 'ceiling' && ceilingOn && vaulted ? 'Vaulted Ceiling' : item.label
          return (
            <button
              key={item.key}
              onClick={() => setScope(item.key)}
              className={`rounded-full px-3 py-2 text-sm font-medium ${room.scope[item.key] ? 'bg-gold/15 text-gold' : 'border border-line text-muted'}`}
            >
              {label}
              {room.scope[item.key] && level ? ` ${level}` : ''}
            </button>
          )
        })}
      </div>

      <Modal
        open={ceilingOpen}
        title="Ceiling"
        subtitle="Choose a flat ceiling, a vaulted ceiling, or none."
        onClose={() => setCeilingOpen(false)}
      >
        <div className="grid gap-2">
          <button
            type="button"
            onClick={() => applyCeiling('flat')}
            className={`rounded-2xl border px-4 py-3 text-left font-medium ${
              room.scope.ceiling && !vaulted ? 'border-gold bg-gold/15 text-gold' : 'border-line hover:border-gold/40'
            }`}
          >
            Ceiling
          </button>
          <button
            type="button"
            onClick={() => applyCeiling('vaulted')}
            className={`rounded-2xl border px-4 py-3 text-left font-medium ${
              room.scope.ceiling && vaulted ? 'border-gold bg-gold/15 text-gold' : 'border-line hover:border-gold/40'
            }`}
          >
            Vaulted
          </button>
          <button
            type="button"
            onClick={() => applyCeiling('none')}
            className={`rounded-2xl border px-4 py-3 text-left font-medium ${
              !room.scope.ceiling ? 'border-gold bg-gold/15 text-gold' : 'border-line hover:border-gold/40'
            }`}
          >
            None
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(repairPrompt)}
        title={repairPrompt === 'texture' ? 'Texture Level' : 'Drywall Repair Level'}
        subtitle="Choose the level of work. Each level is a flat rate."
        onClose={() => setRepairPrompt(null)}
      >
        <div className="grid gap-2">
          {REPAIR_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => applyRepairLevel(level)}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left ${
                currentRepairLevel === level ? 'border-gold bg-gold/15 text-gold' : 'border-line hover:border-gold/40'
              }`}
            >
              <span className="font-medium">Level {level}</span>
              <span className="font-semibold">{formatCents(repairLevelRateCents(rates, level))}</span>
            </button>
          ))}
        </div>
        {repairOn ? (
          <Button className="mt-4" variant="danger" onClick={clearRepair}>
            Remove
          </Button>
        ) : null}
      </Modal>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {room.scope.baseboards ? (
          <Field label="Baseboard LF">
            <MeasureInput
              value={room.baseboardLf ?? math.perimeterLf}
              onChange={(baseboardLf) => onChange({ baseboardLf })}
              large={large}
              suffix="lf"
            />
          </Field>
        ) : null}
        {room.scope.crown ? (
          <Field label="Crown LF">
            <MeasureInput value={room.crownLf ?? math.perimeterLf} onChange={(crownLf) => onChange({ crownLf })} large={large} suffix="lf" />
          </Field>
        ) : null}
        {room.scope.doors ? (
          <Field label="Interior Door Qty">
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => changeDoor(room, onChange, Math.max(0, (room.doors[0]?.quantity ?? 0) - 1))}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-10 text-center text-lg font-semibold">{room.doors[0]?.quantity ?? 0}</span>
              <Button size="sm" onClick={() => changeDoor(room, onChange, (room.doors[0]?.quantity ?? 0) + 1)}>
                <Plus className="h-4 w-4" />
              </Button>
              <Select
                value={room.doors[0]?.type ?? 'interior'}
                onChange={(event) => {
                  const type = event.target.value as DoorType
                  const current = room.doors[0]
                  onChange({
                    doors: [{ id: current?.id ?? 'door_1', type, quantity: current?.quantity ?? 1, rateOverrideCents: current?.rateOverrideCents ?? null }],
                  })
                }}
              >
                {DOOR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {DOOR_LABELS[type]}
                  </option>
                ))}
              </Select>
            </div>
          </Field>
        ) : null}
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={room.subtractOpenings}
          onChange={(event) => onChange({ subtractOpenings: event.target.checked })}
        />
        Subtract openings
      </label>
      {room.subtractOpenings ? (
        <Field label="Openings Sq Ft" className="mt-2 max-w-xs">
          <MeasureInput value={room.openingsSqFt} onChange={(openingsSqFt) => onChange({ openingsSqFt })} suffix="sf" />
        </Field>
      ) : null}

      <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm text-muted">
        <span>
          {clientView === 'bundled' ? bundledRoomLabel(room) : `Surface ${formatCents(priced.surfaceCents)}`}
        </span>
        <span className="font-semibold text-ink">{formatCents(priced.totalCents)}</span>
      </div>
    </article>
  )
}

function changeDoor(room: EstimateRoom, onChange: (patch: Partial<EstimateRoom>) => void, quantity: number) {
  const current = room.doors[0] ?? { id: 'door_1', type: 'interior' as const, quantity: 1, rateOverrideCents: null }
  onChange({ doors: [{ ...current, quantity }] })
}

function AddonCard({
  addon,
  rates,
  large,
  onChange,
  onDelete,
}: {
  addon: EstimateAddon
  rates: import('@/types/sales').PricingSnapshot
  large: boolean
  onChange: (patch: Partial<EstimateAddon>) => void
  onDelete: () => void
}) {
  const amount = addonPricing(addon, rates)
  const qtyLabel = addon.kind === 'staircase' ? 'Flights' : 'Qty'
  return (
    <article className={`rounded-3xl border bg-surface p-5 ${addon.status === 'excluded' ? 'border-urgent/30 opacity-70' : 'border-line'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Input
          className={large ? 'h-14 max-w-xs text-lg font-semibold' : 'max-w-xs font-semibold'}
          value={addon.label}
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => onChange({ label: event.target.value })}
        />
        <div className="flex flex-wrap gap-2">
          {(['included', 'optional', 'excluded'] as ScopeStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => onChange({ status })}
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${addon.status === status ? 'bg-gold text-[#1a1406]' : 'border border-line text-muted'}`}
            >
              {status === 'excluded' ? 'Excluded From Scope' : status}
            </button>
          ))}
          <Button size="sm" variant="danger" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{qtyLabel}</span>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" onClick={() => onChange({ quantity: Math.max(1, addon.quantity - 1) })}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-10 text-center text-lg font-semibold">{addon.quantity}</span>
            <Button type="button" size="sm" onClick={() => onChange({ quantity: addon.quantity + 1 })}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {addon.kind === 'extraDoors' ? (
          <Field label="Door Type">
            <Select
              value={addon.doorType}
              onChange={(event) => onChange({ doorType: event.target.value as DoorType })}
              className={large ? 'h-14 text-lg' : ''}
            >
              {DOOR_TYPES.map((type) => (
                <option key={type} value={type}>
                  {DOOR_LABELS[type]}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        {addon.kind === 'staircase' ? (
          <>
            <button
              type="button"
              onClick={() =>
                onChange({
                  paintRisers: !addon.paintRisers,
                  riserQty: !addon.paintRisers && !addon.riserQty ? 13 : addon.riserQty,
                })
              }
              className={`rounded-full px-4 py-2 text-sm font-semibold ${addon.paintRisers ? 'bg-gold text-[#1a1406]' : 'border border-line text-muted'}`}
            >
              Painted Risers
            </button>
            {addon.paintRisers ? (
              <div className="space-y-1.5">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Riser Qty</span>
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" onClick={() => onChange({ riserQty: Math.max(1, addon.riserQty - 1) })}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="min-w-10 text-center text-lg font-semibold">{addon.riserQty || 0}</span>
                  <Button type="button" size="sm" onClick={() => onChange({ riserQty: (addon.riserQty || 0) + 1 })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
            <Field label="Handrail LF">
              <MeasureInput value={addon.handrailLf || 0} onChange={(handrailLf) => onChange({ handrailLf })} large={large} suffix="lf" />
            </Field>
          </>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-3 text-sm text-muted">
        <span>{bundledAddonLabel(addon)}</span>
        <span className="font-semibold text-ink">{formatCents(amount)}</span>
      </div>
    </article>
  )
}
