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

  // 設定読込時に入力欄へ反映。
  useEffect(() => {
    if (!settings) return
    setFat(settings.targetBodyFatPct?.toString() ?? '')
    setMuscle(settings.targetMuscleKg?.toString() ?? '')
  }, [settings])

  if (!settings) return null

  const saveTargets = () => {
    void setTargets({
      targetBodyFatPct: fat === '' ? undefined : Number(fat),
      targetMuscleKg: muscle === '' ? undefined : Number(muscle),
    })
  }

  const field = 'w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-base'

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">週のトレーニング回数</label>
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
              {f}回
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-500">回数に応じて分割（全身/上下/部位別）を自動構築します。</p>
      </div>

      <div>
        <div className="mb-1 text-sm font-medium text-slate-300">週の分割（自動）</div>
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
        <div className="mb-1 text-sm font-medium text-slate-300">目標（体組成）</div>
        <p className="mb-2 text-xs text-slate-500">
          目標と「体組成」タブの最新値の差から、減量寄り／筋肥大寄りを自動で決めます。
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs text-slate-400">目標体脂肪率 (%)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              onBlur={saveTargets}
              placeholder="例 15"
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-400">目標筋肉量 (kg)</label>
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              value={muscle}
              onChange={(e) => setMuscle(e.target.value)}
              onBlur={saveTargets}
              placeholder="例 33"
              className={field}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
