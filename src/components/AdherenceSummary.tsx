import type { DailyMenu } from '../types'
import { currentStreak, overallRate, weekCalendar } from '../lib/adherence'
import { weekdayLabel } from '../lib/date'
import { toPct } from '../lib/number'
import { CARD, STATUS_BG } from '../lib/styles'

interface Props {
  menus: DailyMenu[]
  onSelectDate?: (date: string) => void
}

const cellMark: Record<string, string> = {
  done: '◎',
  partial: '△',
  rest: 'R',
  skipped: 'S',
  none: '·',
  future: '·',
}

export default function AdherenceSummary({ menus, onSelectDate }: Props) {
  const streak = currentStreak(menus)
  const rate30 = overallRate(menus, 30)
  const week = weekCalendar(menus, 7)
  const TYPE_SHORT: Record<string, string> = { personal: 'PT', home: 'Home', rest: 'Rest', skipped: 'Skip' }
  const labelByDate = new Map(
    menus.map((m) => [m.date, m.type && m.type !== 'gym' ? TYPE_SHORT[m.type] : m.workoutName]),
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className={`${CARD} p-4 text-center`}>
          <div className="text-3xl font-bold text-orange-500">🔥 {streak}</div>
          <div className="mt-1 text-xs text-slate-500">Day streak</div>
        </div>
        <div className={`${CARD} p-4 text-center`}>
          <div className="text-3xl font-bold text-[#01A09B]">
            {rate30 === null ? '—' : `${rate30}%`}
          </div>
          <div className="mt-1 text-xs text-slate-500">Avg completion (30d)</div>
        </div>
      </div>

      <div className={`${CARD} p-4`}>
        <div className="mb-2 text-sm font-medium text-slate-700">Last 7 days</div>
        <div className="flex justify-between gap-1">
          {week.map((c) => (
            <button
              key={c.date}
              onClick={() => onSelectDate?.(c.date)}
              aria-label={`${c.date}, ${c.status}${c.pct === null ? '' : ', ' + toPct(c.pct) + '%'}`}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div className="text-[10px] text-slate-400">{weekdayLabel(c.weekday)}</div>
              <div
                className={`flex h-9 w-full items-center justify-center rounded-lg text-sm font-semibold ${
                  STATUS_BG[c.status]
                }`}
                title={`${c.date} ${c.pct === null ? '' : toPct(c.pct) + '%'}`}
              >
                {cellMark[c.status]}
              </div>
              <div className="h-3 w-full truncate text-center text-[9px] leading-3 text-slate-500">
                {labelByDate.get(c.date) ?? ''}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
          <span>◎ Done</span>
          <span>△ Partial</span>
          <span>R Rest</span>
          <span>S Skipped</span>
          <span>· None</span>
          <span>・tap a day to view/edit</span>
        </div>
      </div>
    </div>
  )
}
