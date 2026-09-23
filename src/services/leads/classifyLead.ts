import type { LeadClassification, NormalizedLead, PipelineCategory, PipelineIntent, PipelineUrgency } from '@/types/lead'

export interface ClassifierProvider {
  name: string
  classify(lead: NormalizedLead): Promise<LeadClassification>
}

const HIRING_PHRASES = [
  'looking for someone',
  'looking for a painter',
  'looking for painter',
  'need someone',
  'need a painter',
  'need painter',
  'anyone recommend',
  'can anyone recommend',
  'recommend someone',
  'recommendations for',
  'painter recommendation',
  'want quotes',
  'need a quote',
  'looking for quotes',
  'getting quotes',
  'need an estimate',
  'painting estimate',
  'painting quote',
  'ready to hire',
  'hire a painter',
  'who refinishes',
  'refinishes and paints',
  'paint our',
  'paint my',
  'repaint our',
  'repaint my',
  'house painted',
  'need exterior',
  'before we move',
  'before october',
]

const ADVICE_PHRASES = [
  'what color should',
  'which color',
  'should we choose',
  'white or gray',
  'name of this paint color',
  'does anyone know the name',
  'what paint color',
]

const NOT_LEAD_PHRASES = [
  'selling leftover paint',
  'selling paint',
  'unopened gallons',
  'gallons of white',
  'painted this artwork',
  'painting classes',
  'paint class',
  'art class',
  'looking for leftover',
]

function includesAny(text: string, phrases: string[]) {
  return phrases.filter((phrase) => text.includes(phrase))
}

function inferCategory(text: string): PipelineCategory {
  if (text.includes('cabinet') || text.includes('refinish')) return 'Cabinet Painting'
  if (text.includes('commercial') || text.includes('office') || text.includes('storefront')) return 'Commercial Painting'
  if (text.includes('rental') || text.includes('turnover') || text.includes('tenant')) return 'Rental Turnover'
  if (text.includes('fence') || text.includes('deck')) return 'Deck / Fence'
  if (text.includes('drywall') || text.includes('patch')) return 'Drywall / Patch + Paint'
  if (text.includes('trim') || text.includes('door') || text.includes('baseboard')) return 'Trim / Doors'
  if (text.includes('exterior') || text.includes('siding') || text.includes('stucco') || text.includes('house painted')) {
    return 'Exterior Painting'
  }
  if (
    text.includes('interior') ||
    text.includes('bedroom') ||
    text.includes('hallway') ||
    text.includes('living room') ||
    text.includes('kitchen')
  ) {
    return 'Interior Painting'
  }
  return 'Other Painting'
}

function inferIntent(text: string, hiring: string[]): PipelineIntent {
  if (text.includes('ready to hire') || text.includes('before we move') || text.includes('need someone')) {
    return 'ready_to_hire'
  }
  if (hiring.some((phrase) => phrase.includes('recommend'))) return 'looking_for_recommendation'
  if (text.includes('recommend') || text.includes('recommendation')) return 'looking_for_recommendation'
  if (text.includes('quote') || text.includes('estimate')) return 'requesting_quote'
  if (text.includes('thinking about') || text.includes('planning')) return 'planning'
  return hiring.length ? 'requesting_quote' : 'unknown'
}

function inferUrgency(text: string): PipelineUrgency {
  if (text.includes('asap') || text.includes('immediately') || text.includes('friday') || text.includes('today')) {
    return 'urgent'
  }
  if (text.includes('this week') || text.includes('next week') || text.includes('before') || text.includes('soon')) {
    return 'high'
  }
  if (text.includes('looking for') || text.includes('need')) return 'medium'
  return 'low'
}

