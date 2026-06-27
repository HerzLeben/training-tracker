import type { MenuItem } from '../types'
import { itemBorder } from '../lib/styles'

interface Props {
  item: MenuItem
  onToggle: (done: boolean) => void
  onWeightChange: (weightKg: number) => void
}

// Manual fine-tune step (kg). Auto progression uses a per-muscle increment.
const STEP = 2.5

export default function MenuItemRow({ item, onToggle, onWeightChange }: Props) {
  const w = item.weightKg
  const adjust = (delta: number) => onWeightChange(Math.max(0, (w ?? 0) + delta))

  return (
    <div className={`rounded-xl border p-3 transition ${itemBorder(item.done)}`}>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={item.done}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-6 w-6 shrink-0 accent-emerald-500"
        />
        <div className="min-w-0 flex-1">
          <div className={`truncate font-medium ${item.done ? 'text-emerald-300 line-through' : ''}`}>
            {item.name}
          </div>
          <div className="text-xs text-slate-400">
            {item.muscle} · {item.targetSets} sets × {item.targetReps} reps
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-800/60 px-2 py-1.5">
        <span className="text-xs text-slate-400">Weight</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => adjust(-STEP)}
            className="h-7 w-7 rounded-full bg-slate-700 text-lg leading-none text-slate-200 active:bg-slate-600"
            aria-label="decrease weight"
          >
            −
          </button>
          <span className="min-w-[4.5rem] text-center text-base font-semibold tabular-nums">
            {w === undefined ? '— ' : w} <span className="text-xs font-normal text-slate-400">kg</span>
          </span>
          <button
            onClick={() => adjust(STEP)}
            className="h-7 w-7 rounded-full bg-slate-700 text-lg leading-none text-slate-200 active:bg-slate-600"
            aria-label="increase weight"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
