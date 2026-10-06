export const APP_NAME = 'PaintLedger'
export const APP_TAGLINE = 'Estimates & Invoices'
export const LEAD_APP_NAME = 'PaintRadar'
export const LEAD_APP_TAGLINE = 'Lead Intelligence'

export const LEAD_PATHS = [
  '/',
  '/leads',
  '/map',
  '/pipeline',
  '/analytics',
  '/saved',
  '/searches',
  '/materials',
  '/quote',
  '/sources',
  '/dev/tester',
  '/dev/sources',
  '/notifications',
]

export function isLeadPath(pathname: string) {
  if (pathname === '/') return true
  return LEAD_PATHS.some((path) => path !== '/' && (pathname === path || pathname.startsWith(`${path}/`)))
}
