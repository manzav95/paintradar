import type { RawLead as LegacyRawLead } from '@/types'
import type { LeadSourceProvider, RawLead, SourceRuntimeStatus } from '@/types/lead'

export interface PipelineSourceAdapter extends LeadSourceProvider {
  label: string
  enabled: boolean
  status: SourceRuntimeStatus
  description: string
}

function fromLegacy(raw: LegacyRawLead): RawLead {
  return {
    source: raw.source,
    sourcePostId: raw.sourcePostId ?? undefined,
    sourceUrl: raw.sourceUrl ?? undefined,
    author: raw.customerName,
    title: raw.title,
    content: raw.description,
    city: raw.city,
    state: raw.state,
    postedAt: raw.postedAt,
    imageUrls: raw.photoUrls,
  }
}

export function createManualPipelineSource(): PipelineSourceAdapter {
  return {
    name: 'manual',
    label: 'Manual',
    enabled: true,
    status: 'Healthy',
    description: 'Leads pasted in Lead Tester or captured from calls and referrals.',
    async fetchLeads() {
      return []
    },
  }
}

export function createDemoPipelineSource(): PipelineSourceAdapter {
  return {
    name: 'demo',
    label: 'Demo',
    enabled: false,
    status: 'Not Configured',
    description: 'Demo feed is paused. Use Lead Tester until live sources are connected.',
    async fetchLeads() {
      return []
    },
  }
}

export function createWebSearchPipelineSource(): PipelineSourceAdapter {
  return {
    name: 'web_search',
    label: 'Web Search',
    enabled: false,
    status: 'Not Configured',
    description: 'Interface ready for an authorized public-search provider.',
    async fetchLeads() {
      return []
    },
  }
}

export function createEmailPipelineSource(): PipelineSourceAdapter {
  return {
    name: 'email',
    label: 'Email',
    enabled: false,
    status: 'Not Configured',
    description: 'Interface ready for inbound email or form notifications.',
    async fetchLeads() {
      return []
    },
  }
}

export function createNextdoorPipelineSource(): PipelineSourceAdapter {
  return {
    name: 'nextdoor',
    label: 'Nextdoor',
    enabled: false,
    status: 'Adapter Ready',
    description: 'Authorized-feed adapter only. No scraping or login bypass.',
    async fetchLeads() {
      return []
    },
  }
}

export function createFacebookPipelineSource(): PipelineSourceAdapter {
  return {
    name: 'facebook',
    label: 'Facebook',
    enabled: false,
    status: 'Adapter Ready',
    description: 'Authorized-feed adapter only. No scraping or login bypass.',
    async fetchLeads() {
      return []
    },
  }
}

export { fromLegacy as legacyRawToPipelineRaw }
