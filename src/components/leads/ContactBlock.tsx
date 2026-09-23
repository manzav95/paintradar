import { Mail, Phone } from 'lucide-react'
import type { Lead } from '@/types'

export function ContactBlock({ lead }: { lead: Lead }) {
  const phone = lead.phone?.trim()
  const email = lead.email?.trim()

  if (!phone && !email) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white/4 px-4 py-3 text-sm text-muted">
        No phone or email on this lead yet.
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {phone ? (
        <a href={`tel:${phone}`} className="rounded-2xl border border-line bg-white/4 px-4 py-3 hover:border-gold/30">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted">
            <Phone className="h-3.5 w-3.5 text-gold" />
            Phone
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">{phone}</p>
        </a>
      ) : null}
      {email ? (
        <a href={`mailto:${email}`} className="rounded-2xl border border-line bg-white/4 px-4 py-3 hover:border-gold/30">
          <p className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted">
            <Mail className="h-3.5 w-3.5 text-gold" />
            Email
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">{email}</p>
        </a>
      ) : null}
    </div>
  )
}
