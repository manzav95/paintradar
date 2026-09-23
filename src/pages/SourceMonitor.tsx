import { motion } from 'framer-motion'
import { timeAgo } from '@/lib/format'
import { useAppState } from '@/providers/AppState'
import type { SourceRuntimeStatus } from '@/types/lead'

const STATUS_CLASS: Record<SourceRuntimeStatus, string> = {
  Healthy: 'text-success',
  Warning: 'text-gold',
  Offline: 'text-urgent',
  'Not Configured': 'text-muted',
  'Adapter Ready': 'text-gold',
}

export function SourceMonitor() {
  const { sourceStats, lastScanReport, runScan, scan } = useAppState()

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">Developer Tools</p>
          <h1 className="mt-1 text-2xl font-bold">Source Status</h1>
          <p className="mt-2 text-sm text-muted">
            Each provider fails independently. Reddit uses the official API only when credentials are present.
          </p>
        </div>
        <button
          onClick={() => void runScan()}
          className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-[#1a1406]"
        >
          {scan.scanning ? 'Scanning sources…' : 'Scan Now'}
        </button>
      </div>

      {lastScanReport ? (
        <div className="grid gap-3 sm:grid-cols-5">
          <Metric label="Posts checked" value={lastScanReport.postsChecked} />
          <Metric label="Possible leads" value={lastScanReport.possibleLeads} />
          <Metric label="Qualified" value={lastScanReport.qualifiedLeads} />
          <Metric label="Duplicates" value={lastScanReport.duplicates} />
          <Metric label="Outside radius" value={lastScanReport.outsideRadius} />
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/4 text-[11px] uppercase tracking-[0.14em] text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Provider</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Last Scan</th>
              <th className="px-4 py-3 font-semibold">Posts Checked</th>
              <th className="px-4 py-3 font-semibold">Qualified Leads</th>
              <th className="px-4 py-3 font-semibold">Errors</th>
            </tr>
          </thead>
          <tbody>
            {sourceStats.map((source) => (
              <tr key={source.name} className="border-t border-line">
                <td className="px-4 py-3 font-semibold text-ink">{source.name}</td>
                <td className={`px-4 py-3 font-semibold ${STATUS_CLASS[source.status]}`}>{source.status}</td>
                <td className="px-4 py-3 text-muted">{source.lastScan ? timeAgo(source.lastScan) : '—'}</td>
                <td className="px-4 py-3 text-ink">{source.postsChecked}</td>
                <td className="px-4 py-3 text-ink">{source.qualifiedLeads}</td>
                <td className="px-4 py-3 text-xs text-urgent">{source.error ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
    </div>
  )
}
