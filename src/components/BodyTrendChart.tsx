import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { BodyMetric } from '../types'

interface Props {
  metrics: BodyMetric[]
}

export default function BodyTrendChart({ metrics }: Props) {
  const data = [...metrics]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ label: m.date.slice(5), weight: m.weightKg ?? null, fat: m.bodyFatPct ?? null }))

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-sm text-slate-400">
        記録がまだありません。
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-3">
      <div className="mb-2 px-1 text-sm font-medium text-slate-300">体重・体脂肪の推移</div>
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
            name="体重(kg)"
            stroke="#38bdf8"
            strokeWidth={2}
            connectNulls
            dot={{ r: 2 }}
          />
          <Line
            yAxisId="f"
            type="monotone"
            dataKey="fat"
            name="体脂肪(%)"
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
