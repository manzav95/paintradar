import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Input'
import { CustomerForm, EMPTY_CUSTOMER, type CustomerDraft } from '@/components/sales/CustomerForm'
import { customerName } from '@/lib/estimateEngine'
import { useSales } from '@/providers/SalesState'
import { ESTIMATE_TYPES } from '@/types/sales'

export function NewEstimate() {
  const { customers, upsertCustomer, createEstimate } = useSales()
  const [draft, setDraft] = useState<CustomerDraft>(EMPTY_CUSTOMER)
  const [type, setType] = useState<(typeof ESTIMATE_TYPES)[number]>('interior')
  const [jobName, setJobName] = useState('')
  const navigate = useNavigate()

  const start = (customerId: string, customer?: ReturnType<typeof upsertCustomer>) => {
    const estimate = createEstimate(customerId, type, customer, jobName)
    navigate(`/sales/estimates/${estimate.id}`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">Field Estimate</p>
        <h1 className="text-2xl font-semibold">Create or select a customer</h1>
      </div>
      <div className="flex flex-wrap gap-2">
        {ESTIMATE_TYPES.map((item) => (
          <button
            key={item}
            onClick={() => setType(item)}
            className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${type === item ? 'bg-gold text-[#1a1406]' : 'border border-line text-muted'}`}
          >
            {item === 'mixed' ? 'Mixed Project' : item === 'cabinets' ? 'Cabinets' : item === 'exterior' ? 'Exterior' : 'Interior'}
          </button>
        ))}
      </div>
      <Field label="Job name" className="max-w-md">
        <Input
          value={jobName}
          onChange={(event) => setJobName(event.target.value)}
          placeholder="Lopez interior, garage doors, kitchen cabinets..."
        />
      </Field>
      {customers.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Existing customers</p>
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => start(customer.id)}
              className="flex w-full items-center justify-between rounded-2xl border border-line bg-surface px-4 py-4 text-left hover:border-gold/30"
            >
              <span className="font-semibold">{customerName(customer.firstName, customer.lastName)}</span>
              <span className="text-sm text-muted">{customer.city}</span>
            </button>
          ))}
        </div>
      ) : null}
      <div className="rounded-3xl border border-line bg-surface p-5">
        <h2 className="mb-4 font-semibold">New customer</h2>
        <CustomerForm
          value={draft}
          onChange={setDraft}
          submitLabel="Save & start estimate"
          onSubmit={() => {
            const customer = upsertCustomer(draft)
            start(customer.id, customer)
          }}
        />
      </div>
      <Button variant="ghost" onClick={() => navigate('/sales/estimates')}>
        Cancel
      </Button>
    </div>
  )
}
