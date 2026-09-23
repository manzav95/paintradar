import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { EAST_BAY_CITIES } from '@/data/cities'
import {
  QUOTE_ACCESS,
  QUOTE_COLOR_CHANGES,
  QUOTE_CONDITIONS,
  QUOTE_HARDWARE,
  QUOTE_SCOPES,
  QUOTE_SHEENS,
  QUOTE_TIMELINES,
} from '@/data/materials'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { calculateQuote, describeQuote, quoteRange } from '@/lib/quote'
import { formatCurrency } from '@/lib/format'
import { useAppState } from '@/providers/AppState'
import { TIER_LABELS, type LeadQuote } from '@/types'

export function Quote() {
  const { materialGroups, addManualLead, setSelectedLeadId } = useAppState()
  const navigate = useNavigate()
  const firstGroup = materialGroups[0]
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [city, setCity] = useState('Brentwood')
  const [scope, setScope] = useState(QUOTE_SCOPES[0])
  const [condition, setCondition] = useState(QUOTE_CONDITIONS[0])
  const [colorChange, setColorChange] = useState(QUOTE_COLOR_CHANGES[0])
  const [sheen, setSheen] = useState(QUOTE_SHEENS[0])
  const [hardware, setHardware] = useState(QUOTE_HARDWARE[0])
  const [timeline, setTimeline] = useState(QUOTE_TIMELINES[2])
  const [access, setAccess] = useState(QUOTE_ACCESS[0])
  const [groupId, setGroupId] = useState(firstGroup?.id ?? '')
  const [doorQty, setDoorQty] = useState(18)
  const [drawerQty, setDrawerQty] = useState(12)
  const [doorPrice, setDoorPrice] = useState(firstGroup?.doorPrice ?? 65)
  const [drawerPrice, setDrawerPrice] = useState(firstGroup?.drawerPrice ?? 35)
  const [notes, setNotes] = useState('')

  const group = materialGroups.find((item) => item.id === groupId)
  const laborTotal = useMemo(
    () => calculateQuote({ doorQty, drawerQty, doorPrice, drawerPrice }),
    [doorQty, drawerQty, doorPrice, drawerPrice],
  )
  const range = quoteRange(laborTotal)

  const selectGroup = (id: string) => {
    setGroupId(id)
    const next = materialGroups.find((item) => item.id === id)
    if (next) {
      setDoorPrice(next.doorPrice)
      setDrawerPrice(next.drawerPrice)
    }
  }

  const saveLead = () => {
    if (!customerName.trim()) return
    const quote: LeadQuote = {
      doorQty,
      drawerQty,
      doorPrice,
      drawerPrice,
      materialGroupId: group?.id ?? null,
      materialGroupName: group?.name ?? '',
      scope,
      condition,
      colorChange,
      sheen,
      hardware,
      timeline,
      access,
      laborTotal,
    }
    const lead = addManualLead(
      {
        source: 'manual',
        customerName: customerName.trim(),
        title: `${scope} · ${group?.name ?? 'cabinet quote'}`,
        description: describeQuote(quote),
        city,
        category: 'cabinets',
        urgency: timeline.includes('ASAP') ? 'hot' : 'new',
        estimatedValueLow: range.low,
        estimatedValueHigh: range.high,
        phone,
        email,
      },
      { note: notes, quote },
    )
    setSelectedLeadId(lead.id)
    navigate('/leads')
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Client quote</h1>
        <p className="text-sm text-muted">
          Use this while you are on the phone or in the kitchen. Select answers, count doors and drawers, then save the lead.
        </p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-5">
          <Card title="Homeowner">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Customer name">
                <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="First and last" />
              </Field>
              <Field label="City">
                <Select value={city} onChange={(event) => setCity(event.target.value)}>
                  {EAST_BAY_CITIES.map((item) => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Phone">
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="(925) 555-0100" />
              </Field>
              <Field label="Email">
                <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@email.com" />
              </Field>
            </div>
          </Card>

          <Card title="Ask these questions">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="What are we painting?">
                <Select value={scope} onChange={(event) => setScope(event.target.value)}>
                  {QUOTE_SCOPES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Cabinet condition">
                <Select value={condition} onChange={(event) => setCondition(event.target.value)}>
                  {QUOTE_CONDITIONS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Color change">
                <Select value={colorChange} onChange={(event) => setColorChange(event.target.value)}>
                  {QUOTE_COLOR_CHANGES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Sheen">
                <Select value={sheen} onChange={(event) => setSheen(event.target.value)}>
                  {QUOTE_SHEENS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Hardware">
                <Select value={hardware} onChange={(event) => setHardware(event.target.value)}>
                  {QUOTE_HARDWARE.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Timeline">
                <Select value={timeline} onChange={(event) => setTimeline(event.target.value)}>
                  {QUOTE_TIMELINES.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Access" className="md:col-span-2">
                <Select value={access} onChange={(event) => setAccess(event.target.value)}>
                  {QUOTE_ACCESS.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>

          <Card title="Material group">
            <Select value={groupId} onChange={(event) => selectGroup(event.target.value)}>
              {materialGroups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {TIER_LABELS[item.tier]}
                </option>
              ))}
            </Select>
            {group ? (
              <div className="mt-3 rounded-xl bg-white/4 px-3 py-3 text-sm text-muted">
                <p>{group.description}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-gold">Products</p>
                <p className="mt-1">{group.items.map((item) => item.name).join(', ') || 'No products in this group yet.'}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted">Create a group on the Materials page first.</p>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Door and drawer count">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Door qty">
                <Input type="number" min={0} value={doorQty} onChange={(event) => setDoorQty(Number(event.target.value))} />
              </Field>
              <Field label="Drawer qty">
                <Input type="number" min={0} value={drawerQty} onChange={(event) => setDrawerQty(Number(event.target.value))} />
              </Field>
            </div>
          </Card>

          <Card title="Modify door and drawer price">
            <p className="mb-3 text-sm text-muted">Loaded from the material group. Change them for this job without editing the catalog.</p>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Price per door">
                <Input type="number" min={0} value={doorPrice} onChange={(event) => setDoorPrice(Number(event.target.value))} />
              </Field>
              <Field label="Price per drawer">
                <Input type="number" min={0} value={drawerPrice} onChange={(event) => setDrawerPrice(Number(event.target.value))} />
              </Field>
            </div>
          </Card>

          <div className="rounded-2xl border border-gold/25 bg-gold/8 p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">Estimated job total</p>
            <p className="mt-2 text-4xl font-extrabold">{formatCurrency(laborTotal)}</p>
            <p className="mt-1 text-sm text-muted">
              Range {formatCurrency(range.low)}–{formatCurrency(range.high)} · estimate only
            </p>
            <div className="mt-4 space-y-1 text-sm text-muted">
              <p>
                {doorQty} doors × {formatCurrency(doorPrice)} = {formatCurrency(doorQty * doorPrice)}
              </p>
              <p>
                {drawerQty} drawers × {formatCurrency(drawerPrice)} = {formatCurrency(drawerQty * drawerPrice)}
              </p>
            </div>
          </div>

          <Card title="Notes from the call">
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Color, access, pets, parking..." />
          </Card>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={saveLead}>
              Save as lead
            </Button>
            <Button onClick={() => navigate('/materials')}>Edit materials</Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-gold">{title}</h2>
      {children}
    </section>
  )
}
