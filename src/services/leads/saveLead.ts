import { supabase } from '@/lib/supabase'
import { toDashboardLead } from '@/services/leads/toDashboardLead'
import type { Lead } from '@/types'
import type { ProcessedLead } from '@/types/lead'

export async function saveLead(processed: ProcessedLead): Promise<Lead> {
  const lead = toDashboardLead(processed)

  if (!supabase) {
    console.info('[saveLead] Supabase not configured; storing locally')
    return lead
  }

  const { data, error } = await supabase.from('leads').insert({
    id: lead.id,
    source: lead.source,
    source_post_id: lead.sourcePostId,
    source_url: lead.sourceUrl,
    customer_name: lead.customerName,
    title: lead.title,
    raw_text: lead.rawText ?? lead.description,
    description: lead.description,
    city: lead.city,
    state: lead.state,
    latitude: lead.latitude,
    longitude: lead.longitude,
    distance_miles: lead.distanceMiles,
    category: processed.category,
    urgency: processed.urgency,
    intent: processed.intent,
    confidence: processed.confidence,
    estimated_value_low: lead.estimatedValueLow,
    estimated_value_high: lead.estimatedValueHigh,
    score: lead.score,
    status: lead.status,
    posted_at: lead.postedAt,
    detected_at: lead.detectedAt,
    has_photos: lead.hasPhotos,
  }).select('id').single()

  if (error) {
    if (error.code === '23505') {
      console.info('[saveLead] unique constraint hit, treating as duplicate', error.message)
      throw new Error('This lead was already saved.')
    }
    console.warn('[saveLead] insert failed', error.message)
    throw new Error(error.message)
  }

  if (data?.id) lead.id = data.id

  if (lead.photos.length) {
    const { error: photoError } = await supabase.from('lead_photos').insert(
      lead.photos.map((photo) => ({
        id: photo.id,
        lead_id: lead.id,
        image_url: photo.imageUrl,
      })),
    )
    if (photoError) console.warn('[saveLead] photo insert failed', photoError.message)
  }

  const { error: activityError } = await supabase.from('lead_activity').insert({
    lead_id: lead.id,
    action: 'qualified_lead_saved',
    metadata: {
      score: lead.score,
      city: lead.city,
      category: processed.category,
    },
  })
  if (activityError) console.warn('[saveLead] activity insert failed', activityError.message)

  return lead
}

export async function fetchRemoteLeads(): Promise<Lead[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('leads')
    .select('*, lead_photos(*)')
    .order('detected_at', { ascending: false })
    .limit(200)

  if (error || !data) {
    if (error) console.warn('[saveLead] fetch failed', error.message)
    return []
  }

  return data.map((row) => remoteRowToLead(row as RemoteLeadRow))
}

interface RemoteLeadRow {
  id: string
  source: string
  source_post_id: string | null
  source_url: string | null
  customer_name: string
  title: string
  raw_text: string | null
  description: string
  city: string
  state: string
  latitude: number | null
  longitude: number | null
  distance_miles: number | null
  category: string
  urgency: string
  intent: string | null
  confidence: number | null
  estimated_value_low: number | null
  estimated_value_high: number | null
  score: number
  status: string
  posted_at: string
  detected_at: string
  has_photos: boolean
  created_at: string
  updated_at: string
  lead_photos?: Array<{ id: string; image_url: string; created_at: string }>
}

function remoteRowToLead(row: RemoteLeadRow): Lead {
  const processedLike: ProcessedLead = {
    id: row.id,
    source: row.source,
    sourcePostId: row.source_post_id,
    sourceUrl: row.source_url,
    customerName: row.customer_name,
    title: row.title,
    rawText: row.raw_text ?? row.description,
    description: row.description,
    city: row.city,
    state: row.state,
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    distanceMiles: Number(row.distance_miles ?? 0),
    category: (row.category as ProcessedLead['category']) ?? 'Other Painting',
    urgency: (row.urgency as ProcessedLead['urgency']) ?? 'medium',
    intent: (row.intent as ProcessedLead['intent']) ?? 'unknown',
    confidence: Number(row.confidence ?? 0.7),
    estimatedValueLow: row.estimated_value_low ?? 0,
    estimatedValueHigh: row.estimated_value_high ?? 0,
    score: row.score,
    keywords: [],
    hasPhotos: row.has_photos,
    imageUrls: (row.lead_photos ?? []).map((photo) => photo.image_url),
    postedAt: row.posted_at,
    detectedAt: row.detected_at,
    reasoningSummary: '',
  }
  const lead = toDashboardLead(processedLike)
  return {
    ...lead,
    status: (row.status as Lead['status']) ?? 'new',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
