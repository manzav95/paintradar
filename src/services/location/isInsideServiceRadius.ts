import { DEFAULT_SERVICE_RADIUS_MILES } from '@/services/leads/config'

export function isInsideServiceRadius(distanceMiles: number, radiusMiles = DEFAULT_SERVICE_RADIUS_MILES) {
  return distanceMiles <= radiusMiles
}
