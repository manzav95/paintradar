import { motion } from 'framer-motion'
import { FilterBar } from '@/components/leads/FilterBar'
import { LeadCard } from '@/components/leads/LeadCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAppState } from '@/providers/AppState'

export function LiveLeads() {
  const { visibleLeads, highlightedIds, setSelectedLeadId, toggleSaved, dismissLead, setLeadStatus } = useAppState()

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Live Leads</h1>
        <p className="text-sm text-muted">Every homeowner request currently inside your radar.</p>
      </div>
      <FilterBar />
      {visibleLeads.length === 0 ? (
        <EmptyState
          title="No matching leads in this filter."
          subtitle="Widen the radius or clear a filter. The scanner will keep watching."
        />
      ) : (
        <div className="grid gap-4">
          {visibleLeads.map((lead) => (
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
    </motion.div>
  )
}
