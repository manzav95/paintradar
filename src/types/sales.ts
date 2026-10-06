export const ROOM_PRESETS = [
  'Living Room',
  'Family Room',
  'Kitchen',
  'Dining Room',
  'Bedroom',
  'Master Bedroom',
  'Bathroom',
  'Master Bathroom',
  'Hallway',
  'Laundry Room',
  'Office',
  'Entry',
  'Garage',
  'Closet',
  'Walk-In Closet',
  'Other',
] as const

export type RoomPreset = (typeof ROOM_PRESETS)[number]

export const ESTIMATE_TYPES = ['interior', 'exterior', 'cabinets', 'mixed'] as const
export type EstimateType = (typeof ESTIMATE_TYPES)[number]

export const ESTIMATE_TYPE_LABELS: Record<EstimateType, string> = {
  interior: 'Interior',
  exterior: 'Exterior',
  cabinets: 'Cabinets',
  mixed: 'Mixed Project',
}

export const EXTERIOR_SURFACE_KINDS = ['body', 'trim', 'fascia', 'soffit', 'garageDoor', 'frontDoor', 'fence', 'deck'] as const
export type ExteriorSurfaceKind = (typeof EXTERIOR_SURFACE_KINDS)[number]

export const EXTERIOR_UNITS = ['sqft', 'lf', 'qty'] as const
export type ExteriorUnit = (typeof EXTERIOR_UNITS)[number]

export interface ExteriorSurface {
  id: string
  kind: ExteriorSurfaceKind
  label: string
  enabled: boolean
  unit: ExteriorUnit
  quantity: number
  rateOverrideCents: number | null
  status: ScopeStatus
}

export interface ExteriorScope {
  stories: 1 | 2 | 3
  surfaces: ExteriorSurface[]
}

export interface CabinetScope {
  scope: string
  condition: string
  colorChange: string
  sheen: string
  hardware: string
  access: string
  doorQty: number
  drawerQty: number
  doorPriceCents: number
  drawerPriceCents: number
  boxes: boolean
  island: boolean
}

export const ESTIMATE_STATUSES = [
  'draft',
  'sent',
  'viewed',
  'accepted',
  'declined',
  'expired',
  'converted',
] as const
export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number]

export const INVOICE_STATUSES = ['draft', 'sent', 'partial', 'paid', 'overdue', 'void'] as const
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]

export const SCOPE_STATUSES = ['included', 'optional', 'excluded'] as const
export type ScopeStatus = (typeof SCOPE_STATUSES)[number]

export const PRICING_MODES = ['combined', 'separate'] as const
export type PricingMode = (typeof PRICING_MODES)[number]

export const DOOR_TYPES = ['interior', 'bifold', 'exterior'] as const
export type DoorType = (typeof DOOR_TYPES)[number]

export const PAYMENT_KINDS = ['booking', 'progress', 'final', 'custom'] as const
export type PaymentKind = (typeof PAYMENT_KINDS)[number]

export const PAYMENT_KIND_LABELS: Record<PaymentKind, string> = {
  booking: 'Booking',
  progress: 'Progress',
  final: 'Final',
  custom: 'Custom',
}

export const DOCUMENT_TERMS = ['Estimate', 'Quote', 'Proposal'] as const
export type DocumentTerm = (typeof DOCUMENT_TERMS)[number]

export const REPAIR_LEVELS = [1, 2, 3, 4, 5] as const
export type RepairLevel = (typeof REPAIR_LEVELS)[number]

export const HEIGHT_PRESETS = [8, 9, 10, 12] as const
export const HEIGHT_MODES = ['preset', 'custom', 'vaulted'] as const
export type HeightMode = (typeof HEIGHT_MODES)[number]
export const VAULT_RIDGES = ['length', 'width'] as const
export type VaultRidge = (typeof VAULT_RIDGES)[number]

export const ADDON_KINDS = ['extraDoors', 'staircase', 'closetBuiltIns'] as const
export type AddonKind = (typeof ADDON_KINDS)[number]

export const ADDON_LABELS: Record<AddonKind, string> = {
  extraDoors: 'Extra Doors',
  staircase: 'Staircase',
  closetBuiltIns: 'Closet with Built-Ins',
}

