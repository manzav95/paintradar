import { normalizeRawLead } from '@/lib/scoring'
import type { Lead, RawLead } from '@/types'
import type { LeadSourceProvider } from '@/services/leadSources/types'

export function createManualProvider(home: { latitude: number; longitude: number }): LeadSourceProvider {
  return {
    name: 'manual',
    label: 'Manual Entry',
    enabled: true,
    status: 'manual',
    description: 'Leads captured from calls, walk-ins, referrals, or the Add Lead action.',
    async fetchLeads() {
      return []
    },
    normalizeLead(rawLead: RawLead): Lead {
      return normalizeRawLead({ ...rawLead, source: 'manual' }, home)
    },
  }
}
