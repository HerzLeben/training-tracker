import { useState } from 'react'
import type { DailyMenu, Settings } from '../types'
import { monthView } from '../lib/adherence'
import { todayISO } from '../lib/date'

interface Props {
  menus: DailyMenu[]
  settings: Settings
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const dayStyle: Record<string, string> = {
  done: 'bg-emerald-500 text-slate-950',
  partial: 'bg-amber-500 text-slate-950',
  missed: 'bg-rose-600/80 text-white',
  rest: 'bg-slate-800 text-slate-500',
  future: 'bg-slate-900 text-slate-600',
}

export default function MonthCalendar({ menus, settings }: Props) {
  const now = todayISO()
  const [y, m] = now.split('-').map(Number)
  // Anchor view to the current month; allow navigating back/forward.
  const [view, setView] = useState({ year: y, month: m - 1 })

  const data = monthView(menus, settings, view.year, view.month, now)
  const shift = (delta: number) => {
    const total = view.year * 12 + view.month + delta
    setView({ year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 })
  }
  const isCurrentMonth = view.year === y && view.month === m - 1

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => shift(-1)} className="rounded-lg px-2 py-1 text-slate-400 active:bg-slate-800">
          ‹
        </button>
        <div className="text-center">
          <div className="text-sm font-medium text-slate-200">
            {MONTHS[view.month]} {view.year}
          </div>
          <div className="text-[11px] text-slate-500">
            {data.doneCount}/{data.trainingCount} sessions done
          </div>
        </div>
        <button
          onClick={() => shift(1)}
          disabled={isCurrentMonth}
          className="rounded-lg px-2 py-1 text-slate-400 active:bg-slate-800 disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WD.map((w) => (
          <div key={w} className="text-center text-[10px] text-slate-500">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {data.cells.map((c, i) =>
          c === null ? (
            <div key={i} />
          ) : (
            <div
              key={c.date}
              title={`${c.date}${c.pct === null ? '' : ' · ' + Math.round(c.pct * 100) + '%'}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs ${
                dayStyle[c.status]
              } ${c.date === now ? 'ring-2 ring-sky-400' : ''}`}
            >
              {c.day}
            </div>
          ),
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
        <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-emerald-500" />Done</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-amber-500" />Partial</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-rose-600/80" />Missed</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-slate-800" />Rest</span>
      </div>
    </div>
  )
}
