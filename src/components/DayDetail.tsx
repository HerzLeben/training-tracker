import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { toggleMenuItem, toggleCoreItem, setItemResult } from '../db/repo'
import { completion } from '../lib/adherence'
import { toPct } from '../lib/number'
import { weekdayLabel, weekdayOf } from '../lib/date'
import { CARD } from '../lib/styles'
import MenuItemRow from './MenuItemRow'
import CoreItemRow from './CoreItemRow'

interface Props {
  date: string
  onClose: () => void
}

// 過去の（または当日の）セッションを閲覧・編集するモーダル。
export default function DayDetail({ date, onClose }: Props) {
  const menu = useLiveQuery(() => db.menus.get(date), [date])
  const pct = completion(menu)
  const wd = weekdayLabel(weekdayOf(date))

  // 背景（main スクロール）を固定し、Esc で閉じる。
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
              {menu?.workoutName ?? 'No session'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {pct !== null && <span className="text-lg font-bold text-[#01A09B]">{toPct(pct)}%</span>}
            <button onClick={onClose} className="text-2xl leading-none text-slate-400" aria-label="close">
              ×
            </button>
          </div>
        </div>

        {!menu || menu.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">No session recorded on this day.</p>
        ) : (
          <div className="space-y-2">
            {menu.items.map((it) => (
              <MenuItemRow
                key={it.exerciseId}
                item={it}
                onToggle={(done) => void toggleMenuItem(date, it.exerciseId, done)}
                onResult={(patch) => void setItemResult(date, it.exerciseId, patch)}
              />
            ))}

            {menu.coreItems && menu.coreItems.length > 0 && (
              <div className="pt-1">
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
          </div>
        )}
      </div>
    </div>
  )
}
