import { newLeadId } from '@/lib/format'
import { DEFAULT_HOME } from '@/data/cities'
import {
  DEFAULT_MINIMUM_CONFIDENCE,
  DEFAULT_MINIMUM_SCORE,
  DEFAULT_SERVICE_RADIUS_MILES,
} from '@/services/leads/config'
import { calculateLeadScore } from '@/services/leads/calculateLeadScore'
import { classifyLead } from '@/services/leads/classifyLead'
import { detectDuplicate } from '@/services/leads/detectDuplicate'
import { normalizeLead } from '@/services/leads/normalizeLead'
import { calculateDistanceMiles, geocodeLocation, isInsideServiceRadius } from '@/services/location'
import type { ProcessContext, ProcessResult, RawLead } from '@/types/lead'

export function createProcessContext(partial?: Partial<ProcessContext>): ProcessContext {
  return {
    home: {
      city: DEFAULT_HOME.name,
      state: DEFAULT_HOME.state,
      latitude: DEFAULT_HOME.latitude,
      longitude: DEFAULT_HOME.longitude,
    },
    radiusMiles: DEFAULT_SERVICE_RADIUS_MILES,
    minimumConfidence: DEFAULT_MINIMUM_CONFIDENCE,
    minimumScore: DEFAULT_MINIMUM_SCORE,
    existing: [],
    ...partial,
  }
}

export async function processLead(raw: RawLead, contextInput?: Partial<ProcessContext>): Promise<ProcessResult> {
  const context = createProcessContext(contextInput)
  const normalized = normalizeLead(raw)
  const classification = await classifyLead(normalized)
  const located = await geocodeLocation(normalized.city, normalized.state, {
    name: context.home.city,
    state: context.home.state,
    latitude: context.home.latitude,
    longitude: context.home.longitude,
  })
  const distanceMiles = calculateDistanceMiles(context.home, located)
  const score = calculateLeadScore({
    postedAt: normalized.postedAt,
    distanceMiles,
    classification,
  })

  const logParts = [
    `source=${normalized.source}`,
    `isLead=${classification.isLead}`,
    `confidence=${classification.confidence}`,
    `category=${classification.category}`,
    `distance=${distanceMiles}`,
    `score=${score}`,
  ]

  if (!classification.isLead) {
    const log = `[pipeline] rejected not_a_lead ${logParts.join(' ')} ${classification.reasoningSummary}`
    console.info(log)
    return { accepted: false, reason: 'not_a_lead', classification, normalized, distanceMiles, score, log }
  }

  if (classification.confidence < context.minimumConfidence) {
    const log = `[pipeline] rejected low_confidence ${logParts.join(' ')}`
    console.info(log)
    return { accepted: false, reason: 'low_confidence', classification, normalized, distanceMiles, score, log }
  }

  if (!isInsideServiceRadius(distanceMiles, context.radiusMiles)) {
    const log = `[pipeline] rejected outside_radius ${logParts.join(' ')} radius=${context.radiusMiles}`
    console.info(log)
    return { accepted: false, reason: 'outside_radius', classification, normalized, distanceMiles, score, log }
  }

  const duplicate = detectDuplicate(
    {
      source: normalized.source,
      sourcePostId: normalized.sourcePostId,
      sourceUrl: normalized.sourceUrl,
      title: normalized.title,
      content: normalized.content,
    },
    context.existing,
  )
  if (duplicate.duplicate && !context.allowDuplicate) {
    const log = `[pipeline] rejected duplicate ${duplicate.reason} ${logParts.join(' ')}`
    console.info(log)
    return { accepted: false, reason: 'duplicate', classification, normalized, distanceMiles, score, log }
  }

  if (score < context.minimumScore) {
    const log = `[pipeline] rejected below_score ${logParts.join(' ')} min=${context.minimumScore}`
    console.info(log)
    return { accepted: false, reason: 'below_score', classification, normalized, distanceMiles, score, log }
  }

  const detectedAt = new Date().toISOString()
  const lead = {
    id: newLeadId(),
    source: normalized.source,
    sourcePostId: normalized.sourcePostId,
    sourceUrl: normalized.sourceUrl,
    customerName: normalized.author,
    title: normalized.title,
    rawText: normalized.content,
    description: normalized.content,
    city: located.city,
    state: located.state,
    latitude: located.latitude,
    longitude: located.longitude,
    distanceMiles,
    category: classification.category,
    urgency: classification.urgency,
    intent: classification.intent,
    confidence: classification.confidence,
    estimatedValueLow: classification.estimatedValueLow,
    estimatedValueHigh: classification.estimatedValueHigh,
    score,
    keywords: classification.keywords,
    hasPhotos: normalized.imageUrls.length > 0,
    imageUrls: normalized.imageUrls,
    postedAt: normalized.postedAt,
    detectedAt,
    reasoningSummary: classification.reasoningSummary,
  }

  const log = `[pipeline] accepted ${logParts.join(' ')} ${lead.city}`
  console.info(log)
  return { accepted: true, classification, normalized, distanceMiles, score, lead, log }
}
