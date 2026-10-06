import { APP_NAME, APP_TAGLINE } from '@/lib/brand'
import { cn } from '@/lib/cn'

export function Logo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-transparent ring-1 ring-gold/30">
        <svg viewBox="0 0 32 32" className="h-6 w-6">
          <rect x="7" y="6" width="18" height="20" rx="2.5" fill="none" stroke="#e8b44a" strokeWidth="1.4" />
          <path d="M11 12h10M11 16h10M11 20h7" stroke="#f3d07a" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      {!collapsed ? (
        <div>
          <p className="text-[15px] font-extrabold tracking-tight text-ink">{APP_NAME}</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-gold/80">{APP_TAGLINE}</p>
        </div>
      ) : null}
    </div>
  )
}
