import { REDDIT_KEYWORDS, REDDIT_LOCATION_WORDS } from '@/services/leads/config'
import { mapRedditPost } from '@/services/leadSources/reddit'
import type { RawLead } from '@/types/lead'

interface TokenResponse {
  access_token?: string
  error?: string
}

function envValue(name: string) {
  const runtime = globalThis as { process?: { env?: Record<string, string | undefined> } }
  return runtime.process?.env?.[name]
}

async function redditToken() {
  const clientId = envValue('REDDIT_CLIENT_ID') ?? envValue('VITE_REDDIT_CLIENT_ID')
  const clientSecret = envValue('REDDIT_CLIENT_SECRET') ?? envValue('VITE_REDDIT_CLIENT_SECRET')
  if (!clientId || !clientSecret) {
    throw new Error('Reddit is not configured')
  }

  const auth = btoa(`${clientId}:${clientSecret}`)
  const response = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'PaintRadar/1.0 (lead discovery)',
    },
    body: 'grant_type=client_credentials',
  })
  const payload = (await response.json()) as TokenResponse
  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error || 'Reddit token request failed')
  }
  return payload.access_token
}

export async function fetchRedditRawLeads(input?: { keywords?: string[]; locations?: string[] }) {
  const token = await redditToken()
  const keywords = input?.keywords?.length ? input.keywords : REDDIT_KEYWORDS
  const locations = input?.locations?.length ? input.locations : REDDIT_LOCATION_WORDS
  const queries = keywords.slice(0, 6).flatMap((keyword) =>
    locations.slice(0, 3).map((location) => `${keyword} ${location}`),
  )
  const seen = new Set<string>()
  const leads: RawLead[] = []

  for (const query of queries.slice(0, 10)) {
    const url = new URL('https://oauth.reddit.com/search')
    url.searchParams.set('q', query)
    url.searchParams.set('sort', 'new')
    url.searchParams.set('limit', '8')
    url.searchParams.set('type', 'link')

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'PaintRadar/1.0 (lead discovery)',
      },
    })
    if (!response.ok) {
      console.warn('[reddit] search failed', query, response.status)
      continue
    }
    const listing = (await response.json()) as {
      data?: { children?: Array<{ data?: Parameters<typeof mapRedditPost>[0] }> }
    }
    for (const child of listing.data?.children ?? []) {
      const raw = mapRedditPost(child.data ?? {})
      if (!raw?.sourcePostId || seen.has(raw.sourcePostId)) continue
      seen.add(raw.sourcePostId)
      leads.push(raw)
    }
  }

  return leads
}
