import { DEFAULT_REPAIR_LEVEL_CENTS } from '@/data/pricingDefaults'
import { addCents, formatCents, percentToRate, roundGallonsUp } from '@/lib/money'
import type {
  CabinetScope,
  ColorChoice,
  DoorType,
  Estimate,
  EstimateAddon,
  EstimateColors,
  EstimateRoom,
  EstimateTotals,
  EstimateType,
  ExteriorScope,
  ExteriorSurface,
  ExteriorSurfaceKind,
  PaymentScheduleItem,
  PricingSnapshot,
  RepairLevel,
  RoomMath,
  RoomPricing,
} from '@/types/sales'

export function roomMath(room: EstimateRoom): RoomMath {
  const lengthFt = room.lengthFt
  const widthFt = room.widthFt
  const lowFt = room.heightFt
  const floorSqFt = lengthFt * widthFt
  const perimeterLf = 2 * (lengthFt + widthFt)

  let rawWall = perimeterLf * lowFt
  let ceilingArea = floorSqFt

  const vaulted = room.vaultedCeiling || room.heightMode === 'vaulted'
  if (vaulted) {
    const peakFt = Math.max(room.peakHeightFt ?? lowFt, lowFt)
    const riseFt = peakFt - lowFt
    const ridgeAlongLength = (room.vaultRidge ?? 'length') === 'length'
    const ridgeFt = ridgeAlongLength ? lengthFt : widthFt
    const spanFt = ridgeAlongLength ? widthFt : lengthFt
    const sideWalls = 2 * ridgeFt * lowFt
    const endWalls = 2 * spanFt * ((lowFt + peakFt) / 2)
    rawWall = sideWalls + endWalls
    ceilingArea = 2 * ridgeFt * Math.hypot(spanFt / 2, riseFt)
  }

  const wallSqFt = Math.max(0, rawWall - (room.subtractOpenings ? room.openingsSqFt : 0))
  const pricedWall = room.scope.walls ? wallSqFt : 0
  const pricedCeiling = room.scope.ceiling ? ceilingArea : 0
  return {
    floorSqFt,
    ceilingSqFt: pricedCeiling,
    perimeterLf,
    wallSqFt: pricedWall,
    surfaceSqFt: pricedWall + pricedCeiling,
    baseboardLf: room.scope.baseboards ? (room.baseboardLf ?? perimeterLf) : 0,
    crownLf: room.scope.crown ? (room.crownLf ?? perimeterLf) : 0,
    doorCasingLf: room.scope.doorCasing ? room.doorCasingLf : 0,
    windowCasingLf: room.scope.windowCasing ? room.windowCasingLf : 0,
  }
}

function doorRate(type: DoorType, rates: PricingSnapshot) {
  if (type === 'bifold') return rates.bifoldDoorCents
  if (type === 'exterior') return rates.exteriorDoorCents
  return rates.interiorDoorCents
}

const CASING_LF_PER_DOOR = 17
/** Both faces plus edges. Trim enamel covers less area than wall paint. */
const DOOR_TRIM_SQFT: Record<DoorType, number> = {
  interior: 42,
  bifold: 36,
  exterior: 52,
}
/** ~6.5" average profile for baseboard, casing, and crown. */
const TRIM_SQFT_PER_LF = 0.55

function doorPaintSqFt(type: DoorType) {
  return DOOR_TRIM_SQFT[type] ?? DOOR_TRIM_SQFT.interior
}

function roomDoorQty(room: EstimateRoom) {
  if (!room.scope.doors) return 0
  return room.doors.reduce((sum, door) => sum + Math.max(0, door.quantity), 0)
}

export function roomTrimPaintSqFt(room: EstimateRoom) {
  const math = roomMath(room)
  const doorQty = roomDoorQty(room)
  const impliedCasingLf = doorQty * CASING_LF_PER_DOOR
  const casingLf = room.scope.doorCasing ? Math.max(math.doorCasingLf, impliedCasingLf) : impliedCasingLf
  const linearLf = math.baseboardLf + math.windowCasingLf + math.crownLf + casingLf
  const doorSqFt = room.scope.doors
    ? room.doors.reduce((sum, door) => sum + doorPaintSqFt(door.type) * Math.max(0, door.quantity), 0)
    : 0
  return linearLf * TRIM_SQFT_PER_LF + doorSqFt
}

