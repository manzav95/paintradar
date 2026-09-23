import { supabase } from '@/lib/supabase'
import { handleIngest } from '@/services/leads/ingestApi'
import { createProcessContext } from '@/services/leads/processLead'
import {
  createDemoPipelineSource,
  createEmailPipelineSource,
  createFacebookPipelineSource,
  createManualPipelineSource,
  createNextdoorPipelineSource,
  createWebSearchPipelineSource,
  type PipelineSourceAdapter,
} from '@/services/leadSources/pipeline'
import { createRedditProvider } from '@/services/leadSources/reddit'
import type { ProcessContext, ScanReport, SourceRuntimeStatus, SourceScanStat } from '@/types/lead'

export function createPipelineSources(): PipelineSourceAdapter[] {
  return [
    createManualPipelineSource(),
    createDemoPipelineSource(),
    createRedditProvider(),
    createWebSearchPipelineSource(),
    createEmailPipelineSource(),
    createNextdoorPipelineSource(),
    createFacebookPipelineSource(),
  ]
}

export async function updateSourceHeartbeat(stat: SourceScanStat) {
  if (!supabase) return
  const { error } = await supabase.from('lead_sources').upsert(
    {
      name: stat.name,
      type: stat.name,
      enabled: stat.status === 'Healthy' || stat.status === 'Warning',
      last_scan: stat.lastScan,
      last_success: stat.error ? null : stat.lastScan,
      last_error: stat.error ?? null,
      posts_checked: stat.postsChecked,
      qualified_leads: stat.qualifiedLeads,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'name' },
  )
  if (error) console.warn('[scan] source heartbeat failed', error.message)
}

export async function scanAllSources(contextInput?: Partial<ProcessContext>): Promise<ScanReport> {
  const sources = createPipelineSources()
  const context = createProcessContext(contextInput)
  const existing = [...context.existing]
  const sourceStats: SourceScanStat[] = []
  const leads = []
  const errors: string[] = []
  let postsChecked = 0
  let possibleLeads = 0
  let qualifiedLeads = 0
  let duplicates = 0
  let outsideRadius = 0
  let rejected = 0

  for (const source of sources) {
    const started = new Date().toISOString()
    let status: SourceRuntimeStatus = source.status
    let checked = 0
    let qualified = 0
    let errorMessage: string | undefined

    if (!source.enabled && source.status !== 'Healthy') {
      sourceStats.push({
        name: source.label,
        status,
        lastScan: null,
        postsChecked: 0,
        qualifiedLeads: 0,
      })
      continue
    }

    try {
      const rawLeads = await source.fetchLeads()
      checked = rawLeads.length
      postsChecked += checked

      for (const raw of rawLeads) {
        const result = await handleIngest(raw, { ...context, existing })
        if (result.classification.isLead) possibleLeads += 1
        if (result.accepted && result.lead) {
          qualified += 1
          qualifiedLeads += 1
          leads.push(result.lead)
          existing.push({
            source: result.lead.source,
            sourcePostId: result.lead.sourcePostId,
            sourceUrl: result.lead.sourceUrl,
            title: result.lead.title,
            description: result.lead.description,
          })
        } else if (result.reason === 'duplicate') {
          duplicates += 1
        } else if (result.reason === 'outside_radius') {
          outsideRadius += 1
        } else {
          rejected += 1
        }
      }
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown source error'
      errors.push(`${source.label}: ${errorMessage}`)
      status = 'Offline'
      console.warn(`[scan] ${source.name} failed independently`, errorMessage)
    }

    const stat: SourceScanStat = {
      name: source.label,
      status: errorMessage ? 'Offline' : checked > 0 || source.enabled ? 'Healthy' : status,
      lastScan: started,
      postsChecked: checked,
      qualifiedLeads: qualified,
      error: errorMessage,
    }
    sourceStats.push(stat)
    await updateSourceHeartbeat(stat)
  }

  return {
    postsChecked,
    possibleLeads,
    qualifiedLeads,
    duplicates,
    outsideRadius,
    rejected,
    errors,
    sources: sourceStats,
    leads,
    scannedAt: new Date().toISOString(),
  }
}
