import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Workout } from '../types'
import { toggleMenuItem, toggleCoreItem, setItemResult, startSession, loadSampleProgram } from '../db/repo'
import { useMenu, useMenus, useWorkouts } from '../db/hooks'
import { BTN_PRIMARY } from '../lib/styles'
import { coreStreak } from '../lib/adherence'
import { workoutStats, daysAgoLabel } from '../lib/history'
import { formatSessionText } from '../lib/share'
import { shareText } from '../lib/shareTarget'
import { todayISO, weekdayLabel } from '../lib/date'
import { CARD } from '../lib/styles'
import TodayMenu from '../components/TodayMenu'
import CoreBlock from '../components/CoreBlock'

export default function TodayPage() {
  const today = todayISO()
  const workouts = useWorkouts()
  const menu = useMenu(today)
  const allMenus = useMenus()
  const [picking, setPicking] = useState(false)

  const wd = weekdayLabel(new Date(today).getDay())
  const showPicker = picking || (menu === undefined && workouts !== undefined)

  const pick = async (w: Workout) => {
    await startSession(today, w)
    setPicking(false)
  }

  const handleShare = () => {
    if (menu) void shareText(formatSessionText(menu))
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold text-slate-800">Today's Training</h1>
        <p className="text-sm text-slate-500">
          {today} ({wd})
        </p>
      </header>

      {workouts === undefined ? (
        <div className={`${CARD} p-6 text-center text-slate-400`}>Loading…</div>
      ) : workouts.length === 0 ? (
        <div className={`${CARD} space-y-3 p-6 text-center`}>
          <p className="text-slate-700">No program yet.</p>
          <p className="text-sm text-slate-500">
            Load your trainer's program, or edit it anytime in{' '}
            <Link to="/settings" className="font-medium text-[#01A09B] underline">
              Settings
            </Link>
            .
          </p>
          <button onClick={() => void loadSampleProgram()} className={`${BTN_PRIMARY} w-full py-2 text-sm font-medium`}>
            Load my program
          </button>
        </div>
      ) : showPicker ? (
        <div className={`${CARD} space-y-2 p-4`}>
          <div className="text-sm font-medium text-slate-700">
            {menu ? "Switch workout (resets today's records)" : "Pick today's workout"}
          </div>
          {workouts.map((w) => {
            const st = workoutStats(allMenus ?? [], w.id, today)
            return (
              <button
                key={w.id}
                onClick={() => pick(w)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left active:bg-slate-50"
              >
                <div className="font-medium text-slate-800">{w.name}</div>
                <div className="text-xs text-slate-500">
                  {w.items.length} exercises · done {st.count}×
                  {st.lastDate ? ` · last ${daysAgoLabel(st.daysSince ?? 0)}` : ''}
                </div>
              </button>
            )
          })}
          <button
            onClick={() => void loadSampleProgram()}
            className="w-full rounded-xl border border-dashed border-slate-300 py-2 text-xs text-slate-500 active:bg-slate-100"
          >
            Load trainer program (6-day)
          </button>
          {menu && (
            <button
              onClick={() => setPicking(false)}
              className="w-full rounded-xl py-2 text-sm text-slate-500 active:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      ) : menu ? (
        <>
          <TodayMenu
            menu={menu}
            stats={menu.workoutId ? workoutStats(allMenus ?? [], menu.workoutId, today) : undefined}
            onToggle={(id, done) => void toggleMenuItem(today, id, done)}
            onResult={(id, patch) => void setItemResult(today, id, patch)}
            onShare={handleShare}
            onChangeWorkout={() => setPicking(true)}
          />
          <CoreBlock
            items={menu.coreItems ?? []}
            streak={coreStreak(allMenus ?? [])}
            onToggle={(id, done) => void toggleCoreItem(today, id, done)}
          />
        </>
      ) : null}
    </div>
  )
}
