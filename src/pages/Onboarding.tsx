import { useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { EAST_BAY_CITIES } from '@/data/cities'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { Field, Select } from '@/components/ui/Input'
import { Switch } from '@/components/ui/Switch'
import { useAppState } from '@/providers/AppState'
import { CATEGORY_LABELS, PROJECT_CATEGORIES, RADIUS_OPTIONS, type ProjectCategory, type RadiusOption } from '@/types'

const SERVICE_PRESETS: { label: string; categories: ProjectCategory[] }[] = [
  { label: 'Interior', categories: ['interior', 'trim', 'doors', 'ceiling'] },
  { label: 'Exterior', categories: ['exterior'] },
  { label: 'Cabinets', categories: ['cabinets'] },
  { label: 'Commercial', categories: ['commercial'] },
  { label: 'Deck/Fence', categories: ['fence_deck'] },
  { label: 'Drywall/Patch', categories: ['drywall'] },
  { label: 'All Painting', categories: [...PROJECT_CATEGORIES] },
]

export function Onboarding() {
  const { settings, completeOnboarding } = useAppState()
  const [step, setStep] = useState(1)
  const [homeCity, setHomeCity] = useState(settings.homeCity)
  const [radius, setRadius] = useState<RadiusOption>(50)
  const [categories, setCategories] = useState<ProjectCategory[]>([...PROJECT_CATEGORIES])
  const [alerts, setAlerts] = useState(settings.notificationPreferences)

  const togglePreset = (preset: (typeof SERVICE_PRESETS)[number]) => {
    if (preset.label === 'All Painting') {
      setCategories([...PROJECT_CATEGORIES])
      return
    }
    setCategories((current) => {
      const hasAll = preset.categories.every((item) => current.includes(item))
      if (hasAll) return current.filter((item) => !preset.categories.includes(item))
      return [...new Set([...current, ...preset.categories])]
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-3xl border border-line bg-surface p-8 shadow-card"
      >
        <Logo />
        <p className="mt-6 text-sm uppercase tracking-[0.2em] text-gold">Welcome to PaintRadar</p>
        <h1 className="mt-2 text-3xl font-extrabold">This system hunts painting jobs around you.</h1>
        <p className="mt-2 text-sm text-muted">Step {step} of 4</p>

        {step === 1 && (
          <div className="mt-6">
            <Field label="Home / service area">
              <Select value={homeCity} onChange={(event) => setHomeCity(event.target.value)}>
                {EAST_BAY_CITIES.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}, {city.state}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
            {RADIUS_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setRadius(option)}
                className={`rounded-2xl border px-3 py-4 text-sm font-semibold ${radius === option ? 'border-gold bg-gold/10 text-gold' : 'border-line text-muted'}`}
              >
                {option} mi
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="mt-6 grid grid-cols-2 gap-3">
            {SERVICE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => togglePreset(preset)}
                className={`rounded-2xl border px-4 py-3 text-left ${preset.categories.every((item) => categories.includes(item)) ? 'border-gold bg-gold/10' : 'border-line'}`}
              >
                <p className="font-semibold">{preset.label}</p>
                <p className="mt-1 text-xs text-muted">{preset.categories.map((item) => CATEGORY_LABELS[item]).slice(0, 2).join(', ')}</p>
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="mt-6 flex flex-col gap-3">
            <SwitchRow>
              <Switch checked={alerts.hotLead} onChange={(hotLead) => setAlerts((current) => ({ ...current, hotLead }))} label="Hot leads" />
            </SwitchRow>
            <SwitchRow>
              <Switch checked={alerts.cabinetJob} onChange={(cabinetJob) => setAlerts((current) => ({ ...current, cabinetJob }))} label="Cabinet jobs" />
            </SwitchRow>
            <SwitchRow>
              <Switch checked={alerts.highValueJob} onChange={(highValueJob) => setAlerts((current) => ({ ...current, highValueJob }))} label="High-value jobs" />
            </SwitchRow>
            <SwitchRow>
              <Switch checked={alerts.inApp} onChange={(inApp) => setAlerts((current) => ({ ...current, inApp }))} label="In-app alerts" />
            </SwitchRow>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <Button variant="ghost" onClick={() => (step === 1 ? completeOnboarding({ homeCity, defaultRadius: radius, categories, notificationPreferences: alerts }) : setStep((value) => value - 1))}>
            {step === 1 ? 'Skip with defaults' : 'Back'}
          </Button>
          {step < 4 ? (
            <Button variant="primary" onClick={() => setStep((value) => value + 1)}>
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => completeOnboarding({ homeCity, defaultRadius: radius, categories, notificationPreferences: alerts })}
            >
              Start Radar
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function SwitchRow({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-line bg-bg-soft px-4 py-3">{children}</div>
}
