import type { LeadQuote, MaterialGroup } from '@/types'

export function calculateQuote(input: {
  doorQty: number
  drawerQty: number
  doorPrice: number
  drawerPrice: number
}): number {
  const doors = Math.max(0, input.doorQty) * Math.max(0, input.doorPrice)
  const drawers = Math.max(0, input.drawerQty) * Math.max(0, input.drawerPrice)
  return Math.round(doors + drawers)
}

export function quoteRange(total: number) {
  return {
    low: Math.round(total * 0.92),
    high: Math.round(total * 1.12),
  }
}

export function applyGroupPricing(group: MaterialGroup | undefined, current: { doorPrice: number; drawerPrice: number }) {
  if (!group) return current
  return { doorPrice: group.doorPrice, drawerPrice: group.drawerPrice }
}

export function describeQuote(quote: LeadQuote) {
  return [
    `${quote.scope}`,
    `${quote.doorQty} doors @ $${quote.doorPrice}`,
    `${quote.drawerQty} drawers @ $${quote.drawerPrice}`,
    quote.materialGroupName ? `Material: ${quote.materialGroupName}` : null,
    quote.colorChange,
    quote.timeline,
  ]
    .filter(Boolean)
    .join(' · ')
}
