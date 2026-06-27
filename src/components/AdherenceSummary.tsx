import type { DailyMenu } from '../types'
import { currentStreak, overallRate, weekCalendar } from '../lib/adherence'
import { weekdayLabel } from '../lib/date'
import { toPct } from '../lib/number'
import { CARD } from '../lib/styles'

interface Props {
  menus: DailyMenu[]
}

const cellStyle: Record<string, string> = {
  done: 'bg-emerald-500 text-slate-950',
  partial: 'bg-amber-500 text-slate-950',
  none: 'bg-slate-800 text-slate-600',
  future: 'bg-slate-900 text-slate-700',
}

const cellMark: Record<string, string> = {
  done: '◎',
  partial: '△',
  none: '·',
  future: '·',
}

export default function AdherenceSummary({ menus }: Props) {
  const streak = currentStreak(menus)
  const rate30 = overallRate(menus, 30)
  const week = weekCalendar(menus, 7)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className={`${CARD} p-4 text-center`}>
          <div className="text-3xl font-bold text-orange-400">🔥 {streak}</div>
          <div className="mt-1 text-xs text-slate-400">Day streak</div>
        </div>
        <div className={`${CARD} p-4 text-center`}>
          <div className="text-3xl font-bold text-sky-400">
            {rate30 === null ? '—' : `${rate30}%`}
          </div>
          <div className="mt-1 text-xs text-slate-400">30-day completion</div>
        </div>
      </div>

      <div className={`${CARD} p-4`}>
        <div className="mb-2 text-sm font-medium text-slate-300">Last 7 days</div>
        <div className="flex justify-between gap-1">
          {week.map((c) => (
            <div key={c.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="text-[10px] text-slate-500">{weekdayLabel(c.weekday)}</div>
              <div
                className={`flex h-9 w-full items-center justify-center rounded-lg text-sm font-semibold ${
                  cellStyle[c.status]
                }`}
                title={`${c.date} ${c.pct === null ? '' : toPct(c.pct) + '%'}`}
              >
                {cellMark[c.status]}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
          <span>◎ Done</span>
          <span>△ Partial</span>
          <span>· No session</span>
        </div>
      </div>
    </div>
  )
}
