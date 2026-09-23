import { PlugZap } from 'lucide-react'
import { timeAgo } from '@/lib/format'
import type { SourceHealth } from '@/services/leadSources'

const statusCopy: Record<SourceHealth['status'], string> = {
  connected: 'Connected',
  adapter_ready: 'Integration Adapter Ready',
  placeholder: 'Future source',
  manual: 'Manual capture',
}

export function SourceCard({ source }: { source: SourceHealth }) {
  return (
    <article className="card-hover rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-ink">{source.label}</h3>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-gold">{statusCopy[source.status]}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-2 text-gold">
          <PlugZap className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">{source.description}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/4 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Last sync</p>
          <p className="mt-1 text-ink">{source.lastSync ? timeAgo(source.lastSync) : 'Not yet'}</p>
        </div>
        <div className="rounded-xl bg-white/4 px-3 py-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Leads found</p>
          <p className="mt-1 text-ink">{source.leadsFound}</p>
        </div>
      </div>
    </article>
  )
}
