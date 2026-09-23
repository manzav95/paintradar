import { timeAgo } from '@/lib/format'
import { useAppState } from '@/providers/AppState'
import { formatDistanceToNow } from 'date-fns'

export function ScannerStatus() {
  const { scan } = useAppState()
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-3 text-xs text-muted">
      <span className="flex items-center gap-2 font-semibold text-gold">
        <span className={scan.scanning ? 'live-dot' : 'h-2 w-2 rounded-full bg-gold/50'} />
        {scan.scanning ? 'SCANNING SOURCES...' : 'Radar standing by'}
      </span>
      <span>Last scan: {scan.lastScanAt ? timeAgo(scan.lastScanAt) : '—'}</span>
      <span>
        Next scan:{' '}
        {scan.nextScanAt ? `in ${formatDistanceToNow(new Date(scan.nextScanAt))}` : 'scheduled'}
      </span>
    </div>
  )
}
