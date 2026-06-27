import type { DailyMenu } from '../types'
import { completion } from '../lib/adherence'
import { toPct } from '../lib/number'
import MenuItemRow from './MenuItemRow'

interface Props {
  menu: DailyMenu
  onToggle: (exerciseId: string, done: boolean) => void
  onResult: (exerciseId: string, patch: { weightKg?: number; reps?: number }) => void
  onShare: () => void
  onChangeWorkout: () => void
}

export default function TodayMenu({ menu, onToggle, onResult, onShare, onChangeWorkout }: Props) {
  const pct = completion(menu)
  const doneCount = menu.items.filter((i) => i.done).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-400">Today's workout</div>
          <h2 className="text-lg font-semibold">{menu.workoutName ?? 'Session'}</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-sky-400">{pct === null ? '—' : `${toPct(pct)}%`}</div>
          <div className="text-xs text-slate-400">
            {doneCount}/{menu.items.length} exercises
          </div>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${toPct(pct ?? 0)}%` }}
        />
      </div>

      <div className="space-y-2">
        {menu.items.map((it) => (
          <MenuItemRow
            key={it.exerciseId}
            item={it}
            onToggle={(done) => onToggle(it.exerciseId, done)}
            onResult={(patch) => onResult(it.exerciseId, patch)}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onChangeWorkout}
          className="rounded-xl border border-slate-800 py-2 text-sm text-slate-400 active:bg-slate-800"
        >
          Change workout
        </button>
        <button
          onClick={onShare}
          className="rounded-xl bg-emerald-600 py-2 text-sm font-medium active:bg-emerald-700"
        >
          Share to LINE
        </button>
      </div>
    </div>
  )
}
