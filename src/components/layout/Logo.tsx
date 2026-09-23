import { cn } from '@/lib/cn'

export function Logo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/20 to-transparent ring-1 ring-gold/30">
        <svg viewBox="0 0 32 32" className="h-6 w-6">
          <circle cx="15" cy="16" r="9" fill="none" stroke="#e8b44a" strokeWidth="1.3" opacity="0.35" />
          <circle cx="15" cy="16" r="5.5" fill="none" stroke="#e8b44a" strokeWidth="1.3" opacity="0.7" />
          <circle cx="15" cy="16" r="1.8" fill="#e8b44a" />
          <path d="M15 16 L23 9" stroke="#e8b44a" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M22.2 8.2 h4.2 v2.2 h-1.2 v5.2 c0 1.1-.8 1.8-1.8 1.8h-.2c-1 0-1.8-.7-1.8-1.8V10.4h-1.2z" fill="#f3d07a" />
        </svg>
      </div>
      {!collapsed ? (
        <div>
          <p className="text-[15px] font-extrabold tracking-tight text-ink">PaintRadar</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-gold/80">Lead Intelligence</p>
        </div>
      ) : null}
    </div>
  )
}
