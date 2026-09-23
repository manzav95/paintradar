import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: 'sm' | 'md' | 'lg'
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gold text-[#1a1406] hover:bg-gold-soft shadow-[0_8px_20px_rgba(232,180,74,0.18)]',
  secondary:
    'bg-surface-3 text-ink border border-line hover:border-line-strong hover:bg-white/5',
  ghost: 'bg-transparent text-muted hover:text-ink hover:bg-white/5',
  danger: 'bg-urgent/15 text-urgent border border-urgent/20 hover:bg-urgent/25',
  gold: 'bg-gold/12 text-gold border border-gold/25 hover:bg-gold/20',
}

const sizes = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
}

export function Button({
  className,
  variant = 'secondary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}
