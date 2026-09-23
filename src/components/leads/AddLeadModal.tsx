import { useState } from 'react'
import { EAST_BAY_CITIES } from '@/data/cities'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { useAppState } from '@/providers/AppState'
import { CATEGORY_LABELS, PROJECT_CATEGORIES, URGENCY_LABELS, URGENCY_LEVELS, type ProjectCategory, type RawLead, type Urgency } from '@/types'

const empty: RawLead = {
  source: 'manual',
  customerName: '',
  title: '',
  description: '',
  city: 'Brentwood',
  category: 'interior',
  urgency: 'new',
  estimatedValueLow: 1500,
  estimatedValueHigh: 3000,
  phone: '',
  email: '',
}

export function AddLeadModal() {
  const { addLeadOpen, setAddLeadOpen, addManualLead, addNote } = useAppState()
  const [form, setForm] = useState<RawLead>(empty)
  const [notes, setNotes] = useState('')

  const update = (patch: Partial<RawLead>) => setForm((current) => ({ ...current, ...patch }))

  return (
    <Modal
      open={addLeadOpen}
      title="Add a lead"
      subtitle="Capture a call, referral, or walk-in without waiting on a source scan."
      onClose={() => setAddLeadOpen(false)}
    >
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Customer name">
          <Input value={form.customerName} onChange={(event) => update({ customerName: event.target.value })} />
        </Field>
        <Field label="City">
          <Select value={form.city} onChange={(event) => update({ city: event.target.value })}>
            {EAST_BAY_CITIES.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Project">
          <Select
            value={form.category}
            onChange={(event) => update({ category: event.target.value as ProjectCategory, title: CATEGORY_LABELS[event.target.value as ProjectCategory] })}
          >
            {PROJECT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Urgency">
          <Select value={form.urgency} onChange={(event) => update({ urgency: event.target.value as Urgency })}>
            {URGENCY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {URGENCY_LABELS[level]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estimated low">
          <Input
            type="number"
            value={form.estimatedValueLow}
            onChange={(event) => update({ estimatedValueLow: Number(event.target.value) })}
          />
        </Field>
        <Field label="Estimated high">
          <Input
            type="number"
            value={form.estimatedValueHigh}
            onChange={(event) => update({ estimatedValueHigh: Number(event.target.value) })}
          />
        </Field>
        <Field label="Phone">
          <Input value={form.phone ?? ''} onChange={(event) => update({ phone: event.target.value })} />
        </Field>
        <Field label="Email">
          <Input value={form.email ?? ''} onChange={(event) => update({ email: event.target.value })} />
        </Field>
        <Field label="Description" className="md:col-span-2">
          <Textarea
            value={form.description}
            onChange={(event) => update({ description: event.target.value, title: form.title || event.target.value.slice(0, 48) })}
          />
        </Field>
        <Field label="Notes" className="md:col-span-2">
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
        </Field>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <Button onClick={() => setAddLeadOpen(false)}>Cancel</Button>
        <Button
          variant="primary"
          onClick={() => {
            if (!form.customerName || !form.description) return
            const lead = addManualLead({ ...form, title: form.title || form.description.slice(0, 52) })
            if (notes.trim()) addNote(lead.id, notes.trim())
            setForm(empty)
            setNotes('')
            setAddLeadOpen(false)
          }}
        >
          Save lead
        </Button>
      </div>
    </Modal>
  )
}
