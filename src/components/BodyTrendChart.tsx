import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { BodyMetric } from '../types'
import { CARD } from '../lib/styles'

interface Props {
  metrics: BodyMetric[]
}

export default function BodyTrendChart({ metrics }: Props) {
  const data = [...metrics]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({
      label: m.date.slice(5),
      weight: m.weightKg ?? null,
      fat: m.bodyFatPct ?? null,
      muscle: m.muscleKg ?? null,
    }))

  if (data.length === 0) {
    return (
      <div className={`${CARD} p-6 text-center text-sm text-slate-400`}>
        No records yet.
      </div>
    )
  }

  return (
    <div className={`${CARD} p-3`}>
      <div className="mb-2 px-1 text-sm font-medium text-slate-700">Body trend</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
          <YAxis yAxisId="w" stroke="#0ea5e9" fontSize={11} />
          <YAxis yAxisId="f" orientation="right" stroke="#ec4899" fontSize={11} />
          <Tooltip
            contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8 }}
            labelStyle={{ color: '#475569' }}
          />
          <Line
            yAxisId="w"
            type="monotone"
            dataKey="weight"
            name="Weight (kg)"
            stroke="#0ea5e9"
            strokeWidth={2}
            connectNulls
            dot={{ r: 2 }}
          />
          <Line
            yAxisId="w"
            type="monotone"
            dataKey="muscle"
            name="Muscle (kg)"
            stroke="#01A09B"
            strokeWidth={2}
            connectNulls
            dot={{ r: 2 }}
          />
          <Line
            yAxisId="f"
            type="monotone"
            dataKey="fat"
            name="Body fat (%)"
            stroke="#ec4899"
            strokeWidth={2}
            connectNulls
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
