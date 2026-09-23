import { AnimatePresence, motion } from 'framer-motion'
import { Flame, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAppState } from '@/providers/AppState'
import type { ToastMessage } from '@/types'

function toneClass(tone: ToastMessage['tone']) {
  if (tone === 'hot') return 'border-hot/30 bg-[#2a1b0c]'
  if (tone === 'urgent') return 'border-urgent/30 bg-[#2a1410]'
  if (tone === 'success') return 'border-success/30 bg-[#102218]'
  return 'border-info/30 bg-[#101820]'
}

export function NotificationToast() {
  const { toasts, dismissToast, setSelectedLeadId } = useAppState()

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[70] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 40, y: -8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className={cn('pointer-events-auto rounded-2xl border p-4 shadow-card backdrop-blur', toneClass(toast.tone))}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-gold">
                {toast.tone === 'hot' ? <Flame className="h-4 w-4" /> : <Info className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 whitespace-pre-line text-xs leading-5 text-muted">{toast.description}</p>
                ) : null}
              </div>
              <button onClick={() => dismissToast(toast.id)} className="text-muted hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            {toast.description?.includes('Score') ? (
              <button
                className="mt-3 text-xs font-semibold text-gold"
                onClick={() => {
                  const match = toast.description?.match(/lead_/i)
                  if (match) setSelectedLeadId(null)
                }}
              >
                View in radar
              </button>
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