export function roomTrimGallons(room: EstimateRoom, rates: PricingSnapshot) {
  return (roomTrimPaintSqFt(room) * room.coatsTrim) / (rates.trimCoverage || 400)
}

function extraDoorTrimGallons(addon: EstimateAddon, rates: PricingSnapshot) {
  const quantity = Math.max(0, addon.quantity)
  const sqFt = doorPaintSqFt(addon.doorType) * quantity + quantity * CASING_LF_PER_DOOR * TRIM_SQFT_PER_LF
  return (sqFt * 2) / (rates.trimCoverage || 400)
}

export function addonUnitRateCents(addon: EstimateAddon, rates: PricingSnapshot) {
  if (addon.kind === 'extraDoors') return addon.rateOverrideCents ?? doorRate(addon.doorType, rates)
  if (addon.kind === 'staircase') return addon.rateOverrideCents ?? rates.stairFlightCents ?? 35000
  return addon.rateOverrideCents ?? rates.closetBuiltInCents ?? 22500
}

export function addonPricing(addon: EstimateAddon, rates: PricingSnapshot) {
  const quantity = Math.max(0, addon.quantity)
  if (addon.kind === 'extraDoors' || addon.kind === 'closetBuiltIns') {
    return addonUnitRateCents(addon, rates) * quantity
  }
  const flights = addonUnitRateCents(addon, rates) * quantity
  const risers = addon.paintRisers ? Math.max(0, addon.riserQty ?? 0) * (rates.stairRiserCents ?? 1500) : 0
  const handrail = Math.max(0, addon.handrailLf ?? 0) * (rates.handrailLfCents ?? 650)
  return addCents(flights, risers, handrail)
}

export function bundledAddonLabel(addon: EstimateAddon) {
  if (addon.kind === 'extraDoors') {
    const noun = addon.quantity === 1 ? 'Door' : 'Doors'
    return `${addon.quantity} ${addon.doorType === 'bifold' ? 'Bifold' : addon.doorType === 'exterior' ? 'Exterior' : 'Interior'} ${noun}`
  }
  if (addon.kind === 'staircase') {
    const parts = [`${addon.quantity} Flight${addon.quantity === 1 ? '' : 's'}`]
    if (addon.paintRisers && addon.riserQty > 0) {
      parts.push(`${addon.riserQty} Riser${addon.riserQty === 1 ? '' : 's'}`)
    }
    if ((addon.handrailLf ?? 0) > 0) {
      const lf = Number(addon.handrailLf.toFixed(addon.handrailLf % 1 ? 1 : 0))
      parts.push(`${lf} LF Handrail`)
    }
    return parts.join(', ')
  }
  return `${addon.quantity} Closet${addon.quantity === 1 ? '' : 's'} with Built-Ins`
}

function exteriorSurfaceRate(kind: ExteriorSurfaceKind, rates: PricingSnapshot) {
  if (kind === 'body') return rates.exteriorBodyCents ?? 185
  if (kind === 'trim') return rates.exteriorTrimCents ?? 350
  if (kind === 'fascia') return rates.exteriorFasciaCents ?? 450
  if (kind === 'soffit') return rates.exteriorSoffitCents ?? 225
  if (kind === 'garageDoor') return rates.exteriorGarageDoorCents ?? 17500
  if (kind === 'frontDoor') return rates.exteriorEntryDoorCents ?? 12500
  if (kind === 'fence') return rates.exteriorFenceCents ?? 185
  return rates.exteriorDeckCents ?? 275
}

function storyMultiplier(stories: number, rates: PricingSnapshot) {
  if (stories >= 3) return 1 + (rates.storyThreePercent ?? 25) / 100
  if (stories >= 2) return 1 + (rates.storyTwoPercent ?? 15) / 100
  return 1
}

export function exteriorSurfaceCents(surface: ExteriorSurface, stories: number, rates: PricingSnapshot) {
  if (!surface.enabled || surface.status === 'excluded') return 0
  const rate = surface.rateOverrideCents ?? exteriorSurfaceRate(surface.kind, rates)
  const base = rate * Math.max(0, surface.quantity)
  const lift = surface.kind === 'fence' || surface.kind === 'deck' ? 1 : storyMultiplier(stories, rates)
  return Math.round(base * lift)
}

