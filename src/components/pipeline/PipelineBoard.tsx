import { DndContext, PointerSensor, useDraggable, useDroppable, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { LEAD_STATUSES, STATUS_LABELS, type Lead, type LeadStatus } from '@/types'
import { categoryLabel, formatCurrency } from '@/lib/format'
import { useAppState } from '@/providers/AppState'

const COLUMNS: LeadStatus[] = ['new', 'contacted', 'estimate_scheduled', 'estimate_sent', 'won', 'lost']

export function PipelineBoard() {
  const { leads, setLeadStatus, setSelectedLeadId } = useAppState()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragEnd = (event: DragEndEvent) => {
    const over = event.over?.id
    if (typeof over === 'string' && LEAD_STATUSES.includes(over as LeadStatus)) {
      setLeadStatus(String(event.active.id), over as LeadStatus)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <Column
            key={status}
            status={status}
            leads={leads.filter((lead) => lead.status === status)}
            onOpen={setSelectedLeadId}
          />
        ))}
      </div>
    </DndContext>
  )
}

function Column({
  status,
  leads,
  onOpen,
}: {
  status: LeadStatus
  leads: Lead[]
  onOpen: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  return (
    <section
      ref={setNodeRef}
      className={`min-w-[260px] flex-1 rounded-2xl border p-3 ${isOver ? 'border-gold/40 bg-gold/5' : 'border-line bg-surface'}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
        <span className="text-xs text-muted">{leads.length}</span>
      </div>
      <div className="space-y-3">
        {leads.map((lead) => (
          <PipelineCard key={lead.id} lead={lead} onOpen={() => onOpen(lead.id)} />
        ))}
      </div>
    </section>
  )
}

function PipelineCard({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: lead.id })
  return (
    <article
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`cursor-grab rounded-xl border border-line bg-[#141821] p-3 ${isDragging ? 'opacity-70' : ''}`}
    >
      <p className="text-sm font-semibold">{lead.customerName}</p>
      <p className="mt-1 text-xs text-gold">{categoryLabel(lead.category)}</p>
      <p className="mt-1 text-xs text-muted">{lead.city}</p>
      <p className="mt-2 text-sm">{formatCurrency((lead.estimatedValueLow + lead.estimatedValueHigh) / 2)}</p>
      {lead.followUpAt ? <p className="mt-1 text-[11px] text-faint">Follow-up {new Date(lead.followUpAt).toLocaleDateString()}</p> : null}
    </article>
  )
}
