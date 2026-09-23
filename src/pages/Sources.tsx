import { motion } from 'framer-motion'
import { SourceCard } from '@/components/sources/SourceCard'
import { useAppState } from '@/providers/AppState'

export function Sources() {
  const { sources } = useAppState()
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Sources</h1>
        <p className="text-sm text-muted">
          Lead providers are modular. Demo and manual are live. Nextdoor is an adapter waiting for an authorized connection.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {sources.map((source) => (
          <SourceCard key={source.name} source={source} />
        ))}
      </div>
    </motion.div>
  )
}
