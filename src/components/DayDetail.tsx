import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import type { SessionType, Workout } from '../types'
import { db } from '../db/db'
import {
  toggleMenuItem,
  toggleCoreItem,
  setItemResult,
  addMenuItem,
  removeMenuItem,
  markDay,
  deleteSession,
  startSession,
} from '../db/repo'
import { useWorkouts } from '../db/hooks'
import { completion } from '../lib/adherence'
import { toPct } from '../lib/number'
import { weekdayLabel, weekdayOf } from '../lib/date'
import { BTN_PRIMARY, CARD } from '../lib/styles'
import MenuItemRow from './MenuItemRow'
import CoreItemRow from './CoreItemRow'
import AddExerciseForm from './AddExerciseForm'
import DayTypePicker from './DayTypePicker'

interface Props {
  date: string
  onClose: () => void
}

const TYPE_TEXT: Record<SessionType, { emoji: string; label: string }> = {
  gym: { emoji: '🏋️', label: 'Gym' },
  personal: { emoji: '🧑‍🏫', label: 'Personal training' },
  home: { emoji: '🏠', label: 'Home workout' },
  rest: { emoji: '🛌', label: 'Rest day' },
  skipped: { emoji: '❌', label: 'Skipped' },
}

// 過去の（または当日の）記録を閲覧・編集・種別変更・削除するモーダル。
export default function DayDetail({ date, onClose }: Props) {
  const menu = useLiveQuery(() => db.menus.get(date), [date])
  const workouts = useWorkouts()
  const [pickingWorkout, setPickingWorkout] = useState(false)
  const kind: SessionType | undefined = menu ? menu.type ?? 'gym' : undefined
  const pct = completion(menu)
  const wd = weekdayLabel(weekdayOf(date))
  const gymLogged = kind === 'gym' && !!menu?.items.some((i) => i.done || i.reps !== undefined)

  useEffect(() => {
    const main = document.querySelector('main')
    const prev = main?.style.overflow ?? ''
    if (main) main.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      if (main) main.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const remark = async (t: SessionType) => {
    if (t === 'gym') {
      // 過去日でも Gym を選べる。ワークアウトを選んで記録・編集する。
      if (gymLogged && !window.confirm('Switch workout? Logged records for this day will be reset.')) return
      setPickingWorkout(true)
      return
    }
    if (gymLogged && !window.confirm('Change type? Logged records for this day will be cleared.')) return
    await markDay(date, t)
  }
  const pickWorkout = async (w: Workout) => {
    await startSession(date, w)
    setPickingWorkout(false)
  }
  const remove = async () => {
    if (window.confirm('Delete this day’s record?')) {
      await deleteSession(date)
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      onClick={onClose}
    >
      <div
        className={`${CARD} max-h-[85vh] w-full max-w-md overflow-y-auto p-4`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="text-sm text-slate-500">
              {date} ({wd})
            </div>
            <h2 className="text-lg font-semibold text-slate-800">
              {kind ? `${TYPE_TEXT[kind].emoji} ${menu?.workoutName ?? TYPE_TEXT[kind].label}` : 'No record'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {kind === 'gym' && pct !== null && (
              <span className="text-lg font-bold text-[#01A09B]">{toPct(pct)}%</span>
            )}
            <button onClick={onClose} className="text-2xl leading-none text-slate-400" aria-label="close">
              ×
            </button>
          </div>
        </div>

        {pickingWorkout ? (
          /* Gym: 過去日用のワークアウト選択 */
          <div className="space-y-2">
            <div className="text-sm font-medium text-slate-700">Pick a workout for this day</div>
            {(workouts ?? []).map((w) => (
              <button
                key={w.id}
                onClick={() => void pickWorkout(w)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-left active:bg-slate-50"
              >
                <div className="font-medium text-slate-800">{w.name}</div>
                <div className="text-xs text-slate-500">{w.items.length} exercises</div>
              </button>
            ))}
            {workouts && workouts.length === 0 && (
              <p className="text-sm text-slate-500">No program. Add one in Settings.</p>
            )}
            <button
              onClick={() => setPickingWorkout(false)}
              className="w-full rounded-xl py-2 text-sm text-slate-500 active:bg-slate-50"
            >
              Back
            </button>
          </div>
        ) : (
          <>
            {/* 本体 */}
            {kind === 'gym' && menu && (
              <div className="space-y-2">
                {menu.items.map((it) => (
                  <MenuItemRow
                    key={it.exerciseId}
                    item={it}
                    onToggle={(done) => void toggleMenuItem(date, it.exerciseId, done)}
                    onResult={(patch) => void setItemResult(date, it.exerciseId, patch)}
                    onRemove={() => void removeMenuItem(date, it.exerciseId)}
                  />
                ))}
                <AddExerciseForm onAdd={(spec) => void addMenuItem(date, spec)} />
              </div>
            )}
            {(kind === 'personal' || kind === 'home') && (
              <p className="rounded-xl bg-[#e6f6f5] p-3 text-sm text-[#017a75]">
                {TYPE_TEXT[kind].label} — done ✅
              </p>
            )}
            {(kind === 'rest' || kind === 'skipped') && (
              <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{TYPE_TEXT[kind].label}</p>
            )}

            {/* コア（あれば編集可） */}
            {menu?.coreItems && menu.coreItems.length > 0 && (
              <div className="mt-3">
                <div className="mb-1 text-xs font-medium text-slate-500">Core</div>
                <div className="space-y-2">
                  {menu.coreItems.map((it) => (
                    <CoreItemRow
                      key={it.exerciseId}
                      item={it}
                      onToggle={(done) => void toggleCoreItem(date, it.exerciseId, done)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 確定して閉じる（実績は都度自動保存済み） */}
            <button onClick={onClose} className={`mt-3 w-full ${BTN_PRIMARY} py-2.5 text-sm font-semibold`}>
              Done ✓
            </button>

            {/* 種別変更・削除（Gym も選べる） */}
            <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
              <DayTypePicker title="Set day type" current={kind} onSelect={remark} />
              {menu && (
                <button
                  onClick={remove}
                  className="w-full rounded-xl border border-rose-200 py-2 text-sm text-rose-500 active:bg-rose-50"
                >
                  Delete this day
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
