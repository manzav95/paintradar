import { normalizeRawLead } from '@/lib/scoring'
import type { Lead, RawLead } from '@/types'
import type { LeadSourceProvider } from '@/services/leadSources/types'

export function createFacebookProvider(home: { latitude: number; longitude: number }): LeadSourceProvider {
  return {
    name: 'facebook',
    label: 'Facebook',
    enabled: false,
    status: 'adapter_ready',
    description: 'Authorized-feed adapter only. No scraping or login bypass.',
    async fetchLeads() {
      return []
    },
    normalizeLead(rawLead: RawLead): Lead {
      return normalizeRawLead({ ...rawLead, source: 'facebook' }, home)
    },
  }
}
