import type { Lead, LeadSourceName, RawLead } from '@/types'

export interface LeadSourceProvider {
  name: LeadSourceName
  label: string
  enabled: boolean
  status: 'connected' | 'adapter_ready' | 'placeholder' | 'manual'
  description: string
  fetchLeads(): Promise<RawLead[]>
  normalizeLead(rawLead: RawLead): Lead
}

export interface SourceHealth {
  name: LeadSourceName
  label: string
  status: LeadSourceProvider['status']
  enabled: boolean
  lastSync: string | null
  leadsFound: number
  description: string
}
