import { haversineMiles } from '@/lib/format'

export function calculateDistanceMiles(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
) {
  return Number(haversineMiles(from.latitude, from.longitude, to.latitude, to.longitude).toFixed(1))
}
