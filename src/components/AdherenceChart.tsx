import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DailyMenu } from '../types'
import { adherenceSeries } from '../lib/adherence'
import { CARD } from '../lib/styles'

interface Props {
  menus: DailyMenu[]
}

export default function AdherenceChart({ menus }: Props) {
  const data = adherenceSeries(menus).map((d) => ({ ...d, label: d.date.slice(5) }))

  if (data.length === 0) {
    return (
      <div className={`${CARD} p-6 text-center text-sm text-slate-400`}>
        No training records yet.
      </div>
    )
  }

  return (
    <div className={`${CARD} p-3`}>
      <div className="mb-2 px-1 text-sm font-medium text-slate-300">Completion trend</div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
          <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
            labelStyle={{ color: '#cbd5e1' }}
            formatter={(v: number) => [`${v}%`, 'Completion']}
          />
          <Line type="monotone" dataKey="pct" stroke="#38bdf8" strokeWidth={2} dot={{ r: 2 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
