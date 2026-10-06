import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { EAST_BAY_CITIES } from '@/data/cities'
import { APP_NAME, LEAD_APP_NAME, LEAD_APP_TAGLINE } from '@/lib/brand'
import { Field, Input, Select } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { useAppState } from '@/providers/AppState'
import { RADIUS_OPTIONS, type RadiusOption } from '@/types'

export function Settings() {
  const { settings, updateSettings } = useAppState()
  const weights = settings.scoringWeights
  const prefs = settings.notificationPreferences

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted">{APP_NAME} is built for estimates, invoices, and payment tracking.</p>
      </div>

      <Section title="Product">
        <Field label="Company name" className="max-w-sm">
          <Input value={settings.companyName} onChange={(event) => updateSettings({ companyName: event.target.value })} />
        </Field>
        <div className="mt-5 rounded-2xl border border-line bg-bg-soft px-4 py-4">
          <Switch
            checked={settings.showLeadIntel}
            onChange={(showLeadIntel) => updateSettings({ showLeadIntel })}
            label={`Show ${LEAD_APP_NAME} (${LEAD_APP_TAGLINE.toLowerCase()})`}
          />
          <p className="mt-2 text-sm text-muted">
            {APP_NAME} stays the main app. Turn this on only when you want the old {LEAD_APP_NAME} lead tools back in the sidebar.
          </p>
        </div>
      </Section>

      {settings.showLeadIntel ? (
        <>
      <Section title="Search area">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Home location">
            <Select value={settings.homeCity} onChange={(event) => updateSettings({ homeCity: event.target.value })}>
              {EAST_BAY_CITIES.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}, {city.state}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Default radius">
            <Select
              value={settings.defaultRadius}
              onChange={(event) => updateSettings({ defaultRadius: Number(event.target.value) as RadiusOption })}
            >
              {RADIUS_OPTIONS.map((item) => (
                <option key={item} value={item}>
                  {item} miles
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Lead sources">
        <p className="text-sm text-muted">
          Demo feed and manual entry are active. Nextdoor is an authorized-integration adapter only — it is not connected
          and does not scrape.
        </p>
      </Section>

      <Section title="Notifications">
        <div className="grid gap-4 md:grid-cols-2">
          <Switch checked={prefs.newLead} onChange={(newLead) => updateSettings({ notificationPreferences: { ...prefs, newLead } })} label="New lead" />
          <Switch checked={prefs.hotLead} onChange={(hotLead) => updateSettings({ notificationPreferences: { ...prefs, hotLead } })} label="Hot lead" />
          <Switch checked={prefs.cabinetJob} onChange={(cabinetJob) => updateSettings({ notificationPreferences: { ...prefs, cabinetJob } })} label="Cabinet job" />
          <Switch checked={prefs.interiorJob} onChange={(interiorJob) => updateSettings({ notificationPreferences: { ...prefs, interiorJob } })} label="Interior job" />
          <Switch checked={prefs.exteriorJob} onChange={(exteriorJob) => updateSettings({ notificationPreferences: { ...prefs, exteriorJob } })} label="Exterior job" />
          <Switch checked={prefs.highValueJob} onChange={(highValueJob) => updateSettings({ notificationPreferences: { ...prefs, highValueJob } })} label="High value job" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Score above">
            <Input
              type="number"
              value={prefs.scoreAbove}
              onChange={(event) => updateSettings({ notificationPreferences: { ...prefs, scoreAbove: Number(event.target.value) } })}
            />
          </Field>
          <Field label="Within miles">
            <Input
              type="number"
              value={prefs.withinMiles}
              onChange={(event) => updateSettings({ notificationPreferences: { ...prefs, withinMiles: Number(event.target.value) } })}
            />
          </Field>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <Switch checked={prefs.inApp} onChange={(inApp) => updateSettings({ notificationPreferences: { ...prefs, inApp } })} label="In-app" />
          <Switch checked={prefs.email} onChange={(email) => updateSettings({ notificationPreferences: { ...prefs, email } })} label="Email (placeholder)" />
          <Switch checked={prefs.sms} onChange={(sms) => updateSettings({ notificationPreferences: { ...prefs, sms } })} label="SMS (placeholder)" />
        </div>
      </Section>

      <Section title="Lead scoring">
        <div className="grid gap-4 md:grid-cols-5">
          {(
            [
              ['recency', 'Recency'],
              ['distance', 'Distance'],
              ['urgency', 'Urgency'],
              ['projectValue', 'Project value'],
              ['keywordMatch', 'Keyword match'],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={`${label} ${weights[key]}%`}>
              <Input
                type="range"
                min={0}
                max={50}
                value={weights[key]}
                onChange={(event) =>
                  updateSettings({ scoringWeights: { ...weights, [key]: Number(event.target.value) } })
                }
              />
            </Field>
          ))}
        </div>
      </Section>

        </>
      ) : null}

      <Section title="Appearance">
        <p className="text-sm text-muted">Dark contractor theme is locked for this workspace. Depth, glass, and gold stay on.</p>
      </Section>
    </motion.div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-gold">{title}</h2>
      {children}
    </section>
  )
}
