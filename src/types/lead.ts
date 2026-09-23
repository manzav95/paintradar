export const PIPELINE_SOURCES = [
  'manual',
  'demo',
  'reddit',
  'web_search',
  'email',
  'nextdoor',
  'facebook',
  'craigslist',
  'webhook',
] as const

export type PipelineSource = (typeof PIPELINE_SOURCES)[number]

export const PIPELINE_CATEGORIES = [
  'Interior Painting',
  'Exterior Painting',
  'Cabinet Painting',
  'Trim / Doors',
  'Deck / Fence',
  'Drywall / Patch + Paint',
  'Commercial Painting',
  'Rental Turnover',
  'Other Painting',
] as const

export type PipelineCategory = (typeof PIPELINE_CATEGORIES)[number]

export const PIPELINE_INTENTS = [
  'requesting_quote',
  'looking_for_recommendation',
  'ready_to_hire',
  'planning',
  'unknown',
] as const

export type PipelineIntent = (typeof PIPELINE_INTENTS)[number]

export const PIPELINE_URGENCY = ['low', 'medium', 'high', 'urgent'] as const
export type PipelineUrgency = (typeof PIPELINE_URGENCY)[number]

export interface RawLead {
  source: string
  sourcePostId?: string
  sourceUrl?: string
  author?: string
  title?: string
  content: string
  city?: string
  state?: string
  postedAt?: string
  imageUrls?: string[]
}

export interface NormalizedLead {
  source: string
  sourcePostId: string | null
  sourceUrl: string | null
  author: string
  title: string
  content: string
  city: string | null
  state: string
  postedAt: string
  imageUrls: string[]
}

export interface LeadClassification {
  isLead: boolean
  confidence: number
  category: PipelineCategory
  urgency: PipelineUrgency
  intent: PipelineIntent
  estimatedValueLow: number
  estimatedValueHigh: number
  keywords: string[]
  reasoningSummary: string
}

export interface LeadSourceProvider {
  name: string
  fetchLeads(): Promise<RawLead[]>
}

export type RejectReason =
  | 'not_a_lead'
  | 'low_confidence'
  | 'outside_radius'
  | 'duplicate'
  | 'below_score'

export interface ProcessContext {
  home: { city: string; state: string; latitude: number; longitude: number }
  radiusMiles: number
  minimumConfidence: number
  minimumScore: number
  existing: Array<{
    source: string
    sourcePostId: string | null
    sourceUrl: string | null
    title: string
    description: string
  }>
  allowDuplicate?: boolean
}

export interface ProcessedLead {
  id: string
  source: string
  sourcePostId: string | null
  sourceUrl: string | null
  customerName: string
  title: string
  rawText: string
  description: string
  city: string
  state: string
  latitude: number
  longitude: number
  distanceMiles: number
  category: PipelineCategory
  urgency: PipelineUrgency
  intent: PipelineIntent
  confidence: number
  estimatedValueLow: number
  estimatedValueHigh: number
  score: number
  keywords: string[]
  hasPhotos: boolean
  imageUrls: string[]
  postedAt: string
  detectedAt: string
  reasoningSummary: string
}

export interface ProcessResult {
  accepted: boolean
  reason?: RejectReason
  classification: LeadClassification
  normalized: NormalizedLead
  distanceMiles: number | null
  score: number | null
  lead?: ProcessedLead
  log: string
}

export interface ScanReport {
  postsChecked: number
  possibleLeads: number
  qualifiedLeads: number
  duplicates: number
  outsideRadius: number
  rejected: number
  errors: string[]
  sources: SourceScanStat[]
  leads: ProcessedLead[]
  scannedAt: string
}

export type SourceRuntimeStatus = 'Healthy' | 'Warning' | 'Offline' | 'Not Configured' | 'Adapter Ready'

export interface SourceScanStat {
  name: string
  status: SourceRuntimeStatus
  lastScan: string | null
  postsChecked: number
  qualifiedLeads: number
  error?: string
}
