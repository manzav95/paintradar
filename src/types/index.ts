export const PROJECT_CATEGORIES = [
  'interior',
  'exterior',
  'cabinets',
  'trim',
  'doors',
  'fence_deck',
  'drywall',
  'ceiling',
  'rental_turnover',
  'commercial',
  'other',
] as const

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]

export const URGENCY_LEVELS = ['hot', 'urgent', 'new', 'normal'] as const
export type Urgency = (typeof URGENCY_LEVELS)[number]

export const LEAD_STATUSES = [
  'new',
  'contacted',
  'estimate_scheduled',
  'estimate_sent',
  'won',
  'lost',
  'dismissed',
] as const
export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const LEAD_SOURCES = [
  'nextdoor',
  'manual',
  'demo',
  'facebook',
  'craigslist',
  'webhook',
  'reddit',
  'web_search',
  'email',
] as const
export type LeadSourceName = (typeof LEAD_SOURCES)[number]

export const RADIUS_OPTIONS = [10, 25, 50, 75, 100] as const
export type RadiusOption = (typeof RADIUS_OPTIONS)[number]

export interface LeadPhoto {
  id: string
  leadId: string
  imageUrl: string
  createdAt: string
}

export interface LeadNote {
  id: string
  leadId: string
  note: string
  createdAt: string
}

export interface LeadActivity {
  id: string
  leadId: string | null
  action: string
  metadata?: Record<string, string | number | boolean | null>
  createdAt: string
}

export const MATERIAL_TIERS = ['high', 'mid', 'low', 'custom'] as const
export type MaterialTier = (typeof MATERIAL_TIERS)[number]

export interface MaterialItem {
  id: string
  name: string
  brand: string
  notes: string
}

export interface MaterialGroup {
  id: string
  name: string
  tier: MaterialTier
  description: string
  doorPrice: number
  drawerPrice: number
  items: MaterialItem[]
  createdAt: string
}

export interface LeadQuote {
  doorQty: number
  drawerQty: number
  doorPrice: number
  drawerPrice: number
  materialGroupId: string | null
  materialGroupName: string
  scope: string
  condition: string
  colorChange: string
  sheen: string
  hardware: string
  timeline: string
  access: string
  laborTotal: number
}

export interface Lead {
  id: string
  source: LeadSourceName
  sourcePostId: string | null
  customerName: string
  title: string
  description: string
  city: string
  state: string
  latitude: number
  longitude: number
  distanceMiles: number
  category: ProjectCategory
  urgency: Urgency
  postedAt: string
  detectedAt: string
  estimatedValueLow: number
  estimatedValueHigh: number
  score: number
  confidence: number
  status: LeadStatus
  sourceUrl: string | null
  hasPhotos: boolean
  photos: LeadPhoto[]
  keywords: string[]
  phone?: string
  email?: string
  quote?: LeadQuote
  rawText?: string
  intent?: string
  saved: boolean
  followUpAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface RawLead {
  source: LeadSourceName
  sourcePostId?: string | null
  customerName: string
  title: string
  description: string
  city: string
  state?: string
  latitude?: number
  longitude?: number
  category?: ProjectCategory
  urgency?: Urgency
  postedAt?: string
  estimatedValueLow?: number
  estimatedValueHigh?: number
  sourceUrl?: string | null
  photoUrls?: string[]
  phone?: string
  email?: string
}

export interface ScoringWeights {
  recency: number
  distance: number
  urgency: number
  projectValue: number
  keywordMatch: number
}

export interface NotificationPreferences {
  newLead: boolean
  hotLead: boolean
  scoreAbove: number
  scoreAboveEnabled: boolean
  withinMiles: number
  withinMilesEnabled: boolean
  cabinetJob: boolean
  interiorJob: boolean
  exteriorJob: boolean
  highValueJob: boolean
  highValueThreshold: number
  inApp: boolean
  email: boolean
  sms: boolean
}

export interface AppSettings {
  id: string
  ownerName: string
  companyName: string
  homeCity: string
  homeState: string
  latitude: number
  longitude: number
  defaultRadius: RadiusOption
  categories: ProjectCategory[]
  scoringWeights: ScoringWeights
  notificationPreferences: NotificationPreferences
  theme: 'dark'
  onboarded: boolean
  minimumLeadScore: number
  createdAt: string
}

export interface SavedSearch {
  id: string
  name: string
  radius: number
  keywords: string[]
  excludedKeywords: string[]
  categories: ProjectCategory[]
  minimumScore: number
  enabled: boolean
  notificationEnabled: boolean
  createdAt: string
}

export interface AppNotification {
  id: string
  title: string
  body: string
  leadId?: string
  tone: 'hot' | 'info' | 'success' | 'urgent'
  read: boolean
  createdAt: string
}

export interface ToastMessage {
  id: string
  title: string
  description?: string
  tone: 'hot' | 'info' | 'success' | 'urgent'
}

export interface ScanStatus {
  scanning: boolean
  lastScanAt: string | null
  nextScanAt: string | null
  lastSource: string | null
}

export interface LeadFilters {
  query: string
  categories: ProjectCategory[]
  maxDistance: number | null
  datePosted: 'any' | '1h' | '24h' | '7d' | '30d'
  minScore: number
  urgency: Urgency[]
  sources: LeadSourceName[]
  minValue: number | null
  city: string
  hasPhotos: boolean | null
  sort: 'newest' | 'closest' | 'highest_score' | 'highest_value' | 'most_urgent'
}

export interface LeadIntelligence {
  projectCategory: string
  likelyJobSize: string
  urgency: string
  likelyBudget: string
  travelDistance: string
  keywords: string[]
  quality: string
  suggestedResponse: string
  recommendedAction: string
  reason: string
}

export interface City {
  name: string
  state: string
  latitude: number
  longitude: number
}

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  interior: 'Interior Painting',
  exterior: 'Exterior Painting',
  cabinets: 'Cabinet Painting',
  trim: 'Trim / Baseboard',
  doors: 'Door Painting',
  fence_deck: 'Fence / Deck',
  drywall: 'Drywall / Patch',
  ceiling: 'Ceiling Painting',
  rental_turnover: 'Rental Turnover',
  commercial: 'Commercial Painting',
  other: 'Other Painting',
}

export const SOURCE_LABELS: Record<LeadSourceName, string> = {
  nextdoor: 'Nextdoor',
  manual: 'Manual',
  demo: 'Demo Feed',
  facebook: 'Facebook',
  craigslist: 'Craigslist',
  webhook: 'Webhook',
  reddit: 'Reddit',
  web_search: 'Web Search',
  email: 'Email',
}

export const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  estimate_scheduled: 'Estimate Scheduled',
  estimate_sent: 'Estimate Sent',
  won: 'Won',
  lost: 'Lost',
  dismissed: 'Dismissed',
}

export const URGENCY_LABELS: Record<Urgency, string> = {
  hot: 'HOT',
  urgent: 'URGENT',
  new: 'NEW',
  normal: 'NORMAL',
}

export const TIER_LABELS: Record<MaterialTier, string> = {
  high: 'High end',
  mid: 'Mid',
  low: 'Value',
  custom: 'Custom',
}