export function exteriorPricing(scope: ExteriorScope | null | undefined, rates: PricingSnapshot) {
  if (!scope) return { laborCents: 0, bodySqFt: 0, lines: [] as { id: string; label: string; detail: string; cents: number; optional: boolean }[] }
  const lines = scope.surfaces
    .filter((surface) => surface.enabled && surface.status !== 'excluded')
    .map((surface) => {
      const cents = exteriorSurfaceCents(surface, scope.stories, rates)
      const unit = surface.unit === 'lf' ? 'LF' : surface.unit === 'qty' ? 'Qty' : 'SF'
      return {
        id: surface.id,
        label: surface.label,
        detail: `${surface.quantity} ${unit}${scope.stories > 1 && surface.kind !== 'fence' && surface.kind !== 'deck' ? ` · ${scope.stories}-story` : ''}`,
        cents,
        optional: surface.status === 'optional',
      }
    })
  return {
    laborCents: lines.filter((line) => !line.optional).reduce((sum, line) => sum + line.cents, 0),
    bodySqFt: scope.surfaces.filter((surface) => surface.enabled && surface.kind === 'body' && surface.status === 'included').reduce((sum, surface) => sum + surface.quantity, 0),
    lines,
  }
}

export function cabinetPricing(scope: CabinetScope | null | undefined, rates: PricingSnapshot) {
  type CabinetLine = { label: string; detail: string; cents: number; note?: string; includesMaterial?: boolean }
  if (!scope) {
    return { laborCents: 0, lines: [] as CabinetLine[] }
  }
  const doorRate = scope.doorPriceCents ?? rates.cabinetDoorCents ?? 6500
  const drawerRate = scope.drawerPriceCents ?? rates.cabinetDrawerCents ?? 3500
  const doorQty = Math.max(0, scope.doorQty)
  const drawerQty = Math.max(0, scope.drawerQty)
  const doorCents = doorQty * doorRate
  const drawerCents = drawerQty * drawerRate
  const boxCents = scope.boxes ? doorQty * (rates.cabinetBoxCents ?? 2500) : 0
  const islandCents = scope.island ? rates.cabinetIslandCents ?? 45000 : 0
  const qtyParts = [
    doorQty ? `${doorQty} door${doorQty === 1 ? '' : 's'} @ ${formatCents(doorRate)}` : null,
    drawerQty ? `${drawerQty} drawer${drawerQty === 1 ? '' : 's'} @ ${formatCents(drawerRate)}` : null,
  ].filter(Boolean)
  const lines: CabinetLine[] = []
  if (doorCents + drawerCents > 0) {
    lines.push({
      label: scope.scope || 'Cabinets',
      detail: qtyParts.join(' · '),
      cents: doorCents + drawerCents,
      includesMaterial: true,
      note: 'Paint is included in price',
    })
  }
  if (scope.boxes && boxCents > 0) {
    lines.push({ label: 'Cabinet Boxes', detail: `${doorQty} boxes`, cents: boxCents })
  }
  if (scope.island && islandCents > 0) {
    lines.push({ label: 'Island', detail: 'Included', cents: islandCents })
  }
  return { laborCents: doorCents + drawerCents + boxCents + islandCents, lines }
}

export function cabinetLabel(scope: CabinetScope) {
  return [scope.scope, scope.colorChange, scope.sheen, scope.hardware].filter(Boolean).join(' · ')
}

export function repairLevelRateCents(rates: PricingSnapshot, level: RepairLevel | null | undefined) {
  if (!level) return 0
  return rates.repairLevelCents?.[level - 1] ?? DEFAULT_REPAIR_LEVEL_CENTS[level - 1]
}

