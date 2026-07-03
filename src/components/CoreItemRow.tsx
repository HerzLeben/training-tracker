import type { MenuItem } from '../types'
import { itemBorder } from '../lib/styles'

interface Props {
  item: MenuItem
  onToggle: (done: boolean) => void
}

// 体幹（コア）種目のチェック行。CoreBlock と DayDetail で共用。
export default function CoreItemRow({ item, onToggle }: Props) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 ${itemBorder(item.done)}`}
    >
      <input
        type="checkbox"
        checked={item.done}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={`${item.name} done`}
        className="h-6 w-6 shrink-0 accent-[#01A09B]"
      />
      <div className="min-w-0 flex-1">
        <div className={`truncate font-medium ${item.done ? 'text-[#017a75] line-through' : 'text-slate-800'}`}>
          {item.name}
          {item.daily && (
            <span className="ml-2 rounded bg-[#e6f6f5] px-1.5 py-0.5 text-[10px] text-[#01A09B]">daily</span>
          )}
        </div>
        <div className="text-xs text-slate-500">
          {item.targetSets} × {item.targetReps}
          {item.muscle ? ` · ${item.muscle}` : ''}
        </div>
      </div>
    </label>
  )
}
