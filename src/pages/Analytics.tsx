import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { format, subDays } from 'date-fns'
import { CATEGORY_LABELS } from '@/types'
import { formatCurrency } from '@/lib/format'
import { useAppState } from '@/providers/AppState'

const COLORS = ['#e8b44a', '#4d9fff', '#3dcc8a', '#ef6a45', '#f3d07a', '#7aa2ff']

export function Analytics() {
  const { leads } = useAppState()
  const active = leads.filter((lead) => lead.status !== 'dismissed')
  const won = active.filter((lead) => lead.status === 'won')
  const conversion = active.length ? Math.round((won.length / active.length) * 100) : 0
  const avgScore = active.length ? Math.round(active.reduce((sum, lead) => sum + lead.score, 0) / active.length) : 0
  const potential = active.reduce((sum, lead) => sum + (lead.estimatedValueLow + lead.estimatedValueHigh) / 2, 0)
  const wonRevenue = won.reduce((sum, lead) => sum + (lead.estimatedValueLow + lead.estimatedValueHigh) / 2, 0)

  const byDay = Array.from({ length: 7 }).map((_, index) => {
    const day = subDays(new Date(), 6 - index)
    const count = active.filter((lead) => format(new Date(lead.postedAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')).length
    return { day: format(day, 'EEE'), leads: count }
  })

  const byService = Object.entries(
    active.reduce<Record<string, number>>((acc, lead) => {
      acc[CATEGORY_LABELS[lead.category]] = (acc[CATEGORY_LABELS[lead.category]] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

  const byCity = Object.entries(
    active.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.city] = (acc[lead.city] ?? 0) + 1
      return acc
    }, {}),
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const bySource = Object.entries(
    active.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.source] = (acc[lead.source] ?? 0) + 1
      return acc
    }, {}),
  ).map(([name, value]) => ({ name, value }))

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-muted">Opportunity volume, quality, and estimated revenue.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Kpi label="Conversion rate" value={`${conversion}%`} />
        <Kpi label="Average lead score" value={`${avgScore}`} />
        <Kpi label="Potential revenue" value={formatCurrency(potential)} />
        <Kpi label="Won revenue" value={formatCurrency(wonRevenue)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Leads over time">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={byDay}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="day" stroke="#9a9589" />
              <YAxis stroke="#9a9589" allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.08)' }} />
              <Line type="monotone" dataKey="leads" stroke="#e8b44a" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Leads by service">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byService}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" hide />
              <YAxis stroke="#9a9589" allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.08)' }} />
              <Bar dataKey="value" fill="#e8b44a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Leads by city">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={byCity} layout="vertical">
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" stroke="#9a9589" allowDecimals={false} />
              <YAxis type="category" dataKey="name" stroke="#9a9589" width={110} />
              <Tooltip contentStyle={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.08)' }} />
              <Bar dataKey="value" fill="#4d9fff" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Source performance">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={bySource} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                {bySource.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#12141a', border: '1px solid rgba(255,255,255,0.08)' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </motion.div>
  )
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  )
}
