import type {
  BusinessSalesSettings,
  CabinetColors,
  CabinetScope,
  CatalogMaterial,
  ColorChoice,
  EstimateColors,
  ExteriorColors,
  ExteriorScope,
  InteriorColors,
  PricingSnapshot,
  RoomScope,
} from '@/types/sales'
import { uid } from '@/lib/format'

export const DEFAULT_REPAIR_LEVEL_CENTS: [number, number, number, number, number] = [5000, 7500, 10000, 12500, 15000]

export function createDefaultPricing(): PricingSnapshot {
  return {
    pricingMode: 'combined',
    combinedRateCents: 175,
    wallRateCents: 145,
    ceilingRateCents: 125,
    trimLfCents: 250,
    crownLfCents: 850,
    interiorDoorCents: 6000,
    bifoldDoorCents: 8000,
    exteriorDoorCents: 10000,
    extraColorCents: 15000,
    includedColors: 3,
    wallCoverage: 375,
    ceilingCoverage: 375,
    trimCoverage: 400,
    wasteFactor: 10,
    paintCostCents: 5500,
    paintMarkup: 40,
    consumableMinCents: 8500,
    consumablePerSqFtCents: 5,
    minimumJobCents: 75000,
    depositPercent: 10,
    progressPercent: 40,
    finalPercent: 50,
    repairLevelCents: [5000, 7500, 10000, 12500, 15000],
    stairFlightCents: 35000,
    stairRiserCents: 1500,
    handrailLfCents: 650,
    closetBuiltInCents: 22500,
    exteriorBodyCents: 185,
    exteriorTrimCents: 350,
    exteriorFasciaCents: 450,
    exteriorSoffitCents: 225,
    exteriorGarageDoorCents: 17500,
    exteriorEntryDoorCents: 12500,
    exteriorFenceCents: 185,
    exteriorDeckCents: 275,
    storyTwoPercent: 15,
    storyThreePercent: 25,
    cabinetDoorCents: 6500,
    cabinetDrawerCents: 3500,
    cabinetBoxCents: 2500,
    cabinetIslandCents: 45000,
  }
}

export function defaultRoomScope(): RoomScope {
  return {
    walls: true,
    ceiling: true,
    baseboards: true,
    doorCasing: false,
    windowCasing: false,
    crown: false,
    doors: true,
    closet: false,
    accentWall: false,
    drywallRepair: false,
    texture: false,
    builtIns: false,
  }
}

export function createDefaultCatalog(): CatalogMaterial[] {
  return [
    {
      id: uid('matc'),
      manufacturer: 'Sherwin-Williams',
      productName: 'Emerald Interior',
      category: 'Wall Paint',
      finish: '',
      sheens: [],
      costPerGallonCents: 7500,
      coverage: 375,
      markup: 40,
      active: true,
      notes: '',
    },
    {
      id: uid('matc'),
      manufacturer: 'Sherwin-Williams',
      productName: 'Premium Ceiling',
      category: 'Ceiling Paint',
      finish: '',
      sheens: [],
      costPerGallonCents: 4800,
      coverage: 375,
      markup: 40,
      active: true,
      notes: '',
    },
    {
      id: uid('matc'),
      manufacturer: 'Sherwin-Williams',
      productName: 'Emerald Urethane',
      category: 'Trim / Cabinet',
      finish: '',
      sheens: [],
      costPerGallonCents: 8200,
      coverage: 400,
      markup: 40,
      active: true,
      notes: '',
    },
    {
      id: uid('matc'),
      manufacturer: 'Sherwin-Williams',
      productName: 'Emerald Trim',
      category: 'Trim',
      finish: '',
      sheens: [],
      costPerGallonCents: 8200,
      coverage: 400,
      markup: 40,
      active: true,
      notes: '',
    },
    {
      id: uid('matc'),
      manufacturer: 'Sherwin-Williams',
      productName: 'Primer',
      category: 'Primer',
      finish: '',
      sheens: [],
      costPerGallonCents: 3200,
      coverage: 350,
      markup: 40,
      active: true,
      notes: '',
    },
  ]
}

function blankChoice(): ColorChoice {
  return { color: '', sheen: '', productId: '', productName: '' }
}

export function emptyInteriorColors(): InteriorColors {
  return { walls: blankChoice(), ceiling: blankChoice(), trim: blankChoice(), other: '' }
}

export function emptyExteriorColors(): ExteriorColors {
  return {
    walls: blankChoice(),
    fascia: blankChoice(),
    trim: blankChoice(),
    doors: blankChoice(),
    garageDoor: blankChoice(),
    other: '',
  }
}

export function emptyCabinetColors(): CabinetColors {
  return { color: '', sheen: '', other: '', productId: '', productName: '' }
}

export function emptyColors(): EstimateColors {
  return {
    interior: emptyInteriorColors(),
    exterior: emptyExteriorColors(),
    cabinets: emptyCabinetColors(),
  }
}

function asChoice(value: unknown): ColorChoice {
  if (value && typeof value === 'object' && 'color' in value) {
    const item = value as ColorChoice
    return { color: item.color ?? '', sheen: item.sheen ?? '', productId: item.productId ?? '', productName: item.productName ?? '' }
  }
  if (typeof value === 'string') return { color: value, sheen: '', productId: '', productName: '' }
  return blankChoice()
}

