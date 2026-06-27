import { deleteMetric } from '../db/repo'
import { useMetricsDesc } from '../db/hooks'
import { CARD } from '../lib/styles'
import BodyMetricForm from '../components/BodyMetricForm'
import BodyTrendChart from '../components/BodyTrendChart'

export default function BodyPage() {
  const metrics = useMetricsDesc()

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-800">Body Composition</h1>
        <p className="text-sm text-slate-500">Log weight, body fat & muscle (optional, any time)</p>
      </header>

      <BodyMetricForm />
      <BodyTrendChart metrics={metrics ?? []} />

      {metrics && metrics.length > 0 && (
        <div className={`${CARD} p-2`}>
          <div className="px-2 py-1 text-sm font-medium text-slate-700">History</div>
          <ul className="divide-y divide-slate-100">
            {metrics.map((m) => (
              <li key={m.date} className="flex items-center justify-between px-2 py-2 text-sm">
                <span className="text-slate-500">{m.date}</span>
                <span className="flex-1 px-3 text-slate-700">
                  {m.weightKg !== undefined && <span className="mr-3">{m.weightKg} kg</span>}
                  {m.bodyFatPct !== undefined && <span className="mr-3 text-pink-500">{m.bodyFatPct} %</span>}
                  {m.muscleKg !== undefined && <span className="text-[#01A09B]">{m.muscleKg} kg muscle</span>}
                </span>
                <button
                  onClick={() => deleteMetric(m.date)}
                  className="text-xs text-rose-500 active:text-rose-400"
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
