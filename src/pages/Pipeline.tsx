import { motion } from 'framer-motion'
import { PipelineBoard } from '@/components/pipeline/PipelineBoard'

export function Pipeline() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <p className="text-sm text-muted">Drag cards between stages as estimates move forward.</p>
      </div>
      <PipelineBoard />
    </motion.div>
  )
}