function estimateValue(category: PipelineCategory, text: string): [number, number] {
  const whole = text.includes('entire') || text.includes('whole house') || text.includes('four bedrooms')
  if (category === 'Cabinet Painting') return [3000, 6000]
  if (category === 'Exterior Painting') return [5400, 14800]
  if (category === 'Commercial Painting') return [8200, 24000]
  if (category === 'Rental Turnover') return [2400, 6200]
  if (category === 'Deck / Fence') return [900, 3200]
  if (category === 'Drywall / Patch + Paint') return [650, 2200]
  if (category === 'Trim / Doors') return [700, 2200]
  if (category === 'Interior Painting') return whole ? [2800, 6200] : [1800, 4200]
  return [900, 2800]
}

function keywordsFrom(text: string) {
  const dictionary = [
    'kitchen cabinets',
    'cabinets',
    'painter',
    'paint',
    'quote',
    'quotes',
    'estimate',
    'next week',
    'this week',
    'bedrooms',
    'hallway',
    'exterior',
    'interior',
    'recommend',
    'refinish',
    'rental',
  ]
  return dictionary.filter((word) => text.includes(word)).slice(0, 8)
}

export function mockClassify(lead: NormalizedLead): LeadClassification {
  const text = `${lead.title} ${lead.content}`.toLowerCase()
  const hiring = includesAny(text, HIRING_PHRASES)
  const advice = includesAny(text, ADVICE_PHRASES)
  const blocked = includesAny(text, NOT_LEAD_PHRASES)
  const selling = text.includes('selling') && text.includes('paint') && !hiring.length
  const colorAdvice = advice.length > 0 && hiring.length === 0
  const isLead = hiring.length > 0 && !blocked.length && !selling && !colorAdvice

  const category = inferCategory(text)
  const [estimatedValueLow, estimatedValueHigh] = estimateValue(category, text)
  const urgency = inferUrgency(text)
  const intent = inferIntent(text, hiring)
  const keywords = keywordsFrom(text)
  const confidence = isLead
    ? Math.min(0.98, 0.72 + hiring.length * 0.06 + (keywords.includes('quote') || keywords.includes('quotes') ? 0.08 : 0))
    : Math.max(0.08, 0.22 - blocked.length * 0.04)

  return {
    isLead,
    confidence: Number(confidence.toFixed(2)),
    category,
    urgency,
    intent: isLead ? intent : 'unknown',
    estimatedValueLow,
    estimatedValueHigh,
    keywords,
    reasoningSummary: isLead
      ? `Hiring language detected (${hiring.slice(0, 2).join(', ') || 'request'}). Classified as ${category}.`
      : blocked.length || selling
        ? 'Post is selling materials or not requesting a painter.'
        : colorAdvice
          ? 'Homeowner is asking for color advice, not hiring a painter.'
          : 'No clear request for painting services.',
  }
}

async function classifyWithExternalProvider(lead: NormalizedLead, apiKey: string): Promise<LeadClassification | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'Classify whether a public post is a legitimate request to hire a painting contractor. Return strict JSON with keys isLead, confidence, category, urgency, intent, estimatedValueLow, estimatedValueHigh, keywords, reasoningSummary. isLead must be false for color advice, selling leftover paint, artwork, or painting classes.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              title: lead.title,
              content: lead.content,
              city: lead.city,
              author: lead.author,
            }),
          },
        ],
      }),
    })
    if (!response.ok) return null
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const parsed = JSON.parse(payload.choices?.[0]?.message?.content ?? '{}') as Partial<LeadClassification>
    if (typeof parsed.isLead !== 'boolean') return null
    return {
      ...mockClassify(lead),
      ...parsed,
      keywords: parsed.keywords ?? [],
    }
  } catch (error) {
    console.warn('[classifier] external provider failed, using mock', error)
    return null
  }
}

export function createClassifier(apiKey?: string): ClassifierProvider {
  if (!apiKey) {
    return {
      name: 'mock',
      async classify(lead) {
        return mockClassify(lead)
      },
    }
  }

  return {
    name: 'openai',
    async classify(lead) {
      return (await classifyWithExternalProvider(lead, apiKey)) ?? mockClassify(lead)
    },
  }
}

export async function classifyLead(lead: NormalizedLead, apiKey = import.meta.env.VITE_AI_API_KEY) {
  return createClassifier(apiKey).classify(lead)
}
