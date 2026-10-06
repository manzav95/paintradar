import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { parseMeasurement } from '@/lib/money'

export function MeasureInput({
  value,
  onChange,
  large,
  suffix = 'ft',
}: {
  value: number
  onChange: (value: number) => void
  large?: boolean
  suffix?: string
}) {
  const [text, setText] = useState(value ? String(value) : '')

  useEffect(() => {
    setText(value ? String(Number(value.toFixed(3)).toString()) : '')
  }, [value])

  return (
    <div className="relative">
      <input
        value={text}
        inputMode="decimal"
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => {
          setText(event.target.value)
          onChange(parseMeasurement(event.target.value))
        }}
        onBlur={() => setText(value ? String(Number(value.toFixed(3))) : '')}
        className={cn(
          'w-full rounded-xl border border-line bg-bg-soft px-3 text-ink outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/15',
          large ? 'h-14 text-lg font-semibold' : 'h-11 text-sm',
        )}
        placeholder="12.5 or 12' 6&quot;"
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-faint">{suffix}</span>
    </div>
  )
}
