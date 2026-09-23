import { formatDistanceToNow, format } from 'date-fns'
import type { ProjectCategory, Urgency } from '@/types'
import { CATEGORY_LABELS } from '@/types'

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatValueRange(low: number, high: number) {
  return `${formatCurrency(low)}–${formatCurrency(high)}`
}

export function formatMiles(miles: number) {
  return `${miles.toFixed(1)} mi`
}

export function timeAgo(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

export function formatDateTime(iso: string) {
  return format(new Date(iso), 'MMM d, yyyy • h:mm a')
}

export function greetingForNow() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function categoryLabel(category: ProjectCategory) {
  return CATEGORY_LABELS[category]
}

export function scoreLabel(score: number) {
  if (score >= 90) return 'Excellent Match'
  if (score >= 80) return 'Strong Match'
  if (score >= 70) return 'Good Match'
  if (score >= 55) return 'Fair Match'
  return 'Low Priority'
}

export function urgencyTone(urgency: Urgency) {
  if (urgency === 'hot') return 'hot'
  if (urgency === 'urgent') return 'urgent'
  if (urgency === 'new') return 'info'
  return 'muted'
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`
}

export function newLeadId() {
  return crypto.randomUUID()
}

export function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (n: number) => (n * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
