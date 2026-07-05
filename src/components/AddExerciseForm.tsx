import { useState } from 'react'

interface Props {
  onAdd: (spec: { name: string; targetSets: number; targetReps: string; targetWeightKg?: number }) => void
}

const field = 'rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-800 placeholder:text-slate-400'

// その日のセッションに種目を追加するフォーム。回数は自由入力（10 固定ではない）。
export default function AddExerciseForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')

  const submit = () => {
    const n = name.trim()
    if (!n) return
    onAdd({
      name: n,
      targetSets: Math.max(1, Number(sets) || 1),
      targetReps: reps.trim(),
      targetWeightKg: weight.trim() === '' ? undefined : Number(weight),
    })
    setName('')
    setSets('3')
    setReps('')
    setWeight('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-slate-300 py-2 text-sm text-slate-500 active:bg-slate-100"
      >
        + Add exercise
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Exercise name"
        className={`w-full ${field}`}
        autoFocus
      />
      <div className="flex items-center gap-1.5">
        <input
          value={sets}
          onChange={(e) => setSets(e.target.value)}
          inputMode="numeric"
          className={`w-11 text-center ${field}`}
          aria-label="sets"
        />
        <span className="text-xs text-slate-400">×</span>
        <input
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          placeholder="reps (e.g. 12 or 8-12)"
          className={`flex-1 ${field}`}
          aria-label="reps"
        />
        <input
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          inputMode="decimal"
          placeholder="kg"
          className={`w-14 text-right ${field}`}
          aria-label="weight"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setOpen(false)} className="rounded-lg py-1.5 text-sm text-slate-500 active:bg-slate-100">
          Cancel
        </button>
        <button
          onClick={submit}
          disabled={!name.trim()}
          className="rounded-lg bg-[#01A09B] py-1.5 text-sm font-medium text-white active:bg-[#017a75] disabled:opacity-50"
        >
          Add
        </button>
      </div>
    </div>
  )
}
