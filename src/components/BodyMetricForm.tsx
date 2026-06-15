import { useState } from 'react'
import { upsertMetric } from '../db/repo'
import { todayISO } from '../lib/date'

export default function BodyMetricForm() {
  const [date, setDate] = useState(todayISO())
  const [weight, setWeight] = useState('')
  const [fat, setFat] = useState('')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const weightKg = weight === '' ? undefined : Number(weight)
    const bodyFatPct = fat === '' ? undefined : Number(fat)
    if (weightKg === undefined && bodyFatPct === undefined) {
      setMsg('体重か体脂肪のどちらかを入力してください。')
      return
    }
    await upsertMetric({ date, weightKg, bodyFatPct })
    setMsg('保存しました。')
    setWeight('')
    setFat('')
    setTimeout(() => setMsg(''), 2000)
  }

  const field = 'w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-base'

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div>
        <label className="mb-1 block text-xs text-slate-400">日付</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-400">体重 (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="例 70.5"
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">体脂肪率 (%)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            placeholder="例 18.0"
            className={field}
          />
        </div>
      </div>
      <button className="w-full rounded-xl bg-sky-600 py-2 font-medium active:bg-sky-700">
        記録する
      </button>
      {msg && <p className="text-center text-sm text-emerald-400">{msg}</p>}
    </form>
  )
}
