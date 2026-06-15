import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { setFrequency, setTargets } from '../db/repo'
import { SLOT_SHORT } from '../lib/labels'
import { weekdayLabel } from '../lib/date'

const FREQS = [2, 3, 4, 5, 6]

export default function SettingsForm() {
  const settings = useLiveQuery(() => db.settings.get('app'), [])
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

  const field = 'w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-base'

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">Sessions per week</label>
        <div className="grid grid-cols-5 gap-2">
          {FREQS.map((f) => (
            <button
              key={f}
              onClick={() => setFrequency(f)}
              className={`rounded-xl border py-2 text-sm ${
                settings.weeklyFrequency === f
                  ? 'border-sky-500 bg-sky-600/20 text-sky-300'
                  : 'border-slate-700 text-slate-300'
              }`}
            >
              {f}×
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          The split (full body / upper-lower / push-pull-legs) is built automatically.
        </p>
      </div>

      <div>
        <div className="mb-1 text-sm font-medium text-slate-300">Weekly split (auto)</div>
        <div className="flex justify-between gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map((wd) => (
            <div key={wd} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500">{weekdayLabel(wd)}</span>
              <span
                className={`flex h-8 w-full items-center justify-center rounded-lg text-[11px] font-semibold ${
                  settings.splitPattern[wd] === 'rest'
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-slate-800 text-sky-300'
                }`}
              >
                {SLOT_SHORT[settings.splitPattern[wd]]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800 pt-3">
        <div className="mb-1 text-sm font-medium text-slate-300">Goals (body composition)</div>
        <p className="mb-2 text-xs text-slate-500">
          The fat-loss vs. muscle-gain focus is chosen automatically from the gap between these
          targets and your latest values on the Body tab.
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
        <div className="mt-3">
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
    </div>
  )
}
