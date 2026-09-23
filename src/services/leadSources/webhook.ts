import { normalizeRawLead } from '@/lib/scoring'
import type { Lead, RawLead } from '@/types'
import type { LeadSourceProvider } from '@/services/leadSources/types'

export function createWebhookProvider(home: { latitude: number; longitude: number }): LeadSourceProvider {
  return {
    name: 'webhook',
    label: 'Webhooks',
    enabled: true,
    status: 'adapter_ready',
    description: 'Accept inbound leads from forms, CRMs, or a future server-side ingestion job.',
    async fetchLeads() {
      return []
    },
    normalizeLead(rawLead: RawLead): Lead {
      return normalizeRawLead({ ...rawLead, source: 'webhook' }, home)
    },
  }
}
