import { Button } from '@/components/ui/Button'
import { Field, Input, Textarea } from '@/components/ui/Input'
import type { Customer } from '@/types/sales'

export type CustomerDraft = Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }

export const EMPTY_CUSTOMER: CustomerDraft = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  city: 'Brentwood',
  state: 'CA',
  zip: '',
  notes: '',
}

export function CustomerForm({
  value,
  onChange,
  onSubmit,
  submitLabel,
}: {
  value: CustomerDraft
  onChange: (value: CustomerDraft) => void
  onSubmit: () => void
  submitLabel: string
}) {
  const set = (patch: Partial<CustomerDraft>) => onChange({ ...value, ...patch })

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}
    >
      <Field label="First Name">
        <Input value={value.firstName} onChange={(event) => set({ firstName: event.target.value })} required />
      </Field>
      <Field label="Last Name">
        <Input value={value.lastName} onChange={(event) => set({ lastName: event.target.value })} required />
      </Field>
      <Field label="Phone">
        <Input value={value.phone} onChange={(event) => set({ phone: event.target.value })} />
      </Field>
      <Field label="Email">
        <Input type="email" value={value.email} onChange={(event) => set({ email: event.target.value })} />
      </Field>
      <Field label="Project Address" className="md:col-span-2">
        <Input value={value.address} onChange={(event) => set({ address: event.target.value })} />
      </Field>
      <Field label="City">
        <Input value={value.city} onChange={(event) => set({ city: event.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="State">
          <Input value={value.state} onChange={(event) => set({ state: event.target.value })} />
        </Field>
        <Field label="ZIP">
          <Input value={value.zip} onChange={(event) => set({ zip: event.target.value })} />
        </Field>
      </div>
      <Field label="Notes" className="md:col-span-2">
        <Textarea value={value.notes} onChange={(event) => set({ notes: event.target.value })} />
      </Field>
      <div className="md:col-span-2">
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
