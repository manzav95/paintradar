import { normalizeRawLead } from '@/lib/scoring'
import type { Lead, RawLead } from '@/types'
import type { LeadSourceProvider } from '@/services/leadSources/types'

export function createNextdoorProvider(home: { latitude: number; longitude: number }): LeadSourceProvider {
  return {
    name: 'nextdoor',
    label: 'Nextdoor',
    enabled: false,
    status: 'adapter_ready',
    description:
      'Integration adapter ready. Connect through an authorized data source or supported integration. This adapter does not scrape or bypass platform protections.',
    async fetchLeads() {
      return []
    },
    normalizeLead(rawLead: RawLead): Lead {
      return normalizeRawLead({ ...rawLead, source: 'nextdoor' }, home)
    },
  }
}
