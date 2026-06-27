import { useEffect, useState } from 'react'
import { setTargets } from '../db/repo'
import { useSettings } from '../db/hooks'
import { CARD, FIELD } from '../lib/styles'

export default function SettingsForm() {
  const settings = useSettings()
  const [fat, setFat] = useState('')
  const [muscle, setMuscle] = useState('')
  const [date, setDate] = useState('')

  // 設定読込時に入力欄へ反映。
  useEffect(() => {
    if (!settings) return
    setFat(settings.targetBodyFatPct?.toString() ?? '')
    setMuscle(settings.targetMuscleKg?.toString() ?? '')
    setDate(settings.targetDate ?? '')
  }, [settings])

  if (!settings) return null

  const saveTargets = () => {
    void setTargets({
      targetBodyFatPct: fat === '' ? undefined : Number(fat),
      targetMuscleKg: muscle === '' ? undefined : Number(muscle),
      targetDate: date === '' ? undefined : date,
    })
  }

  const field = `w-full ${FIELD}`

  return (
    <div className={`space-y-3 ${CARD} p-4`}>
      <div className="text-sm font-medium text-slate-300">Goals (body composition)</div>
      <p className="text-xs text-slate-500">
        Used for the plan card. Compared against your latest values on the Body tab.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-400">Target body fat (%)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            onBlur={saveTargets}
            placeholder="e.g. 15"
            className={field}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-400">Target muscle (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={muscle}
            onChange={(e) => setMuscle(e.target.value)}
            onBlur={saveTargets}
            placeholder="e.g. 33"
            className={field}
          />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs text-slate-400">Target date (by when)</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          onBlur={saveTargets}
          className={field}
        />
      </div>
    </div>
  )
}