export function normalizeColors(raw?: Partial<EstimateColors> & { walls?: string; ceiling?: string; trim?: string; other?: string } | null): EstimateColors {
  const empty = emptyColors()
  if (!raw) return empty
  if (raw.interior || raw.exterior || raw.cabinets) {
    return {
      interior: {
        walls: asChoice(raw.interior?.walls),
        ceiling: asChoice(raw.interior?.ceiling),
        trim: asChoice(raw.interior?.trim),
        other: raw.interior?.other ?? '',
      },
      exterior: {
        walls: asChoice(raw.exterior?.walls),
        fascia: asChoice(raw.exterior?.fascia),
        trim: asChoice(raw.exterior?.trim),
        doors: asChoice(raw.exterior?.doors),
        garageDoor: asChoice(raw.exterior?.garageDoor),
        other: raw.exterior?.other ?? '',
      },
      cabinets: {
        color: raw.cabinets?.color ?? '',
        sheen: raw.cabinets?.sheen ?? '',
        other: raw.cabinets?.other ?? '',
        productId: raw.cabinets?.productId ?? '',
        productName: raw.cabinets?.productName ?? '',
      },
    }
  }
  return {
    ...empty,
    interior: {
      walls: asChoice(raw.walls),
      ceiling: asChoice(raw.ceiling),
      trim: asChoice(raw.trim),
      other: raw.other ?? '',
    },
  }
}

export function createDefaultExterior(): ExteriorScope {
  return {
    stories: 1,
    surfaces: [
      { id: uid('exs'), kind: 'body', label: 'Body / Siding', enabled: true, unit: 'sqft', quantity: 0, rateOverrideCents: null, status: 'included' },
      { id: uid('exs'), kind: 'trim', label: 'Exterior Trim', enabled: true, unit: 'lf', quantity: 0, rateOverrideCents: null, status: 'included' },
      { id: uid('exs'), kind: 'fascia', label: 'Fascia', enabled: false, unit: 'lf', quantity: 0, rateOverrideCents: null, status: 'included' },
      { id: uid('exs'), kind: 'soffit', label: 'Soffit', enabled: false, unit: 'sqft', quantity: 0, rateOverrideCents: null, status: 'included' },
      { id: uid('exs'), kind: 'garageDoor', label: 'Garage Door', enabled: false, unit: 'qty', quantity: 1, rateOverrideCents: null, status: 'included' },
      { id: uid('exs'), kind: 'frontDoor', label: 'Exterior Doors', enabled: false, unit: 'qty', quantity: 1, rateOverrideCents: null, status: 'included' },
      { id: uid('exs'), kind: 'fence', label: 'Fence', enabled: false, unit: 'sqft', quantity: 0, rateOverrideCents: null, status: 'included' },
      { id: uid('exs'), kind: 'deck', label: 'Deck', enabled: false, unit: 'sqft', quantity: 0, rateOverrideCents: null, status: 'included' },
    ],
  }
}

export function createDefaultCabinets(rates?: PricingSnapshot): CabinetScope {
  return {
    scope: 'Kitchen cabinets',
    condition: 'Average — wear on edges and pulls',
    colorChange: 'Dark to light',
    sheen: 'Satin',
    hardware: 'Keep existing hardware',
    access: 'Kitchen empty / easy access',
    doorQty: 18,
    drawerQty: 12,
    doorPriceCents: rates?.cabinetDoorCents ?? 6500,
    drawerPriceCents: rates?.cabinetDrawerCents ?? 3500,
    boxes: false,
    island: false,
  }
}

export function withScopeRates(rates: PricingSnapshot): PricingSnapshot {
  return {
    ...rates,
    exteriorBodyCents: rates.exteriorBodyCents ?? 185,
    exteriorTrimCents: rates.exteriorTrimCents ?? 350,
    exteriorFasciaCents: rates.exteriorFasciaCents ?? 450,
    exteriorSoffitCents: rates.exteriorSoffitCents ?? 225,
    exteriorGarageDoorCents: rates.exteriorGarageDoorCents ?? 17500,
    exteriorEntryDoorCents: rates.exteriorEntryDoorCents ?? 12500,
    exteriorFenceCents: rates.exteriorFenceCents ?? 185,
    exteriorDeckCents: rates.exteriorDeckCents ?? 275,
    storyTwoPercent: rates.storyTwoPercent ?? 15,
    storyThreePercent: rates.storyThreePercent ?? 25,
    cabinetDoorCents: rates.cabinetDoorCents ?? 6500,
    cabinetDrawerCents: rates.cabinetDrawerCents ?? 3500,
    cabinetBoxCents: rates.cabinetBoxCents ?? 2500,
    cabinetIslandCents: rates.cabinetIslandCents ?? 45000,
  }
}

export function createDefaultBusinessSettings(): BusinessSalesSettings {
  return {
    documentTerm: 'Estimate',
    companyName: 'Bayline Painting',
    ownerName: 'Manuel',
    terms:
      'Pricing is tax-included. Booking deposit reserves the schedule. Progress payment is due one week before start. Balance is due upon completion. Minor drywall touch-ups are included. Additional repairs, texture, and specialty finishes are extra unless listed.',
  }
}