export function roomPricing(room: EstimateRoom, rates: PricingSnapshot): RoomPricing {
  const math = roomMath(room)
  const surfaceCents =
    rates.pricingMode === 'separate'
      ? Math.round(math.wallSqFt * rates.wallRateCents + math.ceilingSqFt * rates.ceilingRateCents)
      : Math.round(math.surfaceSqFt * rates.combinedRateCents)
  const trimLf = math.baseboardLf + math.doorCasingLf + math.windowCasingLf
  const trimCents = Math.round(trimLf * rates.trimLfCents)
  const crownCents = Math.round(math.crownLf * rates.crownLfCents)
  const doorsCents = room.scope.doors
    ? room.doors.reduce((sum, door) => {
        const rate = door.rateOverrideCents ?? doorRate(door.type, rates)
        return sum + rate * door.quantity
      }, 0)
    : 0
  const drywallCents = room.scope.drywallRepair ? repairLevelRateCents(rates, room.drywallRepairLevel) : 0
  const textureCents = room.scope.texture ? repairLevelRateCents(rates, room.textureLevel) : 0

  const wallGallons = (math.wallSqFt * room.coatsWalls) / rates.wallCoverage
  const ceilingGallons = (math.ceilingSqFt * room.coatsCeiling) / rates.ceilingCoverage
  const trimGallons = roomTrimGallons(room, rates)
  const paintGallons = (wallGallons + ceilingGallons + trimGallons) * (1 + percentToRate(rates.wasteFactor))

  return {
    surfaceCents,
    trimCents,
    crownCents,
    doorsCents,
    drywallCents,
    textureCents,
    totalCents: addCents(surfaceCents, trimCents, crownCents, doorsCents, drywallCents, textureCents),
    paintGallons,
  }
}

function isActive(room: EstimateRoom) {
  return room.status === 'included'
}

export function calculateFromFields(
  doc: Pick<Estimate, 'rooms' | 'addons' | 'exterior' | 'cabinets' | 'rates' | 'extraColors' | 'waiveColorFee' | 'discount'> & {
    lineItems?: { amountCents: number }[]
  },
): EstimateTotals {
  const rates = doc.rates
  const active = doc.rooms.filter(isActive)
  let laborCents = 0
  let wallSqFt = 0
  let ceilingSqFt = 0
  let surfaceSqFt = 0
  let trimLf = 0
  let wallGallons = 0
  let ceilingGallons = 0
  let trimGallons = 0

  for (const room of active) {
    const math = roomMath(room)
    const priced = roomPricing(room, rates)
    laborCents += priced.totalCents
    wallSqFt += math.wallSqFt
    ceilingSqFt += math.ceilingSqFt
    surfaceSqFt += math.surfaceSqFt
    trimLf += math.baseboardLf + math.doorCasingLf + math.windowCasingLf + math.crownLf
    wallGallons += (math.wallSqFt * room.coatsWalls) / rates.wallCoverage
    ceilingGallons += (math.ceilingSqFt * room.coatsCeiling) / rates.ceilingCoverage
    trimGallons += roomTrimGallons(room, rates)
  }

  for (const addon of (doc.addons ?? []).filter((item) => item.status === 'included')) {
    laborCents += addonPricing(addon, rates)
    if (addon.kind === 'extraDoors') trimGallons += extraDoorTrimGallons(addon, rates)
  }

  const exterior = exteriorPricing(doc.exterior, rates)
  const cabinets = cabinetPricing(doc.cabinets, rates)
  laborCents += exterior.laborCents + cabinets.laborCents
  laborCents += (doc.lineItems ?? []).reduce((sum, item) => sum + item.amountCents, 0)
  surfaceSqFt += exterior.bodySqFt
  const hasPaintedScope =
    active.length > 0 ||
    (doc.addons ?? []).some((item) => item.status === 'included') ||
    Boolean(doc.exterior) ||
    Boolean(doc.cabinets)

  const cabinetGallons = doc.cabinets
    ? Math.max(0, doc.cabinets.doorQty) * 0.12 + Math.max(0, doc.cabinets.drawerQty) * 0.06
    : 0
  const exteriorGallons = (exterior.bodySqFt * 2) / (rates.wallCoverage || 375)

  const waste = 1 + percentToRate(rates.wasteFactor)
  const rawGallons = (wallGallons + ceilingGallons + trimGallons + exteriorGallons + cabinetGallons) * waste
  const recommendedGallons = roundGallonsUp(rawGallons)
  const wallNeedGal = roundGallonsUp((wallGallons + exteriorGallons) * waste)
  const ceilingNeedGal = roundGallonsUp(ceilingGallons * waste)
  const trimNeedGal = roundGallonsUp(trimGallons * waste)
  const primerNeedGal = roundGallonsUp(cabinetGallons * waste)
  const paintNeedGal = primerNeedGal ? roundGallonsUp(primerNeedGal * 1.5) : 0
  const paintLineGal = wallNeedGal + ceilingNeedGal + trimNeedGal
  const paintMaterialCents = paintLineGal
    ? Math.round(paintLineGal * rates.paintCostCents * (1 + percentToRate(rates.paintMarkup)))
    : 0
  const lineOnly = !hasPaintedScope && (doc.lineItems?.length ?? 0) > 0
  const prepMaterialCents = lineOnly
    ? 0
    : addCents(rates.consumableMinCents, Math.round(surfaceSqFt * rates.consumablePerSqFtCents))
  const extrasCents = doc.waiveColorFee ? 0 : doc.extraColors * rates.extraColorCents

  const beforeDiscount = addCents(laborCents, paintMaterialCents, prepMaterialCents, extrasCents)
  const discountCents =
    doc.discount.kind === 'percent'
      ? Math.round(beforeDiscount * (doc.discount.value / 100))
      : Math.round(doc.discount.value * 100)

  const subtotalCents = beforeDiscount
  const totalCents = Math.max(0, beforeDiscount - discountCents)

  return {
    laborCents,
    paintMaterialCents,
    prepMaterialCents,
    extrasCents,
    discountCents,
    subtotalCents,
    totalCents,
    wallSqFt,
    ceilingSqFt,
    surfaceSqFt,
    trimLf,
    wallGallons,
    ceilingGallons,
    trimGallons,
    recommendedGallons,
    wallNeedGal,
    ceilingNeedGal,
    trimNeedGal,
    primerNeedGal,
    paintNeedGal,
    paintLineGal,
    belowMinimum: totalCents > 0 && totalCents < rates.minimumJobCents,
  }
}

