import { NavLink, useLocation } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  Bell,
  Bookmark,
  ChevronsLeft,
  ClipboardPen,
  CreditCard,
  DollarSign,
  FilePlus,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Kanban,
  Layers,
  LayoutDashboard,
  Map,
  PaintBucket,
  Plug,
  Radio,
  Receipt,
  Search,
  Settings,
  Users,
} from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { cn } from '@/lib/cn'
import { useAppState } from '@/providers/AppState'

const LEAD_LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Live Leads', icon: Radio },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/pipeline', label: 'Pipeline', icon: Kanban },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/saved', label: 'Saved Leads', icon: Bookmark },
  { to: '/searches', label: 'Searches', icon: Search },
  { to: '/materials', label: 'Cabinet Kits', icon: Layers },
  { to: '/quote', label: 'Cabinet Quote', icon: ClipboardPen },
  { to: '/sources', label: 'Sources', icon: Plug },
  { to: '/dev/tester', label: 'Lead Tester', icon: FlaskConical },
  { to: '/dev/sources', label: 'Source Status', icon: Activity },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const SALES_LINKS = [
  { to: '/sales/estimates', label: 'Estimates', icon: FileSpreadsheet },
  { to: '/sales/quotes', label: 'Quotes', icon: FileText },
  { to: '/sales/invoices', label: 'Invoices', icon: Receipt },
  { to: '/sales/customers', label: 'Customers', icon: Users },
  { to: '/sales/pricing', label: 'Pricing', icon: DollarSign },
  { to: '/sales/materials', label: 'Materials', icon: PaintBucket },
  { to: '/sales/payments', label: 'Payments', icon: CreditCard },
  { to: '/sales/change-orders', label: 'Change Orders', icon: FilePlus },
]

export function Sidebar({
  collapsed,
  onToggle,
  mobile,
  onNavigate,
}: {
  collapsed: boolean
  onToggle: () => void
  mobile?: boolean
  onNavigate?: () => void
}) {
  const { settings, unreadCount } = useAppState()
  const showLabel = !collapsed || Boolean(mobile)
  const leadLinks = LEAD_LINKS.filter((link) => link.to !== '/settings')

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-line bg-[#0c0e13]/90 backdrop-blur-xl',
        collapsed && !mobile ? 'w-[84px]' : 'w-[260px]',
      )}
    >
      <div className="flex items-center justify-between px-4 py-5">
        <Logo collapsed={collapsed && !mobile} />
        {!mobile ? (
          <button onClick={onToggle} className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-ink">
            <ChevronsLeft className={cn('h-4 w-4 transition', collapsed && 'rotate-180')} />
          </button>
        ) : null}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {showLabel ? <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Workspace</p> : null}
        {SALES_LINKS.map((link) => (
          <SideLink key={link.to} {...link} showLabel={showLabel} unreadCount={unreadCount} onNavigate={onNavigate} />
        ))}
        <SideLink to="/settings" label="Settings" icon={Settings} showLabel={showLabel} unreadCount={unreadCount} onNavigate={onNavigate} />
        {settings.showLeadIntel ? (
          <>
            {showLabel ? <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-faint">PaintRadar</p> : <div className="my-3 h-px bg-line" />}
            {leadLinks.map((link) => (
              <SideLink key={link.to} {...link} showLabel={showLabel} unreadCount={unreadCount} onNavigate={onNavigate} />
            ))}
          </>
        ) : null}
      </nav>
      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold">
            {settings.ownerName.slice(0, 1)}
          </div>
          {showLabel && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{settings.ownerName}</p>
              <p className="truncate text-xs text-muted">{settings.companyName}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

function SideLink({
  to,
  label,
  icon: Icon,
  showLabel,
  unreadCount,
  onNavigate,
}: {
  to: string
  label: string
  icon: typeof LayoutDashboard
  showLabel: boolean
  unreadCount: number
  onNavigate?: () => void
}) {
  const location = useLocation()
  const jobActive = to === '/sales/change-orders' && location.pathname.startsWith('/sales/jobs')
  return (
    <NavLink
      to={to}
      end={to === '/' || to === '/sales/estimates' || to === '/sales/invoices' || to === '/sales/customers'}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-white/5 hover:text-ink',
          (isActive || jobActive) && 'bg-gold/10 text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive || jobActive ? <span className="absolute left-0 h-6 w-0.5 rounded-full bg-gold shadow-[0_0_12px_#e8b44a]" /> : null}
          <Icon className={cn('h-4 w-4', (isActive || jobActive) && 'text-gold')} />
          {showLabel && <span className="font-medium">{label}</span>}
          {to === '/notifications' && unreadCount > 0 && showLabel ? (
            <span className="ml-auto rounded-full bg-urgent px-1.5 text-[10px] font-bold text-white">{unreadCount}</span>
          ) : null}
        </>
      )}
    </NavLink>
  )
}
