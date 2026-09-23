import { uid } from '@/lib/format'
import type { MaterialGroup } from '@/types'

export function createDefaultMaterialGroups(): MaterialGroup[] {
  const now = new Date().toISOString()
  return [
    {
      id: uid('mat'),
      name: 'High End',
      tier: 'high',
      description: 'Conversion-grade catalyzed systems. Best for custom kitchens and high-end remodels.',
      doorPrice: 85,
      drawerPrice: 45,
      createdAt: now,
      items: [
        { id: uid('item'), name: 'Renner conversion varnish', brand: 'Renner', notes: 'Premium catalyzed topcoat' },
        { id: uid('item'), name: 'Renner primer / isolante', brand: 'Renner', notes: 'For stain-to-paint and tannin-rich woods' },
        { id: uid('item'), name: 'Renner white lacquer', brand: 'Renner', notes: 'Kitchen and vanity spray finish' },
      ],
    },
    {
      id: uid('mat'),
      name: 'Mid',
      tier: 'mid',
      description: 'Sherwin-Williams cabinet systems. Strong durability at a mid-market price.',
      doorPrice: 65,
      drawerPrice: 35,
      createdAt: now,
      items: [
        { id: uid('item'), name: 'Emerald Urethane Trim Enamel', brand: 'Sherwin-Williams', notes: 'Doors, drawers, and trim' },
        { id: uid('item'), name: 'Extreme Bond Primer', brand: 'Sherwin-Williams', notes: 'Factory finish and laminate' },
        { id: uid('item'), name: 'ProClassic Interior Acrylic', brand: 'Sherwin-Williams', notes: 'Spray or brush cabinet finish' },
      ],
    },
    {
      id: uid('mat'),
      name: 'Value',
      tier: 'low',
      description: 'Budget-friendly cabinet refresh. Good for rentals and lighter-use spaces.',
      doorPrice: 50,
      drawerPrice: 28,
      createdAt: now,
      items: [
        { id: uid('item'), name: 'Cabinet & Trim enamel', brand: 'Behr', notes: 'Interior cabinet enamel' },
        { id: uid('item'), name: 'Bonding primer', brand: 'Kilz', notes: 'Adhesion on sealed factory finishes' },
        { id: uid('item'), name: 'Interior latex enamel', brand: 'Benjamin Moore Advance alt.', notes: 'Value-tier brush/roll option' },
      ],
    },
  ]
}

export const QUOTE_SCOPES = [
  'Kitchen cabinets',
  'Kitchen + island',
  'Bathroom vanities',
  'Laundry / mudroom',
  'Whole-house cabinets',
  'Doors only',
  'Drawers only',
]

export const QUOTE_CONDITIONS = [
  'Good — light scuffs only',
  'Average — wear on edges and pulls',
  'Worn — peeling, chips, or grease',
  'Needs repair before paint',
]

export const QUOTE_COLOR_CHANGES = [
  'Same color refresh',
  'Light to light',
  'Dark to light',
  'Light to dark',
  'Stain to paint',
  'Paint to stain-look',
]

export const QUOTE_SHEENS = ['Satin', 'Semi-gloss', 'Gloss', 'Matte / velvet']

export const QUOTE_HARDWARE = [
  'Keep existing hardware',
  'Paint around hardware',
  'Remove and reinstall',
  'Client supplying new hardware',
  'We supply and install hardware',
]

export const QUOTE_TIMELINES = [
  'ASAP this week',
  'Next 2 weeks',
  'This month',
  'Flexible / 30+ days',
]

export const QUOTE_ACCESS = [
  'Kitchen empty / easy access',
  'Occupied — evenings preferred',
  'Occupied — daytime OK',
  'Rental turnover — vacant',
]
