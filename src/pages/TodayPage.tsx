import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { SessionType, Workout } from '../types'
import {
  toggleMenuItem,
  toggleCoreItem,
  setItemResult,
  addMenuItem,
  removeMenuItem,
  startSession,
  loadSampleProgram,
  markDay,
  deleteSession,
} from '../db/repo'
import { useMenu, useMenus, useWorkouts } from '../db/hooks'
import { BTN_PRIMARY, BTN_SECONDARY, CARD } from '../lib/styles'
import { completion, coreStreak } from '../lib/adherence'
import { toPct } from '../lib/number'
import { workoutStats, daysAgoLabel } from '../lib/history'
import { formatSessionText } from '../lib/share'
import { shareText } from '../lib/shareTarget'
import { todayISO, weekdayLabel, weekdayOf } from '../lib/date'
import TodayMenu from '../components/TodayMenu'
import CoreBlock from '../components/CoreBlock'
import DayTypePicker from '../components/DayTypePicker'

const SUMMARY: Record<Exclude<SessionType, 'gym'>, { emoji: string; label: string; note: string }> = {
  personal: { emoji: '🧑‍🏫', label: 'Personal training', note: 'Marked done' },
  home: { emoji: '🏠', label: 'Home workout', note: 'Marked done' },
  rest: { emoji: '🛌', label: 'Rest day', note: 'Recover well' },
  skipped: { emoji: '❌', label: 'Skipped', note: 'Back at it next time' },
}

export default function TodayPage() {
  const today = todayISO()
  const workouts = useWorkouts()
  const menu = useMenu(today)
  const allMenus = useMenus()
  const [pickingType, setPickingType] = useState(false)
  const [pickingWorkout, setPickingWorkout] = useState(false)
  const [finished, setFinished] = useState(false)

  const wd = weekdayLabel(weekdayOf(today))
  const kind: SessionType | undefined = menu ? menu.type ?? 'gym' : undefined
  const gymLogged =
    !!menu && kind === 'gym' && menu.items.some((i) => i.done || i.reps !== undefined)

  const chooseType = async (t: SessionType) => {
    setFinished(false)
    if (t === 'gym') {
      setPickingType(false)
      setPickingWorkout(true)
      return
    }
    if (gymLogged && !window.confirm("Change day type? Today's logged records will be cleared.")) return
    await markDay(today, t)
    setPickingType(false)
  }

  const pickWorkout = async (w: Workout) => {
    if (gymLogged && !window.confirm("Switch workout? Today's logged records will be reset.")) return
    await startSession(today, w)
    setFinished(false)
    setPickingWorkout(false)
    setPickingType(false)
  }

  const clearDay = async () => {
    if (!window.confirm("Clear today's record?")) return
    await deleteSession(today)
    setPickingType(false)
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
      ) : pickingWorkout ? (
        <div className={`${CARD} space-y-2 p-4`}>
          <div className="text-sm font-medium text-slate-700">Pick today's workout</div>
          {workouts.map((w) => {
            const st = workoutStats(allMenus ?? [], w.id, today)
            return (
              <button
                key={w.id}
                onClick={() => pickWorkout(w)}
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
          <button
            onClick={() => setPickingWorkout(false)}
            className="w-full rounded-xl py-2 text-sm text-slate-500 active:bg-slate-50"
          >
            Back
          </button>
        </div>
      ) : pickingType || !menu ? (
        <div className={`${CARD} space-y-2 p-4`}>
          <DayTypePicker
            title={menu ? 'Change day type' : 'What did you do today?'}
            current={kind}
            onSelect={chooseType}
            onClear={menu ? clearDay : undefined}
          />
          {menu && (
            <button
              onClick={() => setPickingType(false)}
              className="w-full rounded-xl py-2 text-sm text-slate-500 active:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      ) : kind === 'gym' && finished ? (
        <div className={`${CARD} space-y-3 p-6 text-center`}>
          <div className="text-4xl" aria-hidden="true">
            ✅
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">{menu.workoutName ?? 'Session'} recorded</h2>
            <p className="text-sm text-slate-500">
              {today} · {menu.items.filter((i) => i.done).length}/{menu.items.length} done
              {completion(menu) !== null ? ` · ${toPct(completion(menu)!)}%` : ''}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setFinished(false)} className={`${BTN_SECONDARY} py-2 text-sm`}>
              Edit
            </button>
            <button onClick={handleShare} className={`${BTN_PRIMARY} py-2 text-sm font-medium`}>
              Share to LINE
            </button>
          </div>
        </div>
      ) : kind === 'gym' ? (
        <>
          <TodayMenu
            menu={menu}
            stats={menu.workoutId ? workoutStats(allMenus ?? [], menu.workoutId, today) : undefined}
            onToggle={(id, done) => void toggleMenuItem(today, id, done)}
            onResult={(id, patch) => void setItemResult(today, id, patch)}
            onAdd={(spec) => void addMenuItem(today, spec)}
            onRemove={(id) => void removeMenuItem(today, id)}
            onShare={handleShare}
            onChangeWorkout={() => setPickingType(true)}
            onFinish={() => setFinished(true)}
          />
          <CoreBlock
            items={menu.coreItems ?? []}
            streak={coreStreak(allMenus ?? [])}
            onToggle={(id, done) => void toggleCoreItem(today, id, done)}
          />
        </>
      ) : kind ? (
        <>
          <div className={`${CARD} p-6 text-center`}>
            <div className="mb-2 text-4xl" aria-hidden="true">
              {SUMMARY[kind].emoji}
            </div>
            <h2 className="text-lg font-semibold text-slate-800">{SUMMARY[kind].label}</h2>
            <p className="text-sm text-slate-500">{SUMMARY[kind].note}</p>
          </div>
          {(kind === 'personal' || kind === 'home') && (
            <CoreBlock
              items={menu.coreItems ?? []}
              streak={coreStreak(allMenus ?? [])}
              onToggle={(id, done) => void toggleCoreItem(today, id, done)}
            />
          )}
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPickingType(true)} className={`${BTN_SECONDARY} py-2 text-sm`}>
              Change
            </button>
            <button onClick={handleShare} className={`${BTN_PRIMARY} py-2 text-sm font-medium`}>
              Share to LINE
            </button>
          </div>
        </>
      ) : null}
    </div>
  )
}
