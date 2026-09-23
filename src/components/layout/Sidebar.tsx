import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Bookmark,
  ChevronsLeft,
  Kanban,
  LayoutDashboard,
  Map,
  ClipboardPen,
  Layers,
  Plug,
  Radio,
  Search,
  Settings,
  FlaskConical,
  Activity,
} from 'lucide-react'
import { Logo } from '@/components/layout/Logo'
import { cn } from '@/lib/cn'
import { useAppState } from '@/providers/AppState'

const LINKS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', label: 'Live Leads', icon: Radio },
  { to: '/map', label: 'Map', icon: Map },
  { to: '/pipeline', label: 'Pipeline', icon: Kanban },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/saved', label: 'Saved Leads', icon: Bookmark },
  { to: '/searches', label: 'Searches', icon: Search },
  { to: '/materials', label: 'Materials', icon: Layers },
  { to: '/quote', label: 'Client Quote', icon: ClipboardPen },
  { to: '/sources', label: 'Sources', icon: Plug },
  { to: '/dev/tester', label: 'Lead Tester', icon: FlaskConical },
  { to: '/dev/sources', label: 'Source Status', icon: Activity },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
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
      <nav className="flex-1 space-y-1 px-3">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-white/5 hover:text-ink',
                isActive && 'bg-gold/10 text-ink',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? <span className="absolute left-0 h-6 w-0.5 rounded-full bg-gold shadow-[0_0_12px_#e8b44a]" /> : null}
                <link.icon className={cn('h-4 w-4', isActive && 'text-gold')} />
                {(!collapsed || mobile) && <span className="font-medium">{link.label}</span>}
                {link.to === '/notifications' && unreadCount > 0 && (!collapsed || mobile) ? (
                  <span className="ml-auto rounded-full bg-urgent px-1.5 text-[10px] font-bold text-white">{unreadCount}</span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold">
            {settings.ownerName.slice(0, 1)}
          </div>
          {(!collapsed || mobile) && (
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
