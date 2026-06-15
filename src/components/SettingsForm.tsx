import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { setGoalType, setRestWeekday } from '../db/repo'
import type { GoalType } from '../types'
import { GOAL_LABEL, SLOT_SHORT } from '../lib/labels'
import { weekdayLabel } from '../lib/date'

const GOALS: GoalType[] = ['cut', 'bulk', 'maintain']

export default function SettingsForm() {
  const settings = useLiveQuery(() => db.settings.get('app'), [])
  if (!settings) return null

  return (
    <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">目標タイプ</label>
        <div className="grid grid-cols-3 gap-2">
          {GOALS.map((g) => (
            <button
              key={g}
              onClick={() => setGoalType(g)}
              className={`rounded-xl border py-2 text-sm ${
                settings.goalType === g
                  ? 'border-sky-500 bg-sky-600/20 text-sky-300'
                  : 'border-slate-700 text-slate-300'
              }`}
            >
              {GOAL_LABEL[g]}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          目標に応じてセット数・レップ数の目安が変わります。
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-300">休養日</label>
        <select
          value={settings.restWeekday}
          onChange={(e) => setRestWeekday(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-base"
        >
          {[0, 1, 2, 3, 4, 5, 6].map((wd) => (
            <option key={wd} value={wd}>
              {weekdayLabel(wd)}曜日
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="mb-1 text-sm font-medium text-slate-300">週の分割（自動）</div>
        <div className="flex justify-between gap-1">
          {[0, 1, 2, 3, 4, 5, 6].map((wd) => (
            <div key={wd} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-slate-500">{weekdayLabel(wd)}</span>
              <span
                className={`flex h-8 w-full items-center justify-center rounded-lg text-xs font-semibold ${
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
    </div>
  )
}
