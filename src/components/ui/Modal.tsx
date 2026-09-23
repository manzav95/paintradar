import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            onClick={(event) => event.stopPropagation()}
            className={`max-h-[90vh] overflow-y-auto rounded-3xl border border-line bg-surface p-6 shadow-card ${wide ? 'w-full max-w-3xl' : 'w-full max-w-xl'}`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">{title}</h2>
                {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
              </div>
              <button onClick={onClose} className="rounded-xl p-2 text-muted hover:bg-white/5 hover:text-ink">
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
