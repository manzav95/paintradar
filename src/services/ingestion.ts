import { normalizeRawLead } from '@/lib/scoring'
import type { LeadSourceProvider } from '@/services/leadSources/types'
import type { Lead, RawLead, ScoringWeights } from '@/types'

export interface IngestionResult {
  inserted: Lead[]
  skipped: number
  source: string
}

export function ingestRawLeads(
  rawLeads: RawLead[],
  existing: Lead[],
  home: { latitude: number; longitude: number },
  weights: ScoringWeights,
): IngestionResult {
  const seen = new Set(
    existing
      .map((lead) => lead.sourcePostId)
      .filter((id): id is string => Boolean(id)),
  )
  const names = new Set(existing.map((lead) => `${lead.customerName}|${lead.title}`))
  const inserted: Lead[] = []
  let skipped = 0

  for (const raw of rawLeads) {
    const key = raw.sourcePostId ?? `${raw.customerName}|${raw.title}`
    if ((raw.sourcePostId && seen.has(raw.sourcePostId)) || names.has(`${raw.customerName}|${raw.title}`)) {
      skipped += 1
      continue
    }
    inserted.push(normalizeRawLead(raw, home, weights))
    seen.add(key)
    names.add(`${raw.customerName}|${raw.title}`)
  }

  return { inserted, skipped, source: rawLeads[0]?.source ?? 'unknown' }
}

export async function ingestFromProviders(
  providers: LeadSourceProvider[],
  existing: Lead[],
  home: { latitude: number; longitude: number },
  weights: ScoringWeights,
) {
  const collected: Lead[] = []
  for (const provider of providers.filter((item) => item.enabled)) {
    const raw = await provider.fetchLeads()
    const result = ingestRawLeads(raw, [...existing, ...collected], home, weights)
    collected.push(...result.inserted)
  }
  return collected
}
