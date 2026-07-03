import type { DailyMenu, Workout } from '../types'
import { windowCounts } from '../lib/history'
import { CARD } from '../lib/styles'

interface Props {
  workouts: Workout[]
  menus: DailyMenu[]
}

// 直近30日で各メニューを何回やったか。偏り（少ないメニュー）を見える化する。
export default function WorkoutBalance({ workouts, menus }: Props) {
  if (workouts.length === 0) return null
  const c = windowCounts(menus, 30)
  const rows = workouts.map((w) => ({ name: w.name, count: c.byWorkout[w.id] ?? 0 }))
  const max = Math.max(1, ...rows.map((r) => r.count))
  const min = Math.min(...rows.map((r) => r.count))
  const uneven = min < max // 偏りあり

  return (
    <div className={`space-y-2 ${CARD} p-4`}>
      <div className="text-sm font-medium text-slate-700">Training balance (30d)</div>
      <p className="text-xs text-slate-400">Times each workout was done in the last 30 days.</p>
      <div className="space-y-1.5">
        {rows.map((r) => {
          const least = uneven && r.count === min
          return (
            <div key={r.name} className="flex items-center gap-2">
              <span className="w-24 shrink-0 truncate text-sm text-slate-700">{r.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${least ? 'bg-amber-400' : 'bg-[#01A09B]'}`}
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </div>
              <span className={`w-6 text-right text-sm font-semibold tabular-nums ${least ? 'text-amber-600' : 'text-slate-700'}`}>
                {r.count}
              </span>
            </div>
          )
        })}
      </div>
      {(c.personal > 0 || c.home > 0) && (
        <div className="text-xs text-slate-500">
          🧑‍🏫 Personal ×{c.personal} · 🏠 Home ×{c.home}
        </div>
      )}
      {uneven && (
        <p className="text-[11px] text-amber-600">
          Amber = least trained — balance it out.
        </p>
      )}
    </div>
  )
}
