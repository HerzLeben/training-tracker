import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { deleteMetric } from '../db/repo'
import BodyMetricForm from '../components/BodyMetricForm'
import BodyTrendChart from '../components/BodyTrendChart'

export default function BodyPage() {
  const metrics = useLiveQuery(() => db.metrics.orderBy('date').reverse().toArray(), [])

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">Body Composition</h1>
        <p className="text-sm text-slate-400">Log weight, body fat & muscle (optional, any time)</p>
      </header>

      <BodyMetricForm />
      <BodyTrendChart metrics={metrics ?? []} />

      {metrics && metrics.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-2">
          <div className="px-2 py-1 text-sm font-medium text-slate-300">History</div>
          <ul className="divide-y divide-slate-800">
            {metrics.map((m) => (
              <li key={m.date} className="flex items-center justify-between px-2 py-2 text-sm">
                <span className="text-slate-400">{m.date}</span>
                <span className="flex-1 px-3">
                  {m.weightKg !== undefined && <span className="mr-3">{m.weightKg} kg</span>}
                  {m.bodyFatPct !== undefined && <span className="mr-3 text-pink-400">{m.bodyFatPct} %</span>}
                  {m.muscleKg !== undefined && <span className="text-emerald-400">{m.muscleKg} kg muscle</span>}
                </span>
                <button
                  onClick={() => deleteMetric(m.date)}
                  className="text-xs text-rose-400 active:text-rose-300"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
