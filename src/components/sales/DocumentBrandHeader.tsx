import { COMPANY_ACCENT, COMPANY_LOGO_SRC, COMPANY_NAME, COMPANY_NAME_LINES } from '@/lib/brand'

export function DocumentBrandHeader({
  documentTitle,
  subtitle,
  date,
}: {
  documentTitle: string
  subtitle?: string
  date: string
}) {
  const dateLabel = new Date(date).toLocaleDateString()

  return (
    <header>
      <div className="flex items-center gap-7">
        <img src={COMPANY_LOGO_SRC} alt={COMPANY_NAME} className="h-[92px] w-auto object-contain" />
        <div className="text-[42px] font-extrabold leading-[0.95] tracking-tight text-[#111111]">
          {COMPANY_NAME_LINES.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
      <div className="mt-5 h-2 w-full" style={{ backgroundColor: COMPANY_ACCENT }} />
      <div className="mt-4 flex items-start justify-between gap-6">
        <div>
          <p className="text-xl font-semibold text-[#111111]">{documentTitle}</p>
          {subtitle ? <p className="mt-1 text-sm text-[#6d695f]">{subtitle}</p> : null}
        </div>
        <p className="pt-1 text-sm text-[#111111]">Date: {dateLabel}</p>
      </div>
    </header>
  )
}
