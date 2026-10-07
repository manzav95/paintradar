import { APP_NAME, APP_TAGLINE, COMPANY_LOGO_DARK_SRC, COMPANY_NAME } from '@/lib/brand'
import { cn } from '@/lib/cn'

export function Logo({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img src={COMPANY_LOGO_DARK_SRC} alt={COMPANY_NAME} className="h-10 w-10 object-contain" />
      {!collapsed ? (
        <div>
          <p className="text-[15px] font-extrabold tracking-tight text-ink">{APP_NAME}</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-gold/80">{APP_TAGLINE}</p>
        </div>
      ) : null}
    </div>
  )
}