export function calculateEstimate(estimate: Estimate): EstimateTotals {
  return calculateFromFields(estimate)
}

export function paintMaterialLine(totals: EstimateTotals) {
  if (!totals.paintLineGal || !totals.paintMaterialCents) return null
  return {
    label: 'Paint Material',
    detail: `${totals.paintLineGal} gal`,
    cents: totals.paintMaterialCents,
  }
}

export function paymentSchedule(totalCents: number, rates: PricingSnapshot): PaymentScheduleItem[] {
  const deposit = Math.round(totalCents * (rates.depositPercent / 100))
  const progress = Math.round(totalCents * (rates.progressPercent / 100))
  const final = totalCents - deposit - progress
  return [
    {
      id: 'pay_deposit',
      kind: 'booking',
      label: 'Booking Deposit',
      percent: rates.depositPercent,
      amountCents: deposit,
      dueLabel: 'Due on acceptance',
    },
    {
      id: 'pay_progress',
      kind: 'progress',
      label: 'Progress Payment',
      percent: rates.progressPercent,
      amountCents: progress,
      dueLabel: 'Due one week before start',
    },
    {
      id: 'pay_final',
      kind: 'final',
      label: 'Final Payment',
      percent: rates.finalPercent,
      amountCents: final,
      dueLabel: 'Due upon completion',
    },
  ]
}

export function bundledRoomLabel(room: EstimateRoom) {
  const parts = [
    room.scope.walls ? 'Walls' : null,
    room.scope.ceiling ? (room.vaultedCeiling || room.heightMode === 'vaulted' ? 'Vaulted Ceiling' : 'Ceiling') : null,
    room.scope.baseboards || room.scope.doorCasing || room.scope.windowCasing ? 'Standard Trim' : null,
    room.scope.crown ? 'Crown Molding' : null,
    room.scope.doors && room.doors.reduce((sum, door) => sum + door.quantity, 0)
      ? `${room.doors.reduce((sum, door) => sum + door.quantity, 0)} Door${room.doors.reduce((sum, door) => sum + door.quantity, 0) === 1 ? '' : 's'}`
      : null,
    room.scope.drywallRepair ? `Drywall Repair ${room.drywallRepairLevel ? `L${room.drywallRepairLevel}` : ''}`.trim() : null,
    room.scope.texture ? `Texture ${room.textureLevel ? `L${room.textureLevel}` : ''}`.trim() : null,
    room.colorOverride ? `Color: ${room.colorOverride}` : null,
  ].filter(Boolean)
  return parts.join(', ') || 'No scope selected'
}

function productNeedLine(label: string, gallons: number, choice?: { color?: string; productName?: string } | null) {
  if (!gallons) return null
  const product = choice?.productName?.trim()
  const color = choice?.color?.trim()
  if (product && color) return `${product} ${color} ${gallons} gal`
  if (product) return `${product} ${gallons} gal`
  if (color) return `${label} ${color} ${gallons} gal`
  return `${label} ${gallons} gal`
}

