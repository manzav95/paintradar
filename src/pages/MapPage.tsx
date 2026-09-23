import { motion } from 'framer-motion'
import { MapPreview } from '@/components/map/MapPreview'

export function MapPage() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Map</h1>
        <p className="text-sm text-muted">Pins are colored by urgency. Click any marker for a preview.</p>
      </div>
      <MapPreview />
    </motion.div>
  )
}
