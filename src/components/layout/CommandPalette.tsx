import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useAppState } from '@/providers/AppState'
import { CATEGORY_LABELS, PROJECT_CATEGORIES } from '@/types'
import { EAST_BAY_CITIES } from '@/data/cities'

const PAGES = [
  { label: 'Dashboard', to: '/' },
  { label: 'Live Leads', to: '/leads' },
  { label: 'Map', to: '/map' },
  { label: 'Pipeline', to: '/pipeline' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Saved Leads', to: '/saved' },
  { label: 'Searches', to: '/searches' },
  { label: 'Cabinet Kits', to: '/materials' },
  { label: 'Cabinet Quote', to: '/quote' },
  { label: 'Estimates', to: '/sales/estimates' },
  { label: 'Quotes', to: '/sales/quotes' },
  { label: 'Invoices', to: '/sales/invoices' },
  { label: 'Customers', to: '/sales/customers' },
  { label: 'Pricing', to: '/sales/pricing' },
  { label: 'Sales Materials', to: '/sales/materials' },
  { label: 'Payments', to: '/sales/payments' },
  { label: 'Change Orders', to: '/sales/change-orders' },
  { label: 'Sources', to: '/sources' },
  { label: 'Lead Tester', to: '/dev/tester' },
  { label: 'Source Status', to: '/dev/sources' },
  { label: 'Notifications', to: '/notifications' },
  { label: 'Settings', to: '/settings' },
]

export function CommandPalette() {
  const { commandOpen, setCommandOpen, leads, setSelectedLeadId, setFilters, settings } = useAppState()
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const q = query.toLowerCase()

  const results = useMemo(() => {
    const pages = PAGES.filter((page) => {
      const leadPage = !['Estimates', 'Quotes', 'Invoices', 'Customers', 'Pricing', 'Sales Materials', 'Payments', 'Change Orders', 'Settings'].includes(page.label)
      if (!settings.showLeadIntel && leadPage) return false
      return page.label.toLowerCase().includes(q)
    })
    const cities = EAST_BAY_CITIES.filter((city) => city.name.toLowerCase().includes(q))
    const services = PROJECT_CATEGORIES.filter((category) => CATEGORY_LABELS[category].toLowerCase().includes(q))
    const matchedLeads = leads
      .filter((lead) => `${lead.customerName} ${lead.city} ${lead.title}`.toLowerCase().includes(q))
      .slice(0, 6)
    return { pages, cities, services, matchedLeads }
  }, [leads, q, settings.showLeadIntel])

  const go = (to: string) => {
    navigate(to)
    setCommandOpen(false)
    setQuery('')
  }

  return (
    <Modal
      open={commandOpen}
      title="Jump anywhere"
      subtitle={settings.showLeadIntel ? 'Search leads, cities, services, or pages' : 'Search estimates, invoices, customers, or pages'}
      onClose={() => setCommandOpen(false)}
    >
      <Input
        autoFocus
        placeholder={settings.showLeadIntel ? 'Type a city, service, or homeowner...' : 'Type a customer, estimate, or page...'}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="mt-4 space-y-4 text-sm">
        <Group title="Pages">
          {results.pages.map((page) => (
            <button key={page.to} className="block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5" onClick={() => go(page.to)}>
              {page.label}
            </button>
          ))}
        </Group>
        {settings.showLeadIntel ? (
        <>
        <Group title="Leads">
          {results.matchedLeads.map((lead) => (
            <button
              key={lead.id}
              className="block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5"
              onClick={() => {
                setSelectedLeadId(lead.id)
                setCommandOpen(false)
              }}
            >
              {lead.customerName} · {lead.city}
            </button>
          ))}
        </Group>
        <Group title="Cities">
          {results.cities.map((city) => (
            <button
              key={city.name}
              className="block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5"
              onClick={() => {
                setFilters({ city: city.name })
                go('/leads')
              }}
            >
              {city.name}, {city.state}
            </button>
          ))}
        </Group>
        <Group title="Services">
          {results.services.map((category) => (
            <button
              key={category}
              className="block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5"
              onClick={() => {
                setFilters({ categories: [category] })
                go('/leads')
              }}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </Group>
        </>
        ) : null}
      </div>
    </Modal>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] uppercase tracking-[0.16em] text-muted">{title}</p>
      {children}
    </div>
  )
}