export function paintNeedLabel(
  totals: EstimateTotals,
  options?: { type?: EstimateType; colors?: EstimateColors | null },
) {
  const type = options?.type
  const colors = options?.colors
  const cabinetOnly = type === 'cabinets' || (!totals.wallNeedGal && !totals.ceilingNeedGal && !totals.trimNeedGal && Boolean(totals.primerNeedGal || totals.paintNeedGal))
  if (cabinetOnly) {
    const paint = productNeedLine('Paint', totals.paintNeedGal, colors?.cabinets)
    const primer = totals.primerNeedGal ? `Primer ${totals.primerNeedGal} gal` : null
    const parts = [primer, paint].filter(Boolean)
    return parts.join(' · ') || 'No paint needed yet'
  }
  const parts = [
    productNeedLine('Walls', totals.wallNeedGal, type === 'exterior' ? colors?.exterior?.walls : colors?.interior?.walls),
    productNeedLine('Ceiling', totals.ceilingNeedGal, colors?.interior?.ceiling),
    productNeedLine('Trim', totals.trimNeedGal, type === 'exterior' ? colors?.exterior?.trim : colors?.interior?.trim),
  ].filter(Boolean)
  if (type === 'mixed' && (totals.primerNeedGal || totals.paintNeedGal)) {
    if (totals.primerNeedGal) parts.push(`Primer ${totals.primerNeedGal} gal`)
    const cabinetPaint = productNeedLine('Paint', totals.paintNeedGal, colors?.cabinets)
    if (cabinetPaint) parts.push(cabinetPaint)
  }
  return parts.join(' · ') || 'No paint needed yet'
}

function choiceLine(label: string, choice?: ColorChoice | null) {
  if (!choice?.color && !choice?.sheen) return null
  if (choice.color && choice.sheen) return `${label}: ${choice.color} · ${choice.sheen}`
  if (choice.color) return `${label}: ${choice.color}`
  return `${label}: ${choice.sheen}`
}

function colorPaintLine(label: string, choice?: ColorChoice | null, gallons?: number) {
  const bits = [
    choice?.color?.trim() || null,
    choice?.sheen?.trim() || null,
    choice?.productName?.trim() || null,
    gallons ? `${gallons} gal` : null,
  ].filter(Boolean)
  if (!bits.length) return null
  return `${label}: ${bits.join(' · ')}`
}

export function colorPaintLines(
  colors?: EstimateColors | null,
  type?: EstimateType,
  totals?: Pick<EstimateTotals, 'wallNeedGal' | 'ceilingNeedGal' | 'trimNeedGal' | 'primerNeedGal' | 'paintNeedGal'> | null,
) {
  const wallGal = totals?.wallNeedGal ?? 0
  const ceilingGal = totals?.ceilingNeedGal ?? 0
  const trimGal = totals?.trimNeedGal ?? 0
  const primerGal = totals?.primerNeedGal ?? 0
  const paintGal = totals?.paintNeedGal ?? 0
  const lines: (string | null)[] = []

  if (includeColorGroup(type, 'interior')) {
    const onInterior = type !== 'exterior'
    lines.push(
      colorPaintLine('Walls', colors?.interior?.walls, onInterior ? wallGal : 0),
      colorPaintLine('Ceiling', colors?.interior?.ceiling, ceilingGal),
      colorPaintLine('Trim', colors?.interior?.trim, onInterior ? trimGal : 0),
      colors?.interior?.other?.trim() || null,
    )
  }
  if (includeColorGroup(type, 'exterior')) {
    const onExterior = type === 'exterior'
    lines.push(
      colorPaintLine('Walls', colors?.exterior?.walls, onExterior ? wallGal : 0),
      colorPaintLine('Fascia', colors?.exterior?.fascia),
      colorPaintLine('Trim', colors?.exterior?.trim, onExterior ? trimGal : 0),
      colorPaintLine('Doors', colors?.exterior?.doors),
      colorPaintLine('Garage Door', colors?.exterior?.garageDoor),
      colors?.exterior?.other?.trim() || null,
    )
  }
  if (includeColorGroup(type, 'cabinets')) {
    const cabinets = colors?.cabinets
    lines.push(
      colorPaintLine(
        'Cabinets',
        cabinets
          ? { color: cabinets.color, sheen: cabinets.sheen, productId: cabinets.productId, productName: cabinets.productName }
          : null,
        paintGal,
      ),
      primerGal ? `Primer: ${primerGal} gal` : null,
      cabinets?.other?.trim() || null,
    )
  }

  return lines.filter(Boolean) as string[]
}

