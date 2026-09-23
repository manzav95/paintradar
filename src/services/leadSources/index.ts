import { createCraigslistProvider } from '@/services/leadSources/craigslist'
import { createDemoProvider } from '@/services/leadSources/demo'
import { createFacebookProvider } from '@/services/leadSources/facebook'
import { createManualProvider } from '@/services/leadSources/manual'
import { createNextdoorProvider } from '@/services/leadSources/nextdoor'
import { createWebhookProvider } from '@/services/leadSources/webhook'
import { normalizeRawLead } from '@/lib/scoring'
import type { LeadSourceProvider, SourceHealth } from '@/services/leadSources/types'
import type { Lead, RawLead } from '@/types'

export type { LeadSourceProvider, SourceHealth } from '@/services/leadSources/types'

function placeholder(home: { latitude: number; longitude: number }, name: LeadSourceProvider['name'], label: string, description: string, status: LeadSourceProvider['status'] = 'placeholder'): LeadSourceProvider {
  return {
    name,
    label,
    enabled: false,
    status,
    description,
    async fetchLeads() {
      return []
    },
    normalizeLead(rawLead: RawLead): Lead {
      return normalizeRawLead({ ...rawLead, source: name }, home)
    },
  }
}

export function createLeadSourceRegistry(home: { latitude: number; longitude: number }): LeadSourceProvider[] {
  return [
    createDemoProvider(home),
    createManualProvider(home),
    placeholder(home, 'reddit', 'Reddit', 'Official Reddit search. Configure client credentials to enable.', 'adapter_ready'),
    placeholder(home, 'web_search', 'Web Search', 'Interface ready for an authorized public-search provider.'),
    placeholder(home, 'email', 'Email', 'Interface ready for inbound email or form notifications.'),
    createNextdoorProvider(home),
    createWebhookProvider(home),
    createFacebookProvider(home),
    createCraigslistProvider(home),
  ]
}

export function sourceHealth(providers: LeadSourceProvider[], leads: Lead[]): SourceHealth[] {
  return providers.map((provider) => {
    const sourceLeads = leads.filter((lead) => lead.source === provider.name)
    const last = sourceLeads
      .slice()
      .sort((a, b) => +new Date(b.detectedAt) - +new Date(a.detectedAt))[0]
    return {
      name: provider.name,
      label: provider.label,
      status: provider.status,
      enabled: provider.enabled,
      lastSync: last?.detectedAt ?? null,
      leadsFound: sourceLeads.length,
      description: provider.description,
    }
  })
}
