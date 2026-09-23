import { normalizeRawLead } from '@/lib/scoring'
import type { Lead, RawLead } from '@/types'
import type { LeadSourceProvider } from '@/services/leadSources/types'

export function createCraigslistProvider(home: { latitude: number; longitude: number }): LeadSourceProvider {
  return {
    name: 'craigslist',
    label: 'Craigslist',
    enabled: false,
    status: 'placeholder',
    description: 'Future source. Reserved for an authorized or officially supported listing feed.',
    async fetchLeads() {
      return []
    },
    normalizeLead(rawLead: RawLead): Lead {
      return normalizeRawLead({ ...rawLead, source: 'craigslist' }, home)
    },
  }
}
