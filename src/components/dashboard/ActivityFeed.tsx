import { motion } from 'framer-motion'
import { timeAgo } from '@/lib/format'
import { useAppState } from '@/providers/AppState'

export function ActivityFeed() {
  const { activity, leads, setSelectedLeadId } = useAppState()

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Live Activity</h3>
        <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-success">
          <span className="live-dot" />
          Live
        </span>
      </div>
      <div className="space-y-3">
        {activity.slice(0, 10).map((item) => {
          const lead = leads.find((entry) => entry.id === item.leadId)
          return (
            <motion.button
              key={item.id}
              layout
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => item.leadId && setSelectedLeadId(item.leadId)}
              className="w-full rounded-xl border border-transparent px-3 py-2 text-left hover:border-line hover:bg-white/4"
            >
              <p className="text-sm text-ink">{item.action}</p>
              <p className="mt-1 text-xs text-muted">
                {lead?.city ?? 'PaintRadar'} · {timeAgo(item.createdAt)}
              </p>
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}
