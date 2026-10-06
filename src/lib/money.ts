export function dollarsToCents(value: number) {
  return Math.round(value * 100)
}

export function centsToDollars(cents: number) {
  return cents / 100
}

export function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(centsToDollars(cents))
}

export function addCents(...values: number[]) {
  return values.reduce((sum, value) => sum + Math.round(value), 0)
}

/** Stored percents are 10.5 for 10.5%. Legacy decimals like 0.4 become 40. */
export function normalizeLegacyPercent(value: number) {
  if (!Number.isFinite(value) || value === 0) return 0
  if (value > 0 && value <= 1) return value * 100
  return value
}

export function percentToRate(percent: number) {
  return normalizeLegacyPercent(percent) / 100
}

export function formatPercent(percent: number) {
  const value = normalizeLegacyPercent(percent)
  return `${Number(value.toFixed(2))}%`
}

export function markedUpCents(costCents: number, markupPercent: number) {
  return Math.round(costCents * (1 + percentToRate(markupPercent)))
}

export function markupAmountCents(costCents: number, markupPercent: number) {
  return markedUpCents(costCents, markupPercent) - costCents
}

export function parseMeasurement(raw: string): number {
  const value = raw.trim().toLowerCase()
  if (!value) return 0
  const feetInches = value.match(/^(\d+(?:\.\d+)?)\s*(?:'|ft|feet)?\s*[- ]?\s*(\d+(?:\.\d+)?)\s*(?:"|in|inch|inches)?$/)
  if (feetInches && (value.includes("'") || value.includes('ft') || value.includes('"'))) {
    return Number(feetInches[1]) + Number(feetInches[2]) / 12
  }
  const compact = value.match(/^(\d+)'\s*(\d+(?:\.\d+)?)\"?$/)
  if (compact) return Number(compact[1]) + Number(compact[2]) / 12
  const numeric = Number(value.replace(/[^0-9.]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

export function formatFeet(value: number) {
  if (!value) return ''
  const whole = Math.floor(value)
  const inches = Math.round((value - whole) * 12)
  if (inches === 0) return `${whole}`
  if (inches === 12) return `${whole + 1}`
  return `${whole}' ${inches}"`
}

export function roundGallonsUp(value: number) {
  if (value <= 0) return 0
  return Math.ceil(value)
}

export function nextDocumentNumber(prefix: 'EST' | 'INV' | 'CO', existing: string[]) {
  const year = new Date().getFullYear()
  const needle = `${prefix}-${year}-`
  let max = 0
  for (const value of existing) {
    if (!value.startsWith(needle)) continue
    const n = Number(value.slice(needle.length))
    if (n > max) max = n
  }
  return `${needle}${String(max + 1).padStart(4, '0')}`
}
