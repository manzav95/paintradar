import type { ProcessContext } from '@/types/lead'

function tokens(value: string) {
  return new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2),
  )
}

function jaccard(a: string, b: string) {
  const left = tokens(a)
  const right = tokens(b)
  if (!left.size || !right.size) return 0
  let overlap = 0
  left.forEach((word) => {
    if (right.has(word)) overlap += 1
  })
  return overlap / new Set([...left, ...right]).size
}

export function detectDuplicate(
  incoming: {
    source: string
    sourcePostId: string | null
    sourceUrl: string | null
    title: string
    content: string
  },
  existing: ProcessContext['existing'],
) {
  for (const lead of existing) {
    if (incoming.sourcePostId && lead.sourcePostId && incoming.source === lead.source && incoming.sourcePostId === lead.sourcePostId) {
      return { duplicate: true, reason: 'source_post_id' as const }
    }
    if (incoming.sourceUrl && lead.sourceUrl && incoming.sourceUrl === lead.sourceUrl) {
      return { duplicate: true, reason: 'source_url' as const }
    }
    const similarity = jaccard(
      `${incoming.title} ${incoming.content}`,
      `${lead.title} ${lead.description}`,
    )
    if (similarity >= 0.82) {
      return { duplicate: true, reason: 'text_similarity' as const }
    }
  }

  return { duplicate: false as const, reason: null }
}
