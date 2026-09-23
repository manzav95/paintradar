import { Flame, MapPin, PhoneCall, Sparkles, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { BestOpportunities } from '@/components/dashboard/BestOpportunities'
import { RadarWidget } from '@/components/dashboard/RadarWidget'
import { ScannerStatus } from '@/components/dashboard/ScannerStatus'
import { StatCard } from '@/components/dashboard/StatCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { LeadCard } from '@/components/leads/LeadCard'
import { greetingForNow } from '@/lib/format'
import { useAppState } from '@/providers/AppState'

export function Dashboard() {
  const {
    settings,
    visibleLeads,
    leads,
    radius,
    highlightedIds,
    setSelectedLeadId,
    toggleSaved,
    dismissLead,
    setLeadStatus,
    runScan,
    scan,
    lastScanReport,
  } = useAppState()

  const today = leads.filter((lead) => Date.now() - new Date(lead.postedAt).getTime() < 86400000 && lead.status !== 'dismissed')
  const hot = visibleLeads.filter((lead) => lead.urgency === 'hot' || lead.score >= 90)
  const nearby = visibleLeads.filter((lead) => lead.distanceMiles <= 10)
  const pipelineValue = leads
    .filter((lead) => !['lost', 'dismissed', 'won'].includes(lead.status))
    .reduce((sum, lead) => sum + (lead.estimatedValueLow + lead.estimatedValueHigh) / 2, 0)
  const followUp = leads.filter((lead) => lead.status === 'contacted' || lead.status === 'estimate_sent')

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm text-gold">{greetingForNow()}, {settings.ownerName}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Let's find your next painting job.</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted">
            <span className="live-dot" />
            Monitoring homeowner requests within {radius} miles
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <button
            onClick={() => void runScan()}
            className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-[#1a1406] disabled:opacity-60"
            disabled={scan.scanning}
          >
            {scan.scanning ? 'Scanning sources…' : 'Scan Now'}
          </button>
          <ScannerStatus />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="New Leads Today" value={today.length} delta={`+${Math.max(0, today.length - 6)} since yesterday`} icon={<Sparkles className="h-4 w-4" />} spark={[4, 6, 5, 8, 9, today.length]} />
        <StatCard label="Hot Leads" value={hot.length} delta={`${hot.filter((lead) => Date.now() - new Date(lead.postedAt).getTime() < 3600000).length} posted within the last hour`} icon={<Flame className="h-4 w-4" />} spark={[1, 2, 2, 3, 4, hot.length]} />
        <StatCard label="Within 10 Miles" value={nearby.length} delta="Closest homeowners first" icon={<MapPin className="h-4 w-4" />} spark={[3, 4, 4, 5, nearby.length]} />
        <StatCard label="Estimated Pipeline Value" value={Math.round(pipelineValue)} prefix="$" delta="estimated opportunity value" icon={<Wallet className="h-4 w-4" />} spark={[12000, 18000, 24000, 31000, pipelineValue]} />
        <StatCard label="Needs Follow-Up" value={followUp.length} delta="Contacted or estimate sent" icon={<PhoneCall className="h-4 w-4" />} spark={[2, 3, 2, 4, followUp.length]} />
      </div>

      {lastScanReport ? (
        <div className="grid gap-3 sm:grid-cols-5">
          <ScanMetric label="Posts checked" value={lastScanReport.postsChecked} />
          <ScanMetric label="Possible leads" value={lastScanReport.possibleLeads} />
          <ScanMetric label="Qualified leads" value={lastScanReport.qualifiedLeads} />
          <ScanMetric label="Duplicates" value={lastScanReport.duplicates} />
          <ScanMetric label="Outside radius" value={lastScanReport.outsideRadius} />
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        <RadarWidget />
        <ActivityFeed />
      </div>

      <BestOpportunities />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Live Opportunities</h2>
          <p className="text-xs text-muted">{visibleLeads.length} in view</p>
        </div>
        {visibleLeads.length === 0 ? (
          <EmptyState
            title="No hot leads right now."
            subtitle="The radar is still spinning. New homeowner requests will appear here automatically."
          />
        ) : (
          <div className="grid gap-4">
            {visibleLeads.slice(0, 6).map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                highlighted={highlightedIds.includes(lead.id)}
                onOpen={() => setSelectedLeadId(lead.id)}
                onSave={() => toggleSaved(lead.id)}
                onDismiss={() => dismissLead(lead.id)}
                onContact={() => setLeadStatus(lead.id, 'contacted')}
              />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  )
}

function ScanMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
    </div>
  )
}