function includeColorGroup(type: EstimateType | undefined, group: 'interior' | 'exterior' | 'cabinets') {
  if (!type) return true
  if (type === 'mixed') return true
  return type === group
}

export function colorSummaryLines(colors?: EstimateColors | null, type?: EstimateType) {
  if (!colors) return []
  const lines: (string | null)[] = []
  if (includeColorGroup(type, 'interior') && colors.interior) {
    lines.push(
      choiceLine('Walls', colors.interior.walls),
      choiceLine('Ceiling', colors.interior.ceiling),
      choiceLine('Trim', colors.interior.trim),
      colors.interior.other || null,
    )
  }
  if (includeColorGroup(type, 'exterior') && colors.exterior) {
    lines.push(
      choiceLine('Walls', colors.exterior.walls),
      choiceLine('Fascia', colors.exterior.fascia),
      choiceLine('Trim', colors.exterior.trim),
      choiceLine('Doors', colors.exterior.doors),
      choiceLine('Garage Door', colors.exterior.garageDoor),
      colors.exterior.other || null,
    )
  }
  if (includeColorGroup(type, 'cabinets') && colors.cabinets) {
    if (colors.cabinets.color) {
      lines.push(`Cabinets: ${[colors.cabinets.color, colors.cabinets.sheen].filter(Boolean).join(' · ')}`)
    }
    if (colors.cabinets.other) lines.push(colors.cabinets.other)
  }
  return lines.filter(Boolean) as string[]
}

export function hasEstimateColors(colors?: EstimateColors | null, type?: EstimateType) {
  return colorSummaryLines(colors, type).length > 0
}

export function documentCardDetails(doc: {
  type?: EstimateType
  rooms: EstimateRoom[]
  addons?: EstimateAddon[]
  exterior?: ExteriorScope | null
  cabinets?: CabinetScope | null
  colors?: EstimateColors | null
}) {
  const type: EstimateType =
    doc.type ??
    (doc.exterior && doc.cabinets ? 'mixed' : doc.exterior ? 'exterior' : doc.cabinets ? 'cabinets' : 'interior')
  const rooms = doc.rooms.filter((room) => room.status !== 'excluded')
  const addons = (doc.addons ?? []).filter((addon) => addon.status !== 'excluded')
  const facts: string[] = []
  if (type === 'interior' || type === 'mixed') {
    if (rooms.length) facts.push(`${rooms.length} room${rooms.length === 1 ? '' : 's'}`)
    if (addons.length) facts.push(`${addons.length} add-on${addons.length === 1 ? '' : 's'}`)
  }
  if (doc.exterior) {
    facts.push(`${doc.exterior.stories}-story`)
    const surfaces = doc.exterior.surfaces.filter((surface) => surface.enabled && surface.status !== 'excluded').map((surface) => surface.label)
    if (surfaces.length) facts.push(surfaces.slice(0, 3).join(', ') + (surfaces.length > 3 ? ` +${surfaces.length - 3}` : ''))
  }
  if (doc.cabinets) {
    const doorQty = doc.cabinets.doorQty
    const drawerQty = doc.cabinets.drawerQty
    const parts = [
      doorQty ? `${doorQty} door${doorQty === 1 ? '' : 's'}` : null,
      drawerQty ? `${drawerQty} drawer${drawerQty === 1 ? '' : 's'}` : null,
    ].filter(Boolean)
    if (parts.length) facts.push(parts.join(' · '))
  }
  const roomColors = rooms.filter((room) => room.colorOverride).map((room) => `${room.label}: ${room.colorOverride}`)
  return {
    type,
    rooms: rooms.map((room) => room.label),
    facts,
    roomColors,
    colorLines: colorSummaryLines(doc.colors, type),
  }
}

export function customerName(first: string, last: string) {
  return `${first} ${last}`.trim()
}

export function jobHeading(jobName: string | undefined | null, fallback: string) {
  return jobName?.trim() || fallback
}
