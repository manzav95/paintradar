import type { ReactNode } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { CountUp } from '@/components/ui/CountUp'
import { cn } from '@/lib/cn'

export function StatCard({
  label,
  value,
  prefix,
  suffix,
  delta,
  icon,
  spark,
}: {
  label: string
  value: number
  prefix?: string
  suffix?: string
  delta: string
  icon: ReactNode
  spark: number[]
}) {
  const data = spark.map((item, index) => ({ index, value: item }))
  return (
    <div className="card-hover rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
        <div className="rounded-xl bg-gold/10 p-2 text-gold">{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-ink">
        <CountUp value={value} prefix={prefix} suffix={suffix} />
      </p>
      <p className={cn('mt-1 text-xs', delta.startsWith('+') || delta.includes('hour') ? 'text-success' : 'text-muted')}>
        {delta}
      </p>
      <div className="mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <Area type="monotone" dataKey="value" stroke="#e8b44a" fill="rgba(232,180,74,0.16)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
