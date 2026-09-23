import { AnimatePresence, motion } from 'framer-motion'
import { Bookmark, ExternalLink, NotebookPen, X } from 'lucide-react'
import { ContactBlock } from '@/components/leads/ContactBlock'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { LeadScore } from '@/components/leads/LeadScore'
import { categoryLabel, formatMiles, formatValueRange, timeAgo } from '@/lib/format'
import { useAppState, useLeadIntelligence } from '@/providers/AppState'
import { SOURCE_LABELS } from '@/types'

export function LeadDrawer() {
  const {
    selectedLead,
    setSelectedLeadId,
    toggleSaved,
    dismissLead,
    setLeadStatus,
    addNote,
    notesFor,
  } = useAppState()
  const intel = useLeadIntelligence(selectedLead)
  const [note, setNote] = useState('')

  return (
    <AnimatePresence>
      {selectedLead ? (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l border-line bg-[#101218]/96 shadow-card backdrop-blur-xl"
        >
          <div className="flex items-start justify-between border-b border-line p-5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{selectedLead.customerName}</h2>
                <UrgencyBadge urgency={selectedLead.urgency} />
              </div>
              <p className="mt-1 text-sm text-muted">
                {selectedLead.city}, {selectedLead.state} · {formatMiles(selectedLead.distanceMiles)}
              </p>
            </div>
            <button onClick={() => setSelectedLeadId(null)} className="rounded-xl p-2 text-muted hover:bg-white/5">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-6 overflow-y-auto p-5">
            <LeadScore score={selectedLead.score} size="lg" />
            <ContactBlock lead={selectedLead} />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Meta label="Project" value={categoryLabel(selectedLead.category)} />
              <Meta label="Source" value={SOURCE_LABELS[selectedLead.source]} />
              <Meta label="Posted" value={timeAgo(selectedLead.postedAt)} />
              <Meta label="Estimate" value={formatValueRange(selectedLead.estimatedValueLow, selectedLead.estimatedValueHigh)} />
            </div>
            {selectedLead.quote ? (
              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4 text-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Quote worksheet</p>
                <p className="mt-2 text-ink">{selectedLead.quote.scope}</p>
                <p className="mt-1 text-muted">
                  {selectedLead.quote.doorQty} doors · {selectedLead.quote.drawerQty} drawers · {selectedLead.quote.materialGroupName || 'No material group'}
                </p>
              </div>
            ) : null}
            <p className="text-sm leading-6 text-ink/90">{selectedLead.description}</p>
            {selectedLead.hasPhotos ? (
              <div className="grid grid-cols-2 gap-2">
                {selectedLead.photos.map((photo) => (
                  <img key={photo.id} src={photo.imageUrl} alt="" className="h-28 w-full rounded-xl object-cover" />
                ))}
              </div>
            ) : null}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Keywords detected</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedLead.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-gold">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            {intel ? (
              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Recommended action</p>
                <p className="mt-2 text-sm font-semibold text-ink">{intel.recommendedAction}</p>
                <p className="mt-2 text-xs leading-5 text-muted">{intel.reason}</p>
              </div>
            ) : null}
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Add note</p>
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Call notes, access, colors..." />
              <Button
                className="mt-2"
                size="sm"
                onClick={() => {
                  if (!note.trim()) return
                  addNote(selectedLead.id, note.trim())
                  setNote('')
                }}
              >
                <NotebookPen className="h-3.5 w-3.5" />
                Save note
              </Button>
              <div className="mt-3 space-y-2">
                {notesFor(selectedLead.id).map((item) => (
                  <p key={item.id} className="rounded-xl bg-white/5 px-3 py-2 text-xs text-muted">
                    {item.note}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-line p-4">
            <Button variant="primary" onClick={() => setLeadStatus(selectedLead.id, 'contacted')}>
              Mark Contacted
            </Button>
            <Button variant={selectedLead.saved ? 'gold' : 'secondary'} onClick={() => toggleSaved(selectedLead.id)}>
              <Bookmark className="h-4 w-4" />
              Save Lead
            </Button>
            <Button onClick={() => setLeadStatus(selectedLead.id, 'new')}>Add to Pipeline</Button>
            <Button variant="danger" onClick={() => dismissLead(selectedLead.id)}>
              Dismiss
            </Button>
            <Link
              to={`/leads/${selectedLead.id}`}
              className="col-span-2 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-line text-sm font-semibold text-muted hover:text-ink"
            >
              Open full lead
            </Link>
            {selectedLead.sourceUrl ? (
              <a
                href={selectedLead.sourceUrl}
                className="col-span-2 inline-flex items-center justify-center gap-2 text-sm text-gold"
              >
                <ExternalLink className="h-4 w-4" />
                Open source
              </a>
            ) : (
              <p className="col-span-2 text-center text-xs text-faint">Source link available when a provider supplies one.</p>
            )}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/4 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-sm text-ink">{value}</p>
    </div>
  )
}
