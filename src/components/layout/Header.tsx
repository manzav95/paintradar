import { Bell, Menu, RefreshCw, Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { APP_NAME, APP_TAGLINE } from '@/lib/brand'
import { RADIUS_OPTIONS } from '@/types'
import { Tooltip } from '@/components/ui/Tooltip'
import { useAppState } from '@/providers/AppState'

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/leads': 'Live Leads',
  '/map': 'Map',
  '/pipeline': 'Pipeline',
  '/analytics': 'Analytics',
  '/saved': 'Saved Leads',
  '/searches': 'Searches',
  '/materials': 'Cabinet Kits',
  '/quote': 'Cabinet Quote',
  '/sources': 'Sources',
  '/dev/tester': 'Lead Tester',
  '/dev/sources': 'Source Status',
  '/notifications': 'Notifications',
  '/settings': 'Settings',
  '/sales/estimates': 'Estimates',
  '/sales/estimates/new': 'New Estimate',
  '/sales/quotes': 'Quotes',
  '/sales/invoices': 'Invoices',
  '/sales/customers': 'Customers',
  '/sales/pricing': 'Pricing',
  '/sales/materials': 'Materials',
  '/sales/payments': 'Payments',
  '/sales/change-orders': 'Change Orders',
  '/sales/jobs': 'Jobs',
}

export function Header({ onMenu }: { onMenu: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { settings, radius, setRadius, runScan, scan, unreadCount, setCommandOpen } = useAppState()
  const title =
    TITLES[location.pathname] ??
    (location.pathname.startsWith('/leads/')
      ? 'Lead Detail'
      : location.pathname.startsWith('/sales/estimates/')
        ? 'Estimate Builder'
        : location.pathname.startsWith('/sales/invoices/')
          ? 'Invoice'
          : location.pathname.startsWith('/sales/customers/')
            ? 'Customer'
            : location.pathname.startsWith('/sales/change-orders/') || location.pathname.startsWith('/sales/jobs/')
              ? 'Job'
              : APP_NAME)

  const leadIntel = settings.showLeadIntel

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-[#0b0d11]/80 px-4 py-3 backdrop-blur-xl">
      <button className="rounded-xl p-2 text-muted hover:bg-white/5 lg:hidden" onClick={onMenu}>
        <Menu className="h-5 w-5" />
      </button>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{title}</p>
        <p className="hidden text-xs text-muted sm:block">
          {leadIntel ? `Monitoring ${settings.homeCity} and nearby cities` : `${settings.companyName} · ${APP_TAGLINE}`}
        </p>
      </div>
      <button
        onClick={() => setCommandOpen(true)}
        className="hidden min-w-[280px] items-center gap-2 rounded-xl border border-line bg-bg-soft px-3 py-2 text-sm text-muted md:flex"
      >
        <Search className="h-4 w-4" />
        {leadIntel ? 'Search leads, cities, services...' : 'Search estimates, invoices, customers...'}
        <span className="ml-auto rounded-md border border-line px-1.5 text-[10px]">⌘K</span>
      </button>
      {leadIntel ? (
        <>
          <select
            value={radius}
            onChange={(event) => setRadius(Number(event.target.value))}
            className="rounded-xl border border-line bg-bg-soft px-3 py-2 text-sm text-ink"
          >
            {RADIUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} mi
              </option>
            ))}
          </select>
          <Tooltip label="Refresh sources">
            <button
              onClick={() => void runScan()}
              className="rounded-xl border border-line p-2 text-muted hover:text-ink"
            >
              <RefreshCw className={`h-4 w-4 ${scan.scanning ? 'animate-spin text-gold' : ''}`} />
            </button>
          </Tooltip>
          <div className="hidden items-center gap-2 rounded-full border border-success/20 bg-success/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-success sm:flex">
            <span className="live-dot" />
            Live
          </div>
          <button onClick={() => navigate('/notifications')} className="relative rounded-xl p-2 text-muted hover:text-ink">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-urgent" />
            ) : null}
          </button>
        </>
      ) : null}
      <button onClick={() => navigate('/settings')} className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold">
        {settings.ownerName.slice(0, 1)}
      </button>
    </header>
  )
}
