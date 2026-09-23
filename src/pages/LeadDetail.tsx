import type { ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { LeadScore } from '@/components/leads/LeadScore'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { ContactBlock } from '@/components/leads/ContactBlock'
import { categoryLabel, formatCurrency, formatDateTime, formatMiles, formatValueRange, timeAgo } from '@/lib/format'
import { useAppState, useLeadIntelligence } from '@/providers/AppState'
import { SOURCE_LABELS } from '@/types'

export function LeadDetail() {
  const { id } = useParams()
  const { leads, setLeadStatus, toggleSaved, dismissLead, notesFor, activityFor } = useAppState()
  const lead = leads.find((item) => item.id === id) ?? null
  const intel = useLeadIntelligence(lead)

  if (!lead) {
    return <EmptyState title="Lead not found." subtitle="It may have been dismissed or has not been ingested yet." />
  }

  const notes = notesFor(lead.id)
  const activity = activityFor(lead.id)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold">{lead.customerName}</h1>
            <UrgencyBadge urgency={lead.urgency} />
          </div>
          <p className="mt-2 text-sm text-muted">
            {lead.city}, {lead.state} · {formatMiles(lead.distanceMiles)} · {SOURCE_LABELS[lead.source]}
          </p>
        </div>
        <LeadScore score={lead.score} size="lg" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => setLeadStatus(lead.id, 'contacted')}>Mark Contacted</Button>
        <Button onClick={() => toggleSaved(lead.id)}>{lead.saved ? 'Saved' : 'Save Lead'}</Button>
        <Button onClick={() => setLeadStatus(lead.id, 'estimate_scheduled')}>Add to Pipeline</Button>
        <Button variant="danger" onClick={() => dismissLead(lead.id)}>Dismiss</Button>
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gold">Contact</h2>
        <ContactBlock lead={lead} />
      </section>

      <Grid title="Overview">
        <Item label="Project" value={categoryLabel(lead.category)} />
        <Item label="Posted" value={formatDateTime(lead.postedAt)} />
        <Item label="Detected" value={timeAgo(lead.detectedAt)} />
        <Item label="Estimate" value={formatValueRange(lead.estimatedValueLow, lead.estimatedValueHigh)} />
        <Item label="Confidence" value={`${lead.confidence}% estimated`} />
        <Item label="Status" value={lead.status.replaceAll('_', ' ')} />
      </Grid>

      {lead.quote ? (
        <Grid title="Quote worksheet">
          <Item label="Scope" value={lead.quote.scope} />
          <Item label="Material group" value={lead.quote.materialGroupName || '—'} />
          <Item label="Doors" value={`${lead.quote.doorQty} × ${formatCurrency(lead.quote.doorPrice)}`} />
          <Item label="Drawers" value={`${lead.quote.drawerQty} × ${formatCurrency(lead.quote.drawerPrice)}`} />
          <Item label="Labor total" value={formatCurrency(lead.quote.laborTotal)} />
          <Item label="Timeline" value={lead.quote.timeline} />
        </Grid>
      ) : null}

      <Card title="Homeowner request">
        <p className="text-sm leading-7 text-ink/90">{lead.description}</p>
      </Card>

      <Card title="Photos">
        {lead.hasPhotos ? (
          <div className="grid gap-3 md:grid-cols-3">
            {lead.photos.map((photo) => (
              <img key={photo.id} src={photo.imageUrl} alt="" className="h-40 w-full rounded-2xl object-cover" />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No photos were attached to this request.</p>
        )}
      </Card>

      {intel ? (
        <Card title="Lead intelligence">
          <div className="grid gap-3 md:grid-cols-2">
            <Item label="Likely job size" value={intel.likelyJobSize} />
            <Item label="Likely budget range" value={intel.likelyBudget} />
            <Item label="Travel distance" value={intel.travelDistance} />
            <Item label="Lead quality" value={intel.quality} />
            <Item label="Suggested response speed" value={intel.suggestedResponse} />
          </div>
          <div className="mt-4 rounded-2xl border border-gold/20 bg-gold/5 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-gold">Recommended action</p>
            <p className="mt-2 font-semibold">{intel.recommendedAction}</p>
            <p className="mt-2 text-sm text-muted">{intel.reason}</p>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Activity">
          {activity.length ? activity.map((item) => (
            <p key={item.id} className="border-b border-line py-2 text-sm text-muted">
              {item.action} · {timeAgo(item.createdAt)}
            </p>
          )) : <p className="text-sm text-muted">No activity yet.</p>}
        </Card>
        <Card title="Notes">
          {notes.length ? notes.map((item) => (
            <p key={item.id} className="rounded-xl bg-white/5 px-3 py-2 text-sm text-muted">{item.note}</p>
          )) : <p className="text-sm text-muted">No notes yet.</p>}
        </Card>
      </div>

      <Card title="Follow-up">
        <p className="text-sm text-muted">
          Suggested next step is an estimate conversation, not a hard commitment. Use the pipeline to schedule or send a quote.
        </p>
      </Card>
    </motion.div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gold">{title}</h2>
      {children}
    </section>
  )
}

function Grid({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gold">{title}</h2>
      <div className="grid gap-3 md:grid-cols-3">{children}</div>
    </section>
  )
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/4 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 text-sm">{value}</p>
    </div>
  )
}