export interface EstimateAddon {
  id: string
  kind: AddonKind
  label: string
  quantity: number
  doorType: DoorType
  paintRisers: boolean
  riserQty: number
  handrailLf: number
  rateOverrideCents: number | null
  status: ScopeStatus
}

export interface RoomScope {
  walls: boolean
  ceiling: boolean
  baseboards: boolean
  doorCasing: boolean
  windowCasing: boolean
  crown: boolean
  doors: boolean
  closet: boolean
  accentWall: boolean
  drywallRepair: boolean
  texture: boolean
  builtIns: boolean
}

export interface RoomDoor {
  id: string
  type: DoorType
  quantity: number
  rateOverrideCents: number | null
}

export interface EstimateRoom {
  id: string
  label: string
  preset: RoomPreset
  lengthFt: number
  widthFt: number
  heightFt: number
  heightMode: HeightMode
  vaultedCeiling: boolean
  peakHeightFt: number | null
  vaultRidge: VaultRidge
  subtractOpenings: boolean
  openingsSqFt: number
  scope: RoomScope
  baseboardLf: number | null
  doorCasingLf: number
  windowCasingLf: number
  crownLf: number | null
  doors: RoomDoor[]
  coatsWalls: 2 | 3
  coatsCeiling: 2 | 3
  coatsTrim: 2 | 3
  drywallRepairLevel: RepairLevel | null
  textureLevel: RepairLevel | null
  colorOverride: string
  status: ScopeStatus
}

export interface ColorChoice {
  color: string
  sheen: string
  productId: string
  productName: string
}

export interface InteriorColors {
  walls: ColorChoice
  ceiling: ColorChoice
  trim: ColorChoice
  other: string
}

export interface ExteriorColors {
  walls: ColorChoice
  fascia: ColorChoice
  trim: ColorChoice
  doors: ColorChoice
  garageDoor: ColorChoice
  other: string
}

export interface CabinetColors {
  color: string
  sheen: string
  other: string
  productId: string
  productName: string
}

export interface EstimateColors {
  interior: InteriorColors
  exterior: ExteriorColors
  cabinets: CabinetColors
}

export interface EstimateDiscount {
  label: string
  kind: 'flat' | 'percent' | 'referral' | 'promo' | 'custom'
  value: number
}

export interface PaymentScheduleItem {
  id: string
  kind: PaymentKind
  label: string
  percent: number
  amountCents: number
  dueLabel: string
}

export interface PricingSnapshot {
  pricingMode: PricingMode
  combinedRateCents: number
  wallRateCents: number
  ceilingRateCents: number
  trimLfCents: number
  crownLfCents: number
  interiorDoorCents: number
  bifoldDoorCents: number
  exteriorDoorCents: number
  extraColorCents: number
  includedColors: number
  wallCoverage: number
  ceilingCoverage: number
  trimCoverage: number
  wasteFactor: number
  paintCostCents: number
  paintMarkup: number
  consumableMinCents: number
  consumablePerSqFtCents: number
  minimumJobCents: number
  depositPercent: number
  progressPercent: number
  finalPercent: number
  repairLevelCents: [number, number, number, number, number]
  stairFlightCents: number
  stairRiserCents: number
  handrailLfCents: number
  closetBuiltInCents: number
  exteriorBodyCents: number
  exteriorTrimCents: number
  exteriorFasciaCents: number
  exteriorSoffitCents: number
  exteriorGarageDoorCents: number
  exteriorEntryDoorCents: number
  exteriorFenceCents: number
  exteriorDeckCents: number
  storyTwoPercent: number
  storyThreePercent: number
  cabinetDoorCents: number
  cabinetDrawerCents: number
  cabinetBoxCents: number
  cabinetIslandCents: number
}

export interface RoomMath {
  floorSqFt: number
  ceilingSqFt: number
  perimeterLf: number
  wallSqFt: number
  surfaceSqFt: number
  baseboardLf: number
  crownLf: number
  doorCasingLf: number
  windowCasingLf: number
}

export interface RoomPricing {
  surfaceCents: number
  trimCents: number
  crownCents: number
  doorsCents: number
  drywallCents: number
  textureCents: number
  totalCents: number
  paintGallons: number
}

