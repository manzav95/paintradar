export const APP_NAME = 'PaintLedger'
export const APP_TAGLINE = 'Estimates & Invoices'
export const LEAD_APP_NAME = 'PaintRadar'
export const LEAD_APP_TAGLINE = 'Lead Intelligence'
export const COMPANY_NAME = 'Pacific Coats Painting'
export const COMPANY_NAME_LINES = ['Pacific Coats', 'Painting'] as const
export const COMPANY_LOGO_SRC = '/pacific-coats-logo.png'
export const COMPANY_LOGO_DARK_SRC = '/pacific-coats-logo-dark.png'
export const COMPANY_ACCENT = '#f5c518'

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
