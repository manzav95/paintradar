import { createDefaultCabinets, createDefaultExterior, DEFAULT_REPAIR_LEVEL_CENTS, normalizeColors, withScopeRates } from '@/data/pricingDefaults'
import { normalizeLegacyPercent } from '@/lib/money'
import {
  HEIGHT_PRESETS,
  type BusinessSalesSettings,
  type CatalogMaterial,
  type Customer,
  type Estimate,
  type EstimateAddon,
  type EstimateRoom,
  type ChangeOrder,
  type Invoice,
  type PaymentRecord,
  type PricingSnapshot,
} from '@/types/sales'

export const SALES_STORAGE_KEY = 'paintradar.sales.v1'

export interface SalesState {
  customers: Customer[]
  estimates: Estimate[]
  invoices: Invoice[]
  changeOrders: ChangeOrder[]
  payments: PaymentRecord[]
  pricing: PricingSnapshot
  catalog: CatalogMaterial[]
  business: BusinessSalesSettings
}

export function loadSalesState(): SalesState | null {
  try {
    const raw = localStorage.getItem(SALES_STORAGE_KEY)
    if (!raw) return null
    return normalizeSalesState(JSON.parse(raw) as SalesState)
  } catch {
    return null
  }
}

export function saveSalesState(state: SalesState) {
  localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(state))
}

function normalizeRepairLevels(rates: PricingSnapshot): [number, number, number, number, number] {
  const incoming = rates.repairLevelCents ?? []
  return [
    incoming[0] ?? DEFAULT_REPAIR_LEVEL_CENTS[0],
    incoming[1] ?? DEFAULT_REPAIR_LEVEL_CENTS[1],
    incoming[2] ?? DEFAULT_REPAIR_LEVEL_CENTS[2],
    incoming[3] ?? DEFAULT_REPAIR_LEVEL_CENTS[3],
    incoming[4] ?? DEFAULT_REPAIR_LEVEL_CENTS[4],
  ]
}

function normalizeRoom(room: EstimateRoom): EstimateRoom {
  const presetHeights = HEIGHT_PRESETS as readonly number[]
  return {
    ...room,
    heightMode: room.heightMode === 'vaulted' ? (presetHeights.includes(room.heightFt) ? 'preset' : 'custom') : (room.heightMode ?? (presetHeights.includes(room.heightFt) ? 'preset' : 'custom')),
    vaultedCeiling: room.vaultedCeiling ?? room.heightMode === 'vaulted',
    peakHeightFt: room.peakHeightFt ?? null,
    vaultRidge: room.vaultRidge ?? 'length',
    drywallRepairLevel: room.drywallRepairLevel ?? null,
    textureLevel: room.textureLevel ?? null,
    colorOverride: room.colorOverride ?? '',
  }
}

function normalizeAddon(addon: EstimateAddon): EstimateAddon {
  return {
    ...addon,
    paintRisers: addon.paintRisers ?? false,
    riserQty: addon.riserQty ?? 0,
    handrailLf: addon.handrailLf ?? 0,
  }
}

function normalizeRates(rates: PricingSnapshot): PricingSnapshot {
  return {
    ...rates,
    wasteFactor: normalizeLegacyPercent(rates.wasteFactor),
    paintMarkup: normalizeLegacyPercent(rates.paintMarkup),
    repairLevelCents: normalizeRepairLevels(rates),
    stairFlightCents: rates.stairFlightCents ?? 35000,
    stairRiserCents: rates.stairRiserCents ?? 1500,
    handrailLfCents: rates.handrailLfCents ?? 650,
    closetBuiltInCents: rates.closetBuiltInCents ?? 22500,
    ...withScopeRates(rates),
  }
}

export function normalizeSalesState(state: SalesState): SalesState {
  return {
    ...state,
    pricing: normalizeRates(state.pricing),
    catalog: state.catalog.map((item) => {
      const sheens = [...(item.sheens ?? [])]
      const bundled = ['Eggshell,Satin,Semi-Gloss', 'Flat,Eggshell,Satin,Semi-Gloss', 'Flat,Matte', 'Satin,Semi-Gloss,Gloss']
      const cleared = bundled.includes(sheens.join(',')) ? [] : sheens
      return {
        ...item,
        sheens: cleared,
        finish: cleared.includes(item.finish) ? item.finish : '',
        markup: normalizeLegacyPercent(item.markup),
      }
    }),
    estimates: state.estimates.map((item) => ({
      ...item,
      jobName: item.jobName ?? '',
      rates: normalizeRates(item.rates),
      rooms: item.rooms.map(normalizeRoom),
      addons: (item.addons ?? []).map(normalizeAddon),
      exterior: item.exterior ?? (item.type === 'exterior' || item.type === 'mixed' ? createDefaultExterior() : null),
      cabinets: item.cabinets ?? (item.type === 'cabinets' || item.type === 'mixed' ? createDefaultCabinets(item.rates) : null),
      colors: normalizeColors(item.colors),
    })),
    invoices: state.invoices.map((item) => ({
      ...item,
      jobName: item.jobName ?? '',
      rates: normalizeRates(item.rates),
      rooms: item.rooms.map(normalizeRoom),
      addons: (item.addons ?? []).map(normalizeAddon),
      exterior: item.exterior ?? null,
      cabinets: item.cabinets ?? null,
      colors: normalizeColors(item.colors),
      kind: item.kind ?? 'original',
      parentInvoiceId: item.parentInvoiceId ?? null,
      changeOrderId: item.changeOrderId ?? null,
      lineItems: item.lineItems ?? [],
    })),
    changeOrders: state.changeOrders ?? [],
  }
}
