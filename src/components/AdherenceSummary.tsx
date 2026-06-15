import type { DailyMenu, Settings } from '../types'
import { currentStreak, overallRate, weekCalendar } from '../lib/adherence'
import { weekdayLabel } from '../lib/date'

interface Props {
  menus: DailyMenu[]
  settings: Settings
}

const cellStyle: Record<string, string> = {
  done: 'bg-emerald-500 text-slate-950',
  partial: 'bg-amber-500 text-slate-950',
  missed: 'bg-rose-600/80 text-white',
  rest: 'bg-slate-700 text-slate-300',
  future: 'bg-slate-800 text-slate-600',
}

const cellMark: Record<string, string> = {
  done: '◎',
  partial: '△',
  missed: '×',
  rest: '休',
  future: '・',
}

export default function AdherenceSummary({ menus, settings }: Props) {
  const streak = currentStreak(menus, settings)
  const rate30 = overallRate(menus, 30)
  const week = weekCalendar(menus, settings, 7)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
          <div className="text-3xl font-bold text-orange-400">🔥 {streak}</div>
          <div className="mt-1 text-xs text-slate-400">連続達成（日）</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-center">
          <div className="text-3xl font-bold text-sky-400">
            {rate30 === null ? '—' : `${rate30}%`}
          </div>
          <div className="mt-1 text-xs text-slate-400">直近30日の達成率</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-2 text-sm font-medium text-slate-300">直近7日</div>
        <div className="flex justify-between gap-1">
          {week.map((c) => (
            <div key={c.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="text-[10px] text-slate-500">{weekdayLabel(c.weekday)}</div>
              <div
                className={`flex h-9 w-full items-center justify-center rounded-lg text-sm font-semibold ${
                  cellStyle[c.status]
                }`}
                title={`${c.date} ${c.pct === null ? '' : Math.round(c.pct * 100) + '%'}`}
              >
                {cellMark[c.status]}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
          <span>◎ 達成</span>
          <span>△ 一部</span>
          <span>× 未達</span>
          <span>休 休養</span>
        </div>
      </div>
    </div>
  )
}
