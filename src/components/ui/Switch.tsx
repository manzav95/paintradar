import { cn } from '@/lib/cn'

export function Switch({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label?: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn('flex w-full items-center gap-3 text-left text-sm text-ink', className)}
    >
      <span
        className={cn(
          'flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors',
          checked ? 'justify-end bg-gold' : 'justify-start bg-white/15',
        )}
      >
        <span className="h-6 w-6 rounded-full bg-white shadow-md" />
      </span>
      {label ? <span className="min-w-0 leading-5">{label}</span> : null}
    </button>
  )
}
