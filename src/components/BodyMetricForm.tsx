import { useState } from 'react'
import { upsertMetric } from '../db/repo'
import { todayISO } from '../lib/date'
import { CARD, FIELD } from '../lib/styles'

export default function BodyMetricForm() {
  const [date, setDate] = useState(todayISO())
  const [weight, setWeight] = useState('')
  const [fat, setFat] = useState('')
  const [muscle, setMuscle] = useState('')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const weightKg = weight === '' ? undefined : Number(weight)
    const bodyFatPct = fat === '' ? undefined : Number(fat)
    const muscleKg = muscle === '' ? undefined : Number(muscle)
    if (weightKg === undefined && bodyFatPct === undefined && muscleKg === undefined) {
      setMsg('Enter at least one value.')
      return
    }
    await upsertMetric({ date, weightKg, bodyFatPct, muscleKg })
    setMsg('Saved.')
    setWeight('')
    setFat('')
    setMuscle('')
    setTimeout(() => setMsg(''), 2000)
  }

  const field = `w-full ${FIELD}`

  return (
    <form onSubmit={submit} className={`space-y-3 ${CARD} p-4`}>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Weight (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 70.5"
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Body fat (%)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            placeholder="e.g. 18.0"
            className={field}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-500">Muscle mass (kg)</label>
        <input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={muscle}
          onChange={(e) => setMuscle(e.target.value)}
          placeholder="e.g. 32.5"
          className={field}
        />
      </div>
      <button className="w-full rounded-xl bg-[#01A09B] py-2 font-medium text-white active:bg-[#017a75]">
        Save
      </button>
      {msg && <p className="text-center text-sm text-[#01A09B]">{msg}</p>}
    </form>
  )
}
