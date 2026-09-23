import type { Lead, LeadFilters, Urgency } from '@/types'

const URGENCY_RANK: Record<Urgency, number> = {
  hot: 4,
  urgent: 3,
  new: 2,
  normal: 1,
}

export const DEFAULT_FILTERS: LeadFilters = {
  query: '',
  categories: [],
  maxDistance: null,
  datePosted: 'any',
  minScore: 0,
  urgency: [],
  sources: [],
  minValue: null,
  city: '',
  hasPhotos: null,
  sort: 'newest',
}

export function applyLeadFilters(leads: Lead[], filters: LeadFilters, radius: number) {
  const now = Date.now()
  const query = filters.query.trim().toLowerCase()

  const filtered = leads.filter((lead) => {
    if (lead.status === 'dismissed') return false
    if (lead.distanceMiles > radius) return false
    if (filters.maxDistance != null && lead.distanceMiles > filters.maxDistance) return false
    if (filters.categories.length && !filters.categories.includes(lead.category)) return false
    if (filters.urgency.length && !filters.urgency.includes(lead.urgency)) return false
    if (filters.sources.length && !filters.sources.includes(lead.source)) return false
    if (lead.score < filters.minScore) return false
    if (filters.minValue != null && lead.estimatedValueHigh < filters.minValue) return false
    if (filters.city && lead.city !== filters.city) return false
    if (filters.hasPhotos === true && !lead.hasPhotos) return false
    if (filters.hasPhotos === false && lead.hasPhotos) return false
    if (filters.datePosted !== 'any') {
      const hours = (now - new Date(lead.postedAt).getTime()) / 36e5
      if (filters.datePosted === '1h' && hours > 1) return false
      if (filters.datePosted === '24h' && hours > 24) return false
      if (filters.datePosted === '7d' && hours > 24 * 7) return false
      if (filters.datePosted === '30d' && hours > 24 * 30) return false
    }
    if (query) {
      const blob = `${lead.customerName} ${lead.city} ${lead.title} ${lead.description} ${lead.category} ${lead.keywords.join(' ')}`.toLowerCase()
      if (!blob.includes(query)) return false
    }
    return true
  })

  return filtered.sort((a, b) => {
    if (filters.sort === 'closest') return a.distanceMiles - b.distanceMiles
    if (filters.sort === 'highest_score') return b.score - a.score
    if (filters.sort === 'highest_value') return b.estimatedValueHigh - a.estimatedValueHigh
    if (filters.sort === 'most_urgent') return URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency]
    return +new Date(b.postedAt) - +new Date(a.postedAt)
  })
}
