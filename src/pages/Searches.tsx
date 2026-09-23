import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { CATEGORY_LABELS, PROJECT_CATEGORIES, type ProjectCategory } from '@/types'
import { useAppState } from '@/providers/AppState'

export function Searches() {
  const { searches, addSearch, updateSearch, deleteSearch } = useAppState()
  const [name, setName] = useState('New search')
  const [keywords, setKeywords] = useState('paint, quote')
  const [excluded, setExcluded] = useState('')
  const [radius, setRadius] = useState(25)
  const [minimumScore, setMinimumScore] = useState(70)
  const [category, setCategory] = useState<ProjectCategory | ''>('')

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Searches</h1>
        <p className="text-sm text-muted">Saved monitors that keep watching the local feed.</p>
      </div>
      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold">Create a monitor</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <Field label="Name">
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label="Radius">
            <Select value={radius} onChange={(event) => setRadius(Number(event.target.value))}>
              {[10, 20, 25, 50, 75].map((item) => (
                <option key={item} value={item}>
                  {item} miles
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Minimum score">
            <Input type="number" value={minimumScore} onChange={(event) => setMinimumScore(Number(event.target.value))} />
          </Field>
          <Field label="Keywords">
            <Input value={keywords} onChange={(event) => setKeywords(event.target.value)} />
          </Field>
          <Field label="Excluded words">
            <Input value={excluded} onChange={(event) => setExcluded(event.target.value)} />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(event) => setCategory(event.target.value as ProjectCategory | '')}>
              <option value="">Any</option>
              {PROJECT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {CATEGORY_LABELS[item]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Button
          className="mt-4"
          variant="primary"
          onClick={() =>
            addSearch({
              name,
              radius,
              keywords: keywords.split(',').map((item) => item.trim()).filter(Boolean),
              excludedKeywords: excluded.split(',').map((item) => item.trim()).filter(Boolean),
              categories: category ? [category] : [],
              minimumScore,
              enabled: true,
              notificationEnabled: true,
            })
          }
        >
          Save search
        </Button>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {searches.map((search) => (
          <article key={search.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{search.name}</h3>
                <p className="mt-1 text-sm text-muted">within {search.radius} miles</p>
              </div>
              <Switch className="w-auto" checked={search.enabled} onChange={(enabled) => updateSearch(search.id, { enabled })} />
            </div>
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-gold">Keywords</p>
            <p className="mt-1 text-sm text-muted">{search.keywords.join(', ') || 'Any'}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.14em] text-muted">Excluded</p>
            <p className="mt-1 text-sm text-muted">{search.excludedKeywords.join(', ') || 'None'}</p>
            <div className="mt-4 flex items-center justify-between">
              <Switch
                checked={search.notificationEnabled}
                onChange={(notificationEnabled) => updateSearch(search.id, { notificationEnabled })}
                label="Alerts"
              />
              <Button size="sm" variant="ghost" onClick={() => deleteSearch(search.id)}>
                Remove
              </Button>
            </div>
          </article>
        ))}
      </div>
    </motion.div>
  )
}
