import { REDDIT_KEYWORDS, REDDIT_LOCATION_WORDS } from '@/services/leads/config'
import type { RawLead } from '@/types/lead'
import type { PipelineSourceAdapter } from '@/services/leadSources/pipeline'

interface RedditListing {
  data?: {
    children?: Array<{
      data?: {
        id?: string
        title?: string
        selftext?: string
        author?: string
        permalink?: string
        url?: string
        created_utc?: number
      }
    }>
  }
}

function redditConfigured() {
  return Boolean(import.meta.env.VITE_REDDIT_CLIENT_ID)
}

async function fetchViaProxy(): Promise<RawLead[]> {
  const response = await fetch('/api/sources/reddit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keywords: REDDIT_KEYWORDS,
      locations: REDDIT_LOCATION_WORDS,
    }),
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(detail || `Reddit proxy failed (${response.status})`)
  }
  const payload = (await response.json()) as { leads?: RawLead[]; error?: string }
  if (payload.error) throw new Error(payload.error)
  return payload.leads ?? []
}

export function mapRedditPost(post: {
  id?: string
  title?: string
  selftext?: string
  author?: string
  permalink?: string
  url?: string
  created_utc?: number
}): RawLead | null {
  const title = post.title?.trim() ?? ''
  const content = `${title} ${post.selftext ?? ''}`.trim()
  if (!content) return null
  return {
    source: 'reddit',
    sourcePostId: post.id,
    sourceUrl: post.permalink ? `https://www.reddit.com${post.permalink}` : post.url,
    author: post.author && post.author !== '[deleted]' ? post.author : 'Reddit homeowner',
    title,
    content,
    postedAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : undefined,
  }
}

export function parseRedditListing(listing: RedditListing): RawLead[] {
  return (listing.data?.children ?? [])
    .map((child) => mapRedditPost(child.data ?? {}))
    .filter((lead): lead is RawLead => Boolean(lead))
}

export function createRedditProvider(): PipelineSourceAdapter {
  const configured = redditConfigured()
  return {
    name: 'reddit',
    label: 'Reddit',
    enabled: configured,
    status: configured ? 'Healthy' : 'Not Configured',
    description: 'Official Reddit search for painting-hire posts. Requires app credentials.',
    async fetchLeads() {
      if (!configured) return []
      return fetchViaProxy()
    },
  }
}
