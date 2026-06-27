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
      <div className="mb-2 px-1 text-sm font-medium text-slate-300">Body trend</div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
          <YAxis yAxisId="w" stroke="#38bdf8" fontSize={11} />
          <YAxis yAxisId="f" orientation="right" stroke="#f472b6" fontSize={11} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
            labelStyle={{ color: '#cbd5e1' }}
          />
          <Line
            yAxisId="w"
            type="monotone"
            dataKey="weight"
            name="Weight (kg)"
            stroke="#38bdf8"
            strokeWidth={2}
            connectNulls
            dot={{ r: 2 }}
          />
          <Line
            yAxisId="w"
            type="monotone"
            dataKey="muscle"
            name="Muscle (kg)"
            stroke="#34d399"
            strokeWidth={2}
            connectNulls
            dot={{ r: 2 }}
          />
          <Line
            yAxisId="f"
            type="monotone"
            dataKey="fat"
            name="Body fat (%)"
            stroke="#f472b6"
            strokeWidth={2}
            connectNulls
            dot={{ r: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