export interface EstimateTotals {
  laborCents: number
  paintMaterialCents: number
  prepMaterialCents: number
  extrasCents: number
  discountCents: number
  subtotalCents: number
  totalCents: number
  wallSqFt: number
  ceilingSqFt: number
  surfaceSqFt: number
  trimLf: number
  wallGallons: number
  ceilingGallons: number
  trimGallons: number
  recommendedGallons: number
  wallNeedGal: number
  ceilingNeedGal: number
  trimNeedGal: number
  primerNeedGal: number
  paintNeedGal: number
  paintLineGal: number
  belowMinimum: boolean
}

export interface EstimateSignature {
  imageData: string
  printedName: string
  signedAt: string
  acceptedAmountCents: number
}

export interface Customer {
  id: string
  firstName: string
  lastName: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  zip: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface Estimate {
  id: string
  number: string
  type: EstimateType
  status: EstimateStatus
  customerId: string
  jobName: string
  projectAddress: string
  projectCity: string
  projectState: string
  projectZip: string
  notes: string
  extraColors: number
  waiveColorFee: boolean
  colors: EstimateColors
  discount: EstimateDiscount
  rooms: EstimateRoom[]
  addons: EstimateAddon[]
  exterior: ExteriorScope | null
  cabinets: CabinetScope | null
  rates: PricingSnapshot
  clientView: 'bundled' | 'detailed'
  fieldMode: boolean
  signature: EstimateSignature | null
  invoiceId: string | null
  createdAt: string
  updatedAt: string
}

export interface InvoiceLineItem {
  id: string
  label: string
  detail: string
  amountCents: number
}

export interface Invoice {
  id: string
  number: string
  estimateId: string
  customerId: string
  status: InvoiceStatus
  kind: 'original' | 'change_order'
  parentInvoiceId: string | null
  changeOrderId: string | null
  jobName: string
  projectAddress: string
  rooms: EstimateRoom[]
  addons: EstimateAddon[]
  exterior: ExteriorScope | null
  cabinets: CabinetScope | null
  rates: PricingSnapshot
  extraColors: number
  waiveColorFee: boolean
  colors: EstimateColors
  discount: EstimateDiscount
  lineItems: InvoiceLineItem[]
  notes: string
  signature: EstimateSignature | null
  createdAt: string
  updatedAt: string
}

export const CHANGE_ORDER_LINE_KINDS = ['flat', 'room', 'addon', 'material'] as const
export type ChangeOrderLineKind = (typeof CHANGE_ORDER_LINE_KINDS)[number]

export const CHANGE_ORDER_LINE_LABELS: Record<ChangeOrderLineKind, string> = {
  flat: 'Flat Rate',
  room: 'Room',
  addon: 'Add-on',
  material: 'Material',
}

export interface ChangeOrderLine {
  id: string
  kind: ChangeOrderLineKind
  label: string
  detail: string
  amountCents: number
}

export interface ChangeOrder {
  id: string
  number: string
  estimateId: string
  parentInvoiceId: string | null
  invoiceId: string | null
  customerId: string
  title: string
  notes: string
  lines: ChangeOrderLine[]
  createdAt: string
  updatedAt: string
}

export interface PaymentRecord {
  id: string
  invoiceId: string
  kind: PaymentKind
  label: string
  amountDueCents: number
  amountPaidCents: number
  dueDate: string
  paidAt: string | null
  method: string
  notes: string
}

export const PAINT_SHEENS = [
  'Flat',
  'Matte',
  'Eggshell',
  'Satin',
  'Semi-Gloss',
  'Gloss',
  'High Gloss',
] as const

export type PaintSheen = (typeof PAINT_SHEENS)[number]

export interface CatalogMaterial {
  id: string
  manufacturer: string
  productName: string
  category: string
  finish: string
  sheens: string[]
  costPerGallonCents: number
  coverage: number
  markup: number
  active: boolean
  notes: string
}

export interface BusinessSalesSettings {
  documentTerm: DocumentTerm
  companyName: string
  ownerName: string
  terms: string
}

export const ESTIMATE_STATUS_LABELS: Record<EstimateStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
  converted: 'Converted',
}

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  partial: 'Partial',
  paid: 'Paid',
  overdue: 'Overdue',
  void: 'Void',
}

export const DOOR_LABELS: Record<DoorType, string> = {
  interior: 'Interior Door',
  bifold: 'Bifold / Shutter',
  exterior: 'Exterior Door',
}
