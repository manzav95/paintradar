import { motion } from 'framer-motion'
import { LeadCard } from '@/components/leads/LeadCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAppState } from '@/providers/AppState'

export function SavedLeads() {
  const { leads, highlightedIds, setSelectedLeadId, toggleSaved, dismissLead, setLeadStatus } = useAppState()
  const saved = leads.filter((lead) => lead.saved && lead.status !== 'dismissed')

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Saved Leads</h1>
        <p className="text-sm text-muted">Opportunities you want to keep on the board.</p>
      </div>
      {saved.length === 0 ? (
        <EmptyState
          title="Nothing saved yet."
          subtitle="Bookmark a live opportunity and it will wait here while the radar keeps spinning."
        />
      ) : (
        <div className="grid gap-4">
          {saved.map((lead) => (
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
