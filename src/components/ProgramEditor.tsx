import type { PrescribedExercise, Workout } from '../types'
import { upsertWorkout, deleteWorkout, setDailyCore, loadSampleProgram } from '../db/repo'
import { useWorkouts, useSettings } from '../db/hooks'
import { CARD } from '../lib/styles'

const numInput = 'rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 placeholder:text-slate-400'

const newItem = (): PrescribedExercise => ({
  id: `ex-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  name: '',
  targetSets: 3,
  targetReps: '10',
})

/** 1種目（処方）の編集行。weight 列は任意。 */
function ExerciseRow({
  item,
  onChange,
  onDelete,
}: {
  item: PrescribedExercise
  onChange: (patch: Partial<PrescribedExercise>) => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        value={item.name}
        onChange={(e) => onChange({ name: e.target.value })}
        placeholder="Exercise"
        className={`min-w-0 flex-1 ${numInput}`}
      />
      <input
        type="number"
        inputMode="numeric"
        min={1}
        value={item.targetSets}
        onChange={(e) => onChange({ targetSets: Number(e.target.value) || 1 })}
        className={`w-11 text-center ${numInput}`}
        aria-label="sets"
      />
      <span className="text-xs text-slate-400">×</span>
      <input
        value={item.targetReps}
        onChange={(e) => onChange({ targetReps: e.target.value })}
        placeholder="reps"
        className={`w-14 text-center ${numInput}`}
        aria-label="reps"
      />
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        value={item.targetWeightKg ?? ''}
        onChange={(e) =>
          onChange({ targetWeightKg: e.target.value === '' ? undefined : Number(e.target.value) })
        }
        placeholder="kg"
        className={`w-14 text-right ${numInput}`}
        aria-label="target weight"
      />
      <button onClick={onDelete} className="px-1 text-rose-500" aria-label="delete exercise">
        ×
      </button>
    </div>
  )
}

function WorkoutCard({ workout }: { workout: Workout }) {
  const update = (patch: Partial<Workout>) => void upsertWorkout({ ...workout, ...patch })
  const updateItem = (id: string, patch: Partial<PrescribedExercise>) =>
    update({ items: workout.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })
  const deleteItem = (id: string) => update({ items: workout.items.filter((it) => it.id !== id) })

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <input
          value={workout.name}
          onChange={(e) => update({ name: e.target.value })}
          placeholder="Workout name (e.g. Day A / Push)"
          className={`min-w-0 flex-1 font-medium ${numInput}`}
        />
        <button
          onClick={() => void deleteWorkout(workout.id)}
          className="shrink-0 text-xs text-rose-500"
        >
          Delete
        </button>
      </div>
      <div className="space-y-1.5">
        {workout.items.map((it) => (
          <ExerciseRow
            key={it.id}
            item={it}
            onChange={(patch) => updateItem(it.id, patch)}
            onDelete={() => deleteItem(it.id)}
          />
        ))}
      </div>
      <button
        onClick={() => update({ items: [...workout.items, newItem()] })}
        className="w-full rounded-lg border border-dashed border-slate-300 py-1.5 text-xs text-slate-500 active:bg-slate-100"
      >
        + Add exercise
      </button>
    </div>
  )
}

export default function ProgramEditor() {
  const workouts = useWorkouts()
  const settings = useSettings()
  if (!workouts || !settings) return null

  const addWorkout = () =>
    void upsertWorkout({ id: `w-${Date.now()}`, name: `Workout ${workouts.length + 1}`, items: [] })

  const core = settings.dailyCore
  const updateCore = (items: PrescribedExercise[]) => void setDailyCore(items)

  return (
    <div className="space-y-4">
      <div className={`space-y-3 ${CARD} p-4`}>
        <div className="text-sm font-medium text-slate-700">Program (from your trainer)</div>
        <p className="text-xs text-slate-400">
          Add each workout day with its exercises and target sets × reps @ weight. You then pick one
          on the Today tab and log your results.
        </p>
        {workouts.map((w) => (
          <WorkoutCard key={w.id} workout={w} />
        ))}
        <button
          onClick={addWorkout}
          className="w-full rounded-xl bg-slate-100 py-2 text-sm font-medium text-slate-700 active:bg-slate-200"
        >
          + Add workout
        </button>
        <button
          onClick={() => void loadSampleProgram()}
          className="w-full rounded-xl border border-dashed border-slate-300 py-2 text-xs text-slate-500 active:bg-slate-100"
        >
          Load trainer program (6-day)
        </button>
        <p className="text-[11px] text-slate-400">
          Loads the 6 menus (Chest / Shoulders / Arms·Biceps / Arms·Triceps / Legs / Back). Re-tapping
          resets those to the trainer's values; your own added workouts are kept.
        </p>
      </div>

      <div className={`space-y-2 ${CARD} p-4`}>
        <div className="text-sm font-medium text-slate-700">Daily core</div>
        <p className="text-xs text-slate-400">Shown every day on the Today tab.</p>
        <div className="space-y-1.5">
          {core.map((it) => (
            <ExerciseRow
              key={it.id}
              item={it}
              onChange={(patch) => updateCore(core.map((c) => (c.id === it.id ? { ...c, ...patch } : c)))}
              onDelete={() => updateCore(core.filter((c) => c.id !== it.id))}
            />
          ))}
        </div>
        <button
          onClick={() => updateCore([...core, { ...newItem(), targetReps: '45–60s', category: 'core' }])}
          className="w-full rounded-lg border border-dashed border-slate-300 py-1.5 text-xs text-slate-500 active:bg-slate-100"
        >
          + Add core exercise
        </button>
      </div>
    </div>
  )
}
