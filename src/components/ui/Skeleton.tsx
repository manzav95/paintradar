import { cn } from '@/lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-xl', className)} />
}

export function LeadCardSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <Skeleton className="mt-5 h-16 w-full" />
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  )
}

export function ScannerOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-bg/60 backdrop-blur-sm">
      <div className="w-[360px] rounded-3xl border border-line bg-surface p-8 text-center shadow-card">
        <div className="relative mx-auto mb-5 h-20 w-20">
          <div className="absolute inset-0 rounded-full border border-gold/20" />
          <div className="absolute inset-2 rounded-full border border-gold/30" />
          <div className="absolute inset-0 animate-[scan-sweep_2.4s_linear_infinite] rounded-full border-t border-gold" />
          <div className="absolute inset-[34%] rounded-full bg-gold" />
        </div>
        <p className="text-sm font-semibold text-ink">Scanning local opportunities...</p>
        <p className="mt-2 text-xs text-muted">Checking configured lead sources.</p>
      </div>
    </div>
  )
}
