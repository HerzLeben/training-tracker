import { useState } from 'react'
import { upsertExercise, deleteExercise } from '../db/repo'
import { useExercises } from '../db/hooks'
import type { Category, Exercise } from '../types'
import { SLOT_LABEL } from '../lib/labels'
import { CARD, FIELD } from '../lib/styles'

const SLOTS: Category[] = ['push', 'pull', 'legs', 'core']

export default function ExerciseManager() {
  const exercises = useExercises()
  const [name, setName] = useState('')
  const [slot, setSlot] = useState<Category>('push')
  const [muscle, setMuscle] = useState('')

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    const id = `custom-${slot}-${Date.now()}`
    await upsertExercise({ id, name: name.trim(), slot, muscle: muscle.trim() || '—', isCustom: true, enabled: true })
    setName('')
    setMuscle('')
  }

  const toggle = (ex: Exercise) => upsertExercise({ ...ex, enabled: !ex.enabled })

  if (!exercises) return null
  const field = FIELD

  return (
    <div className={`space-y-3 ${CARD} p-4`}>
      <div className="text-sm font-medium text-slate-300">Exercise catalog</div>
      <p className="text-xs text-slate-500">
        Unchecked exercises are excluded from suggestions. The kg field is the starting working
        weight; it then progresses automatically as you train. You can add your own exercises too.
      </p>

      {SLOTS.map((s) => (
        <div key={s}>
          <div className="mb-1 mt-2 text-xs font-semibold text-sky-300">{SLOT_LABEL[s]}</div>
          <ul className="space-y-1">
            {exercises
              .filter((e) => e.slot === s)
              .map((ex) => (
                <li key={ex.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={ex.enabled}
                    onChange={() => toggle(ex)}
                    className="h-4 w-4 shrink-0 accent-sky-500"
                  />
                  <span className={`min-w-0 flex-1 truncate ${ex.enabled ? '' : 'text-slate-500 line-through'}`}>
                    {ex.name}
                    <span className="ml-1 text-xs text-slate-500">({ex.muscle})</span>
                  </span>
                  {ex.slot === 'core' ? (
                    <span className="shrink-0 text-xs text-slate-500">{ex.target ?? 'bodyweight'}</span>
                  ) : (
                    <input
                      type="number"
                      inputMode="decimal"
                      step="2.5"
                      value={ex.weightKg ?? ''}
                      onChange={(e) =>
                        upsertExercise({
                          ...ex,
                          weightKg: e.target.value === '' ? undefined : Number(e.target.value),
                        })
                      }
                      placeholder="kg"
                      className="w-16 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-right text-sm"
                    />
                  )}
                  {ex.isCustom && (
                    <button
                      onClick={() => deleteExercise(ex.id)}
                      className="shrink-0 text-xs text-rose-400"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
          </ul>
        </div>
      ))}

      <form onSubmit={add} className="space-y-2 border-t border-slate-800 pt-3">
        <div className="text-xs font-medium text-slate-300">Add an exercise</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Exercise name (e.g. Dips)"
          className={`w-full ${field}`}
        />
        <div className="grid grid-cols-2 gap-2">
          <select value={slot} onChange={(e) => setSlot(e.target.value as Category)} className={field}>
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {SLOT_LABEL[s]}
              </option>
            ))}
          </select>
          <input
            value={muscle}
            onChange={(e) => setMuscle(e.target.value)}
            placeholder="Muscle (e.g. Chest)"
            className={field}
          />
        </div>
        <button className="w-full rounded-xl bg-slate-700 py-2 text-sm active:bg-slate-600">Add</button>
      </form>
    </div>
  )
}
