import { PIPELINE_WEIGHTS } from '@/services/leads/config'
import type { LeadClassification } from '@/types/lead'

function recencyPoints(postedAt: string) {
  const hours = (Date.now() - new Date(postedAt).getTime()) / 36e5
  if (hours <= 1) return 100
  if (hours <= 6) return 86
  if (hours <= 24) return 72
  if (hours <= 72) return 54
  if (hours <= 168) return 34
  return 16
}

function distancePoints(miles: number) {
  if (miles <= 5) return 100
  if (miles <= 10) return 90
  if (miles <= 25) return 72
  if (miles <= 50) return 48
  if (miles <= 75) return 24
  return 8
}

function urgencyPoints(urgency: LeadClassification['urgency']) {
  if (urgency === 'urgent') return 100
  if (urgency === 'high') return 82
  if (urgency === 'medium') return 60
  return 32
}

function intentPoints(intent: LeadClassification['intent']) {
  if (intent === 'ready_to_hire') return 100
  if (intent === 'requesting_quote') return 88
  if (intent === 'looking_for_recommendation') return 70
  if (intent === 'planning') return 36
  return 20
}

function valuePoints(low: number, high: number) {
  const mid = (low + high) / 2
  if (mid >= 8000) return 100
  if (mid >= 4500) return 82
  if (mid >= 2500) return 68
  if (mid >= 1200) return 50
  return 30
}

export function calculateLeadScore(input: {
  postedAt: string
  distanceMiles: number
  classification: LeadClassification
  weights?: typeof PIPELINE_WEIGHTS
}) {
  const weights = input.weights ?? PIPELINE_WEIGHTS
  const total =
    weights.recency +
    weights.distance +
    weights.urgency +
    weights.hiringIntent +
    weights.projectValue +
    weights.aiConfidence

  const raw =
    (recencyPoints(input.postedAt) * weights.recency +
      distancePoints(input.distanceMiles) * weights.distance +
      urgencyPoints(input.classification.urgency) * weights.urgency +
      intentPoints(input.classification.intent) * weights.hiringIntent +
      valuePoints(input.classification.estimatedValueLow, input.classification.estimatedValueHigh) * weights.projectValue +
      input.classification.confidence * 100 * weights.aiConfidence) /
    total

  return Math.max(1, Math.min(100, Math.round(raw)))
}
