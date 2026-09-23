import { createWorker } from 'tesseract.js'
import { extractCityFromText } from '@/services/location'

export interface ScreenshotLeadDraft {
  content: string
  title: string
  author: string
  city: string
  state: string
  source: string
}

function cleanOcrText(raw: string) {
  return raw
    .replace(/\u0000/g, '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim()
}

function guessSource(text: string) {
  const haystack = text.toLowerCase()
  if (haystack.includes('nextdoor')) return 'nextdoor'
  if (haystack.includes('facebook') || haystack.includes('marketplace')) return 'facebook'
  if (haystack.includes('reddit')) return 'reddit'
  if (haystack.includes('craigslist')) return 'craigslist'
  return 'manual'
}

function guessAuthor(lines: string[]) {
  const first = lines.find((line) => line.length >= 2 && line.length <= 40 && !line.includes('http'))
  if (!first) return 'Homeowner'
  if (/looking for|need |paint|recommend|quote/i.test(first)) return 'Homeowner'
  return first.replace(/^@/, '')
}

function guessTitle(content: string) {
  const firstSentence = content.split(/[\n.!?]/).map((part) => part.trim()).find((part) => part.length > 8)
  return (firstSentence ?? content).slice(0, 80)
}

export async function extractLeadDraftFromImage(image: File | Blob): Promise<ScreenshotLeadDraft> {
  const worker = await createWorker('eng')
  try {
    const { data } = await worker.recognize(image)
    const content = cleanOcrText(data.text ?? '')
    if (!content) {
      throw new Error('No text found in that screenshot. Try a clearer crop of the post.')
    }
    const lines = content.split('\n')
    const cityMatch = extractCityFromText(content)
    return {
      content,
      title: guessTitle(content),
      author: guessAuthor(lines),
      city: cityMatch?.name ?? 'Brentwood',
      state: cityMatch?.state ?? 'CA',
      source: guessSource(content),
    }
  } finally {
    await worker.terminate()
  }
}
