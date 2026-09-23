import type { City } from '@/types'

export const EAST_BAY_CITIES: City[] = [
  { name: 'Antioch', state: 'CA', latitude: 37.982, longitude: -121.806 },
  { name: 'Brentwood', state: 'CA', latitude: 37.932, longitude: -121.696 },
  { name: 'Oakley', state: 'CA', latitude: 37.997, longitude: -121.712 },
  { name: 'Pittsburg', state: 'CA', latitude: 38.028, longitude: -121.885 },
  { name: 'Discovery Bay', state: 'CA', latitude: 37.908, longitude: -121.6 },
  { name: 'Concord', state: 'CA', latitude: 37.978, longitude: -122.031 },
  { name: 'Walnut Creek', state: 'CA', latitude: 37.91, longitude: -122.065 },
  { name: 'Pleasant Hill', state: 'CA', latitude: 37.948, longitude: -122.061 },
  { name: 'Martinez', state: 'CA', latitude: 38.019, longitude: -122.134 },
  { name: 'Danville', state: 'CA', latitude: 37.822, longitude: -121.999 },
  { name: 'San Ramon', state: 'CA', latitude: 37.78, longitude: -121.978 },
  { name: 'Livermore', state: 'CA', latitude: 37.682, longitude: -121.768 },
  { name: 'Tracy', state: 'CA', latitude: 37.74, longitude: -121.425 },
]

export const DEFAULT_HOME = EAST_BAY_CITIES.find((c) => c.name === 'Brentwood')!

export function findCity(name: string) {
  return EAST_BAY_CITIES.find(
    (city) => city.name.toLowerCase() === name.toLowerCase(),
  )
}
