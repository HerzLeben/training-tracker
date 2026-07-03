import { useState } from 'react'
import type { DailyMenu } from '../types'
import { monthView } from '../lib/adherence'
import { todayISO, weekdayLabel } from '../lib/date'
import { toPct } from '../lib/number'
import { CARD, STATUS_BG } from '../lib/styles'

interface Props {
  menus: DailyMenu[]
  onSelectDate?: (date: string) => void
}

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export default function MonthCalendar({ menus, onSelectDate }: Props) {
  const now = todayISO()
  const [y, m] = now.split('-').map(Number)
  // Anchor view to the current month; allow navigating back/forward.
  const [view, setView] = useState({ year: y, month: m - 1 })

  const data = monthView(menus, view.year, view.month, now)
  const shift = (delta: number) => {
    const total = view.year * 12 + view.month + delta
    setView({ year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 })
  }
  const isCurrentMonth = view.year === y && view.month === m - 1

  return (
    <div className={`${CARD} p-4`}>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => shift(-1)} className="rounded-lg px-2 py-1 text-slate-400 active:bg-slate-100">
          ‹
        </button>
        <div className="text-center">
          <div className="text-sm font-medium text-slate-700">
            {MONTHS[view.month]} {view.year}
          </div>
          <div className="text-[11px] text-slate-400">
            {data.doneCount}/{data.sessionCount} sessions done
          </div>
        </div>
        <button
          onClick={() => shift(1)}
          disabled={isCurrentMonth}
          className="rounded-lg px-2 py-1 text-slate-400 active:bg-slate-100 disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-[10px] text-slate-400">
            {weekdayLabel(wd)}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {data.cells.map((c, i) =>
          c === null ? (
            <div key={i} />
          ) : (
            <button
              key={c.date}
              onClick={() => onSelectDate?.(c.date)}
              title={`${c.date}${c.pct === null ? '' : ' · ' + toPct(c.pct) + '%'}`}
              aria-label={`${c.date}, ${c.status}${c.pct === null ? '' : ', ' + toPct(c.pct) + '%'}`}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs ${
                STATUS_BG[c.status]
              } ${c.date === now ? 'ring-2 ring-[#01A09B]' : ''}`}
            >
              {c.day}
            </button>
          ),
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-400">
        <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-[#01A09B]" />Done</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-amber-400" />Partial</span>
        <span><span className="mr-1 inline-block h-2 w-2 rounded-sm bg-slate-200" />No session</span>
      </div>
    </div>
  )
}
