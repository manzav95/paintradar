import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { CustomerForm, EMPTY_CUSTOMER, type CustomerDraft } from '@/components/sales/CustomerForm'
import { customerName } from '@/lib/estimateEngine'
import { useSales } from '@/providers/SalesState'

export function Customers() {
  const { customers, estimates, invoices, upsertCustomer, deleteCustomer } = useSales()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<CustomerDraft>(EMPTY_CUSTOMER)
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">PaintLedger</p>
          <h1 className="text-2xl font-semibold">Customers</h1>
        </div>
        <Button variant="primary" onClick={() => { setDraft(EMPTY_CUSTOMER); setOpen(true) }}>
          New Customer
        </Button>
      </div>
      {customers.length === 0 ? (
        <EmptyState title="No customers yet" subtitle="Create a homeowner profile, then start an interior estimate from the tablet." />
      ) : (
        <div className="grid gap-3">
          {customers.map((customer) => (
            <div key={customer.id} className="rounded-2xl border border-line bg-surface p-5">
              <button className="w-full text-left" onClick={() => navigate(`/sales/customers/${customer.id}`)}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{customerName(customer.firstName, customer.lastName)}</p>
                    <p className="text-sm text-muted">
                      {customer.address || 'No address'} · {customer.city}
                    </p>
                  </div>
                  <p className="text-xs text-faint">
                    {estimates.filter((item) => item.customerId === customer.id).length} estimates ·{' '}
                    {invoices.filter((item) => item.customerId === customer.id).length} invoices
                  </p>
                </div>
              </button>
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (window.confirm(`Delete ${customerName(customer.firstName, customer.lastName)}? This cannot be undone.`)) {
                      deleteCustomer(customer.id)
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={open} title="Create customer" onClose={() => setOpen(false)}>
        <CustomerForm
          value={draft}
          onChange={setDraft}
          submitLabel="Save customer"
          onSubmit={() => {
            const customer = upsertCustomer(draft)
            setOpen(false)
            navigate(`/sales/customers/${customer.id}`)
          }}
        />
      </Modal>
    </div>
  )
}
