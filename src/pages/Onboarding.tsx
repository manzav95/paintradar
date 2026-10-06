import { useState } from 'react'
import { motion } from 'framer-motion'
import { EAST_BAY_CITIES } from '@/data/cities'
import { APP_NAME, APP_TAGLINE } from '@/lib/brand'
import { Logo } from '@/components/layout/Logo'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Input'
import { useAppState } from '@/providers/AppState'

export function Onboarding() {
  const { settings, completeOnboarding } = useAppState()
  const [ownerName, setOwnerName] = useState(settings.ownerName)
  const [companyName, setCompanyName] = useState(settings.companyName)
  const [homeCity, setHomeCity] = useState(settings.homeCity)

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl rounded-3xl border border-line bg-surface p-8 shadow-card"
      >
        <Logo />
        <p className="mt-6 text-sm uppercase tracking-[0.2em] text-gold">Welcome to {APP_NAME}</p>
        <h1 className="mt-2 text-3xl font-extrabold">Estimates, invoices, and payments in one place.</h1>
        <p className="mt-2 text-sm text-muted">{APP_TAGLINE} for painting contractors.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Your name">
            <Input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
          </Field>
          <Field label="Company">
            <Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
          </Field>
          <Field label="Home / service area" className="md:col-span-2">
            <Select value={homeCity} onChange={(event) => setHomeCity(event.target.value)}>
              {EAST_BAY_CITIES.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}, {city.state}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            variant="primary"
            onClick={() =>
              completeOnboarding({
                ownerName: ownerName.trim() || settings.ownerName,
                companyName: companyName.trim() || settings.companyName,
                homeCity,
                showLeadIntel: false,
              })
            }
          >
            Open {APP_NAME}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
