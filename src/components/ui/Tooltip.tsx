import type { ReactNode } from 'react'

export function Tooltip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0b0c10] px-2.5 py-1 text-[11px] text-ink opacity-0 shadow-lg ring-1 ring-white/10 transition group-hover:opacity-100">
        {label}
      </span>
    </span>
  )
}
