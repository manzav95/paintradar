import { DEFAULT_HOME, EAST_BAY_CITIES, findCity } from '@/data/cities'

const STATE_ALIASES: Record<string, string> = {
  ca: 'CA',
  california: 'CA',
  calif: 'CA',
}

export interface GeocodedLocation {
  city: string
  state: string
  latitude: number
  longitude: number
  approximate: boolean
}

export function normalizeState(value?: string | null) {
  if (!value) return 'CA'
  const key = value.trim().toLowerCase()
  return STATE_ALIASES[key] ?? value.trim().slice(0, 2).toUpperCase()
}

export function normalizeCityName(value?: string | null) {
  if (!value) return null
  const trimmed = value.replace(/\s+/g, ' ').trim()
  if (!trimmed) return null
  const known = findCity(trimmed)
  if (known) return known.name
  return trimmed
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

export function extractCityFromText(text: string) {
  const haystack = text.toLowerCase()
  return EAST_BAY_CITIES.find((city) => haystack.includes(city.name.toLowerCase())) ?? null
}

export async function geocodeLocation(
  city?: string | null,
  state?: string | null,
  fallback = DEFAULT_HOME,
): Promise<GeocodedLocation> {
  const known = city ? findCity(city) : null
  if (known) {
    return {
      city: known.name,
      state: known.state,
      latitude: known.latitude,
      longitude: known.longitude,
      approximate: true,
    }
  }

  const apiKey = import.meta.env.VITE_GEOCODING_API_KEY
  if (apiKey && city) {
    try {
      const query = encodeURIComponent(`${city}, ${normalizeState(state)}`)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${query}`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'PaintRadar/1.0' } },
      )
      if (response.ok) {
        const rows = (await response.json()) as Array<{ lat: string; lon: string; display_name?: string }>
        const first = rows[0]
        if (first) {
          return {
            city: normalizeCityName(city) ?? fallback.name,
            state: normalizeState(state),
            latitude: Number(first.lat),
            longitude: Number(first.lon),
            approximate: true,
          }
        }
      }
    } catch (error) {
      console.warn('[geocode] lookup failed, using city fallback', error)
    }
  }

  return {
    city: normalizeCityName(city) ?? fallback.name,
    state: normalizeState(state ?? fallback.state),
    latitude: fallback.latitude,
    longitude: fallback.longitude,
    approximate: true,
  }
}
