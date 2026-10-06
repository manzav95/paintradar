import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { centsToDollars, dollarsToCents, formatCents, formatPercent, markupAmountCents, markedUpCents } from '@/lib/money'

const fieldClass =
  'w-full border-0 bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-faint'

export function MoneyInput({
  valueCents,
  onValueCents,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  valueCents?: number
  onValueCents?: (cents: number) => void
}) {
  return (
    <div className={cn('flex overflow-hidden rounded-xl border border-line bg-bg-soft focus-within:border-gold/50 focus-within:ring-2 focus-within:ring-gold/15', className)}>
      <span className="flex items-center bg-gold/20 px-3 text-sm font-bold text-gold">$</span>
      <input
        {...props}
        type="number"
        step={props.step ?? '0.01'}
        inputMode="decimal"
        className={fieldClass}
        value={valueCents != null ? centsToDollars(valueCents) : props.defaultValue}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => onValueCents?.(dollarsToCents(Number(event.target.value) || 0))}
      />
    </div>
  )
}

export function PercentInput({
  value,
  onValue,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value?: number
  onValue?: (percent: number) => void
}) {
  return (
    <div className={cn('flex overflow-hidden rounded-xl border border-line bg-bg-soft focus-within:border-gold/50 focus-within:ring-2 focus-within:ring-gold/15', className)}>
      <input
        {...props}
        type="number"
        step={props.step ?? '0.5'}
        inputMode="decimal"
        className={fieldClass}
        value={value != null ? Number(value.toFixed(2)) : props.defaultValue}
        onFocus={(event) => event.currentTarget.select()}
        onChange={(event) => onValue?.(Number(event.target.value) || 0)}
      />
      <span className="flex items-center bg-gold/20 px-3 text-sm font-bold text-gold">%</span>
    </div>
  )
}

export function MarkupCompare({
  costCents,
  markupPercent,
  compact,
}: {
  costCents: number
  markupPercent: number
  compact?: boolean
}) {
  const sell = markedUpCents(costCents, markupPercent)
  const extra = markupAmountCents(costCents, markupPercent)

  if (compact) {
    return (
      <p className="text-sm text-muted">
        Cost {formatCents(costCents)} → Sell <span className="font-semibold text-ink">{formatCents(sell)}</span>{' '}
        <span className="text-gold">({formatPercent(markupPercent)})</span>
      </p>
    )
  }

  return (
    <div className="rounded-2xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm">
      <div className="flex justify-between text-muted">
        <span>Your cost</span>
        <span>{formatCents(costCents)}</span>
      </div>
      <div className="mt-1 flex justify-between text-gold">
        <span>+ Markup {formatPercent(markupPercent)}</span>
        <span>{formatCents(extra)}</span>
      </div>
      <div className="mt-2 flex justify-between border-t border-gold/20 pt-2 font-semibold text-ink">
        <span>Sell price</span>
        <span>{formatCents(sell)}</span>
      </div>
    </div>
  )
}
