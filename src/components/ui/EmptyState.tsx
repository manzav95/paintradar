import type { ReactNode } from 'react'
import { Radio } from 'lucide-react'

export function EmptyState({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface/60 px-8 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gold/10 text-gold">
        <Radio className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{subtitle}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
