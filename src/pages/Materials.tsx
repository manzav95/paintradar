import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Input'
import { formatCurrency } from '@/lib/format'
import { useAppState } from '@/providers/AppState'
import { TIER_LABELS, type MaterialTier } from '@/types'

export function Materials() {
  const { materialGroups, addMaterialGroup, updateMaterialGroup, deleteMaterialGroup, addMaterialItem, deleteMaterialItem } =
    useAppState()
  const [name, setName] = useState('')
  const [tier, setTier] = useState<MaterialTier>('custom')
  const [description, setDescription] = useState('')
  const [doorPrice, setDoorPrice] = useState(65)
  const [drawerPrice, setDrawerPrice] = useState(35)
  const [itemDraft, setItemDraft] = useState<Record<string, { name: string; brand: string; notes: string }>>({})

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Materials</h1>
        <p className="text-sm text-muted">
          Price groups you can pick on a live quote. High end uses Renner. Mid uses Sherwin-Williams. Value is the budget tier.
        </p>
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-gold">Create a group</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Group name">
            <Input value={name} placeholder="High End, Mid, Rental..." onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Tier">
            <Select value={tier} onChange={(event) => setTier(event.target.value as MaterialTier)}>
              {Object.entries(TIER_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Door price">
            <Input type="number" value={doorPrice} onChange={(event) => setDoorPrice(Number(event.target.value))} />
          </Field>
          <Field label="Drawer price">
            <Input type="number" value={drawerPrice} onChange={(event) => setDrawerPrice(Number(event.target.value))} />
          </Field>
          <Field label="Description" className="md:col-span-2 xl:col-span-4">
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
          </Field>
        </div>
        <Button
          className="mt-4"
          variant="primary"
          onClick={() => {
            if (!name.trim()) return
            addMaterialGroup({
              name: name.trim(),
              tier,
              description,
              doorPrice,
              drawerPrice,
            })
            setName('')
            setDescription('')
          }}
        >
          <Plus className="h-4 w-4" />
          Save group
        </Button>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        {materialGroups.map((group) => {
          const draft = itemDraft[group.id] ?? { name: '', brand: '', notes: '' }
          return (
            <article key={group.id} className="rounded-2xl border border-line bg-surface p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">{TIER_LABELS[group.tier]}</p>
                  <h3 className="mt-1 text-xl font-semibold">{group.name}</h3>
                  <p className="mt-2 text-sm text-muted">{group.description}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteMaterialGroup(group.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="Door price">
                  <Input
                    type="number"
                    value={group.doorPrice}
                    onChange={(event) => updateMaterialGroup(group.id, { doorPrice: Number(event.target.value) })}
                  />
                </Field>
                <Field label="Drawer price">
                  <Input
                    type="number"
                    value={group.drawerPrice}
                    onChange={(event) => updateMaterialGroup(group.id, { drawerPrice: Number(event.target.value) })}
                  />
                </Field>
              </div>
              <p className="mt-2 text-xs text-muted">
                These prices load into the quote worksheet. A 20-door kitchen at {formatCurrency(group.doorPrice)} is{' '}
                {formatCurrency(group.doorPrice * 20)} before drawers.
              </p>

              <div className="mt-5 space-y-2">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/4 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-muted">
                        {item.brand}
                        {item.notes ? ` · ${item.notes}` : ''}
                      </p>
                    </div>
                    <button className="text-muted hover:text-urgent" onClick={() => deleteMaterialItem(group.id, item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-3">
                <Input
                  placeholder="Product name"
                  value={draft.name}
                  onChange={(event) => setItemDraft((current) => ({ ...current, [group.id]: { ...draft, name: event.target.value } }))}
                />
                <Input
                  placeholder="Brand"
                  value={draft.brand}
                  onChange={(event) => setItemDraft((current) => ({ ...current, [group.id]: { ...draft, brand: event.target.value } }))}
                />
                <Input
                  placeholder="Notes"
                  value={draft.notes}
                  onChange={(event) => setItemDraft((current) => ({ ...current, [group.id]: { ...draft, notes: event.target.value } }))}
                />
              </div>
              <Button
                className="mt-2"
                size="sm"
                onClick={() => {
                  if (!draft.name.trim()) return
                  addMaterialItem(group.id, draft)
                  setItemDraft((current) => ({ ...current, [group.id]: { name: '', brand: '', notes: '' } }))
                }}
              >
                Add product
              </Button>
            </article>
          )
        })}
      </div>
    </motion.div>
  )
}
