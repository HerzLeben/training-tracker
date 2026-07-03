import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { toggleMenuItem, toggleCoreItem, setItemResult } from '../db/repo'
import { completion } from '../lib/adherence'
import { toPct } from '../lib/number'
import { weekdayLabel } from '../lib/date'
import { CARD, itemBorder } from '../lib/styles'
import MenuItemRow from './MenuItemRow'

interface Props {
  date: string
  onClose: () => void
}

// 過去の（または当日の）セッションを閲覧・編集するモーダル。
export default function DayDetail({ date, onClose }: Props) {
  const menu = useLiveQuery(() => db.menus.get(date), [date])
  const pct = completion(menu)
  const wd = weekdayLabel(new Date(date).getDay())

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
                    <label
                      key={it.exerciseId}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${itemBorder(it.done)}`}
                    >
                      <input
                        type="checkbox"
                        checked={it.done}
                        onChange={(e) => void toggleCoreItem(date, it.exerciseId, e.target.checked)}
                        className="h-6 w-6 shrink-0 accent-[#01A09B]"
                      />
                      <span className={`text-sm ${it.done ? 'text-[#017a75] line-through' : 'text-slate-800'}`}>
                        {it.name} <span className="text-xs text-slate-500">({it.targetSets}×{it.targetReps})</span>
                      </span>
                    </label>
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
