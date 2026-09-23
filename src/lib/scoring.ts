import type {
  Lead,
  LeadIntelligence,
  ProjectCategory,
  RawLead,
  ScoringWeights,
  Urgency,
} from '@/types'
import { CATEGORY_LABELS } from '@/types'
import { formatMiles, formatValueRange, haversineMiles, timeAgo, uid } from '@/lib/format'
import { findCity } from '@/data/cities'

export const DEFAULT_WEIGHTS: ScoringWeights = {
  recency: 30,
  distance: 25,
  urgency: 20,
  projectValue: 15,
  keywordMatch: 10,
}

const PAINT_KEYWORDS = [
  'paint',
  'painter',
  'painting',
  'repaint',
  'cabinet',
  'cabinets',
  'interior',
  'exterior',
  'trim',
  'baseboard',
  'door',
  'fence',
  'deck',
  'drywall',
  'patch',
  'ceiling',
  'rental',
  'turnover',
  'commercial',
  'quote',
  'asap',
  'kitchen',
  'living room',
  'bedroom',
  'hallway',
]

const URGENCY_WORDS = ['asap', 'urgent', 'this week', 'before', 'moving', 'immediately', 'soon']

export function extractKeywords(text: string) {
  const haystack = text.toLowerCase()
  const found = PAINT_KEYWORDS.filter((word) => haystack.includes(word))
  return [...new Set(found)].slice(0, 8)
}

export function inferCategory(text: string): ProjectCategory {
  const t = text.toLowerCase()
  if (t.includes('cabinet')) return 'cabinets'
  if (t.includes('commercial') || t.includes('office') || t.includes('storefront')) return 'commercial'
  if (t.includes('rental') || t.includes('turnover') || t.includes('tenant')) return 'rental_turnover'
  if (t.includes('fence') || t.includes('deck')) return 'fence_deck'
  if (t.includes('drywall') || t.includes('patch')) return 'drywall'
  if (t.includes('ceiling')) return 'ceiling'
  if (t.includes('trim') || t.includes('baseboard')) return 'trim'
  if (t.includes('door')) return 'doors'
  if (t.includes('exterior') || t.includes('siding') || t.includes('stucco')) return 'exterior'
  if (t.includes('interior') || t.includes('bedroom') || t.includes('living room')) return 'interior'
  return 'other'
}

export function inferUrgency(text: string, postedAt: string): Urgency {
  const t = text.toLowerCase()
  const minutes = (Date.now() - new Date(postedAt).getTime()) / 60000
  const urgentLanguage = URGENCY_WORDS.some((word) => t.includes(word))
  if (urgentLanguage && minutes < 180) return 'hot'
  if (urgentLanguage) return 'urgent'
  if (minutes < 90) return 'new'
  return 'normal'
}

function recencyScore(postedAt: string) {
  const hours = (Date.now() - new Date(postedAt).getTime()) / 36e5
  if (hours <= 1) return 100
  if (hours <= 6) return 88
  if (hours <= 24) return 74
  if (hours <= 72) return 55
  if (hours <= 168) return 36
  return 18
}

function distanceScore(miles: number) {
  if (miles <= 5) return 100
  if (miles <= 10) return 88
  if (miles <= 25) return 70
  if (miles <= 50) return 48
  if (miles <= 75) return 28
  return 12
}

function urgencyScore(urgency: Urgency) {
  if (urgency === 'hot') return 100
  if (urgency === 'urgent') return 82
  if (urgency === 'new') return 68
  return 40
}

function valueScore(low: number, high: number) {
  const mid = (low + high) / 2
  if (mid >= 8000) return 100
  if (mid >= 4500) return 82
  if (mid >= 2500) return 68
  if (mid >= 1200) return 50
  return 32
}

function keywordScore(keywords: string[]) {
  return Math.min(100, 30 + keywords.length * 12)
}

export function computeLeadScore(input: {
  postedAt: string
  distanceMiles: number
  urgency: Urgency
  estimatedValueLow: number
  estimatedValueHigh: number
  keywords: string[]
  hasPhotos: boolean
  weights?: ScoringWeights
}) {
  const weights = input.weights ?? DEFAULT_WEIGHTS
  const total = weights.recency + weights.distance + weights.urgency + weights.projectValue + weights.keywordMatch
  const raw =
    (recencyScore(input.postedAt) * weights.recency +
      distanceScore(input.distanceMiles) * weights.distance +
      urgencyScore(input.urgency) * weights.urgency +
      valueScore(input.estimatedValueLow, input.estimatedValueHigh) * weights.projectValue +
      keywordScore(input.keywords) * weights.keywordMatch) /
    total

  const photoBoost = input.hasPhotos ? 3 : 0
  return Math.max(12, Math.min(99, Math.round(raw + photoBoost)))
}

