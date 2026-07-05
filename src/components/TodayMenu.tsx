import type { DailyMenu } from '../types'
import { completion } from '../lib/adherence'
import { toPct } from '../lib/number'
import { BTN_PRIMARY, BTN_SECONDARY } from '../lib/styles'
import { daysAgoLabel, type WorkoutStats } from '../lib/history'
import MenuItemRow from './MenuItemRow'
import AddExerciseForm from './AddExerciseForm'

interface Props {
  menu: DailyMenu
  stats?: WorkoutStats
  onToggle: (exerciseId: string, done: boolean) => void
  onResult: (exerciseId: string, patch: { weightKg?: number; reps?: number }) => void
  onAdd: (spec: { name: string; targetSets: number; targetReps: string; targetWeightKg?: number }) => void
  onRemove: (exerciseId: string) => void
  onShare: () => void
  onChangeWorkout: () => void
  onFinish: () => void
}

export default function TodayMenu({ menu, stats, onToggle, onResult, onAdd, onRemove, onShare, onChangeWorkout, onFinish }: Props) {
  const pct = completion(menu)
  const doneCount = menu.items.filter((i) => i.done).length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-500">Today's workout</div>
          <h2 className="text-lg font-semibold text-slate-800">{menu.workoutName ?? 'Session'}</h2>
          {stats && (
            <div className="mt-0.5 text-xs text-slate-500">
              {stats.lastDate
                ? `Last: ${stats.lastDate} (${daysAgoLabel(stats.daysSince ?? 0)})`
                : 'First time'}
              {' · '}
              <span className="text-[#01A09B]">done {stats.count}×</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#01A09B]">{pct === null ? '—' : `${toPct(pct)}%`}</div>
          <div className="text-xs text-slate-500">
            {doneCount}/{menu.items.length} exercises
          </div>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#01A09B] transition-all"
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
            onRemove={() => onRemove(it.exerciseId)}
          />
        ))}
        <AddExerciseForm onAdd={onAdd} />
      </div>

      <button onClick={onFinish} className={`${BTN_PRIMARY} w-full py-2.5 text-sm font-semibold`}>
        Finish ✓
      </button>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={onChangeWorkout} className={`${BTN_SECONDARY} py-2 text-sm`}>
          Change workout
        </button>
        <button onClick={onShare} className={`${BTN_SECONDARY} py-2 text-sm`}>
          Share to LINE
        </button>
      </div>
    </div>
  )
}
