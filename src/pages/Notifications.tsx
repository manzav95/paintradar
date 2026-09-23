import { motion } from 'framer-motion'
import { EmptyState } from '@/components/ui/EmptyState'
import { Button } from '@/components/ui/Button'
import { timeAgo } from '@/lib/format'
import { useAppState } from '@/providers/AppState'

export function Notifications() {
  const { notifications, markNotificationsRead, setSelectedLeadId } = useAppState()
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted">In-app alerts from the live radar.</p>
        </div>
        <Button size="sm" onClick={markNotificationsRead}>
          Mark all read
        </Button>
      </div>
      {notifications.length === 0 ? (
        <EmptyState
          title="All quiet on the radar."
          subtitle="When a hot homeowner request comes in, it will land here and as a toast."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <button
              key={item.id}
              onClick={() => item.leadId && setSelectedLeadId(item.leadId)}
              className={`w-full rounded-2xl border px-4 py-4 text-left ${item.read ? 'border-line bg-surface' : 'border-gold/25 bg-gold/5'}`}
            >
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-muted">{item.body}</p>
              <p className="mt-2 text-xs text-faint">{timeAgo(item.createdAt)}</p>
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
