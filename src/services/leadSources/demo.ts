import { normalizeRawLead } from '@/lib/scoring'
import type { Lead, RawLead } from '@/types'
import type { LeadSourceProvider } from '@/services/leadSources/types'

export function createDemoProvider(home: { latitude: number; longitude: number }): LeadSourceProvider {
  return {
    name: 'demo',
    label: 'Demo Feed',
    enabled: false,
    status: 'placeholder',
    description: 'Demo feed is paused. Use Lead Tester until live sources are connected.',
    async fetchLeads() {
      return []
    },
    normalizeLead(rawLead: RawLead): Lead {
      return normalizeRawLead(rawLead, home)
    },
  }
}
