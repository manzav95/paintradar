import type { NormalizedLead, RawLead } from '@/types/lead'
import { extractCityFromText, normalizeCityName, normalizeState } from '@/services/location'

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeUrl(value?: string) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('www.')) return `https://${trimmed}`
  return trimmed
}

function normalizeDate(value?: string) {
  if (!value) return new Date().toISOString()
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

function normalizeImages(urls?: string[]) {
  return [...new Set((urls ?? []).map((url) => url.trim()).filter(Boolean))]
}

function fingerprint(source: string, content: string, url?: string | null) {
  const seed = `${source}|${url ?? ''}|${content.slice(0, 160)}`
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return `${source}_${Math.abs(hash).toString(36)}`
}

export function normalizeLead(raw: RawLead): NormalizedLead {
  const content = collapseWhitespace(raw.content ?? '')
  const title = collapseWhitespace(raw.title ?? content.slice(0, 72) ?? 'Painting request')
  const sourceUrl = normalizeUrl(raw.sourceUrl)
  const cityFromText = extractCityFromText(`${raw.title ?? ''} ${content} ${raw.city ?? ''}`)
  const city = normalizeCityName(raw.city) ?? cityFromText?.name ?? null
  const author = collapseWhitespace(raw.author ?? '') || 'Homeowner'

  return {
    source: collapseWhitespace(raw.source || 'manual').toLowerCase(),
    sourcePostId: collapseWhitespace(raw.sourcePostId ?? '') || fingerprint(raw.source || 'manual', content, sourceUrl),
    sourceUrl,
    author,
    title: title || 'Painting request',
    content,
    city,
    state: normalizeState(raw.state ?? cityFromText?.state),
    postedAt: normalizeDate(raw.postedAt),
    imageUrls: normalizeImages(raw.imageUrls),
  }
}
