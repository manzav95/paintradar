import { newLeadId } from '@/lib/format'
import type { Lead, LeadSourceName, ProjectCategory, Urgency } from '@/types'
import type { PipelineCategory, PipelineUrgency, ProcessedLead } from '@/types/lead'

const CATEGORY_MAP: Record<PipelineCategory, ProjectCategory> = {
  'Interior Painting': 'interior',
  'Exterior Painting': 'exterior',
  'Cabinet Painting': 'cabinets',
  'Trim / Doors': 'trim',
  'Deck / Fence': 'fence_deck',
  'Drywall / Patch + Paint': 'drywall',
  'Commercial Painting': 'commercial',
  'Rental Turnover': 'rental_turnover',
  'Other Painting': 'other',
}

const URGENCY_MAP: Record<PipelineUrgency, Urgency> = {
  low: 'normal',
  medium: 'new',
  high: 'urgent',
  urgent: 'hot',
}

const SOURCES: LeadSourceName[] = [
  'nextdoor',
  'manual',
  'demo',
  'facebook',
  'craigslist',
  'webhook',
  'reddit',
  'web_search',
  'email',
]

function mapCategory(category: string): ProjectCategory {
  if (category in CATEGORY_MAP) return CATEGORY_MAP[category as PipelineCategory]
  const values = Object.values(CATEGORY_MAP)
  if (values.includes(category as ProjectCategory)) return category as ProjectCategory
  return 'other'
}

export function toDashboardLead(processed: ProcessedLead): Lead {
  const source = SOURCES.includes(processed.source as LeadSourceName)
    ? (processed.source as LeadSourceName)
    : 'manual'
  const now = processed.detectedAt

  return {
    id: processed.id,
    source,
    sourcePostId: processed.sourcePostId,
    customerName: processed.customerName,
    title: processed.title,
    description: processed.description,
    city: processed.city,
    state: processed.state,
    latitude: processed.latitude,
    longitude: processed.longitude,
    distanceMiles: processed.distanceMiles,
    category: mapCategory(processed.category),
    urgency: URGENCY_MAP[processed.urgency] ?? (['hot', 'urgent', 'new', 'normal'].includes(processed.urgency)
      ? (processed.urgency as Urgency)
      : 'new'),
    postedAt: processed.postedAt,
    detectedAt: processed.detectedAt,
    estimatedValueLow: processed.estimatedValueLow,
    estimatedValueHigh: processed.estimatedValueHigh,
    score: processed.score,
    confidence: Math.round(processed.confidence * 100),
    status: 'new',
    sourceUrl: processed.sourceUrl,
    hasPhotos: processed.hasPhotos,
    photos: processed.imageUrls.map((imageUrl) => ({
      id: newLeadId(),
      leadId: processed.id,
      imageUrl,
      createdAt: now,
    })),
    keywords: processed.keywords,
    rawText: processed.rawText,
    intent: processed.intent,
    saved: false,
    followUpAt: null,
    createdAt: now,
    updatedAt: now,
  }
}
