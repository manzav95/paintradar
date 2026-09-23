import { cn } from '@/lib/cn'
import { scoreLabel } from '@/lib/format'

export function LeadScore({
  score,
  size = 'md',
  showLabel = true,
}: {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}) {
  const dim = size === 'lg' ? 84 : size === 'md' ? 64 : 44
  const stroke = size === 'sm' ? 4 : 5
  const radius = (dim - stroke * 2) / 2
  const circ = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  const tone = score >= 85 ? '#3dcc8a' : score >= 70 ? '#e8b44a' : '#4d9fff'

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            stroke={tone}
            strokeWidth={stroke}
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('font-bold text-ink', size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-xl')}>
            {score}
          </span>
        </div>
      </div>
      {showLabel && size !== 'sm' ? (
        <div>
          <p className="text-sm font-semibold text-ink">{scoreLabel(score)}</p>
          <p className="text-[11px] text-muted">Lead score</p>
        </div>
      ) : null}
    </div>
  )
}