export function computeConfidence(description: string, keywords: string[], hasPhotos: boolean) {
  const lengthBonus = Math.min(20, description.length / 12)
  return Math.max(48, Math.min(97, Math.round(55 + keywords.length * 4 + lengthBonus + (hasPhotos ? 8 : 0))))
}

export function estimateValue(category: ProjectCategory, description: string) {
  const t = description.toLowerCase()
  const wholeHouse = t.includes('entire') || t.includes('whole') || t.includes('whole house')
  const ranges: Record<ProjectCategory, [number, number]> = {
    interior: wholeHouse ? [4200, 8600] : [1800, 4200],
    exterior: [5400, 14800],
    cabinets: [2800, 6400],
    trim: [900, 2400],
    doors: [450, 1600],
    fence_deck: [900, 3200],
    drywall: [650, 2200],
    ceiling: [700, 2100],
    rental_turnover: [2400, 6200],
    commercial: [8200, 24000],
    other: [900, 2800],
  }
  return ranges[category]
}

export function analyzeLead(lead: Lead): LeadIntelligence {
  const mid = (lead.estimatedValueLow + lead.estimatedValueHigh) / 2
  const size = mid >= 7000 ? 'Large project' : mid >= 3000 ? 'Medium project' : 'Smaller project'
  const quality =
    lead.score >= 88 ? 'High-intent opportunity' : lead.score >= 72 ? 'Solid working lead' : 'Needs qualification'
  const speed =
    lead.urgency === 'hot' || lead.distanceMiles < 5
      ? 'Contact within 30 minutes.'
      : lead.urgency === 'urgent'
        ? 'Contact within 2 hours.'
        : 'Follow up today.'

  return {
    projectCategory: CATEGORY_LABELS[lead.category],
    likelyJobSize: size,
    urgency: lead.urgency,
    likelyBudget: formatValueRange(lead.estimatedValueLow, lead.estimatedValueHigh),
    travelDistance: formatMiles(lead.distanceMiles),
    keywords: lead.keywords,
    quality,
    suggestedResponse: speed,
    recommendedAction: speed,
    reason: `The homeowner posted ${timeAgo(lead.postedAt)}, mentioned ${lead.keywords.slice(0, 3).join(', ') || 'painting work'}, and is about ${lead.distanceMiles.toFixed(1)} miles away. These are estimates, not confirmed job details.`,
  }
}

export function normalizeRawLead(
  raw: RawLead,
  home: { latitude: number; longitude: number },
  weights?: ScoringWeights,
): Lead {
  const city = findCity(raw.city)
  const latitude = raw.latitude ?? city?.latitude ?? home.latitude
  const longitude = raw.longitude ?? city?.longitude ?? home.longitude
  const postedAt = raw.postedAt ?? new Date().toISOString()
  const detectedAt = new Date().toISOString()
  const description = raw.description
  const category = raw.category ?? inferCategory(`${raw.title} ${description}`)
  const urgency = raw.urgency ?? inferUrgency(description, postedAt)
  const [low, high] = [
    raw.estimatedValueLow ?? estimateValue(category, description)[0],
    raw.estimatedValueHigh ?? estimateValue(category, description)[1],
  ]
  const keywords = extractKeywords(`${raw.title} ${description}`)
  const photos = (raw.photoUrls ?? []).map((imageUrl) => ({
    id: uid('photo'),
    leadId: '',
    imageUrl,
    createdAt: detectedAt,
  }))
  const distanceMiles = Number(haversineMiles(home.latitude, home.longitude, latitude, longitude).toFixed(1))
  const id = uid('lead')
  const lead: Lead = {
    id,
    source: raw.source,
    sourcePostId: raw.sourcePostId ?? null,
    customerName: raw.customerName,
    title: raw.title,
    description,
    city: raw.city,
    state: raw.state ?? city?.state ?? 'CA',
    latitude,
    longitude,
    distanceMiles,
    category,
    urgency,
    postedAt,
    detectedAt,
    estimatedValueLow: low,
    estimatedValueHigh: high,
    score: 0,
    confidence: computeConfidence(description, keywords, photos.length > 0),
    status: 'new',
    sourceUrl: raw.sourceUrl ?? null,
    hasPhotos: photos.length > 0,
    photos: photos.map((photo) => ({ ...photo, leadId: id })),
    keywords,
    phone: raw.phone,
    email: raw.email,
    saved: false,
    followUpAt: null,
    createdAt: detectedAt,
    updatedAt: detectedAt,
  }
  lead.score = computeLeadScore({ ...lead, weights })
  return lead
}

export function rescoreLead(lead: Lead, home: { latitude: number; longitude: number }, weights: ScoringWeights): Lead {
  const distanceMiles = Number(
    haversineMiles(home.latitude, home.longitude, lead.latitude, lead.longitude).toFixed(1),
  )
  return {
    ...lead,
    distanceMiles,
    score: computeLeadScore({ ...lead, distanceMiles, weights }),
    updatedAt: new Date().toISOString(),
  }
}
