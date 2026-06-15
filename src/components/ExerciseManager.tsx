import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { upsertExercise, deleteExercise } from '../db/repo'
import type { Category, Exercise } from '../types'
import { SLOT_LABEL } from '../lib/labels'

const SLOTS: Category[] = ['push', 'pull', 'legs']

export default function ExerciseManager() {
  const exercises = useLiveQuery(() => db.exercises.toArray(), [])
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
  const field = 'rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-base'

  return (
    <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-sm font-medium text-slate-300">Exercise catalog</div>
      <p className="text-xs text-slate-500">
        Unchecked exercises are excluded from suggestions. You can add your own.
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
                    className="h-4 w-4 accent-sky-500"
                  />
                  <span className={ex.enabled ? '' : 'text-slate-500 line-through'}>{ex.name}</span>
                  <span className="text-xs text-slate-500">（{ex.muscle}）</span>
                  {ex.isCustom && (
                    <button
                      onClick={() => deleteExercise(ex.id)}
                      className="ml-auto text-xs text-rose-400"
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
