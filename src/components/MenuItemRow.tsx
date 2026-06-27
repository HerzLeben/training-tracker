import type { MenuItem } from '../types'
import { itemBorder } from '../lib/styles'

interface Props {
  item: MenuItem
  onToggle: (done: boolean) => void
  onResult: (patch: { weightKg?: number; reps?: number }) => void
}

// Manual weight step (kg).
const STEP = 2.5

function targetText(item: MenuItem): string {
  const base = `${item.targetSets}×${item.targetReps}`
  return item.targetWeightKg !== undefined ? `${base} @${item.targetWeightKg}kg` : base
}

export default function MenuItemRow({ item, onToggle, onResult }: Props) {
  const w = item.weightKg
  const adjust = (delta: number) => onResult({ weightKg: Math.max(0, (w ?? 0) + delta) })

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
            Target: {targetText(item)}
            {item.muscle ? ` · ${item.muscle}` : ''}
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex flex-1 items-center justify-between rounded-lg bg-slate-800/60 px-2 py-1.5">
          <span className="text-xs text-slate-400">Weight</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjust(-STEP)}
              className="h-7 w-7 rounded-full bg-slate-700 text-lg leading-none text-slate-200 active:bg-slate-600"
              aria-label="decrease weight"
            >
              −
            </button>
            <span className="min-w-[3.5rem] text-center text-base font-semibold tabular-nums">
              {w === undefined ? '—' : w}
              <span className="ml-0.5 text-xs font-normal text-slate-400">kg</span>
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
        <div className="flex items-center gap-1 rounded-lg bg-slate-800/60 px-2 py-1.5">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={item.reps ?? ''}
            onChange={(e) => onResult({ reps: e.target.value === '' ? 0 : Number(e.target.value) })}
            placeholder="—"
            className="w-12 bg-transparent text-center text-base font-semibold tabular-nums outline-none"
            aria-label="reps done"
          />
          <span className="text-xs text-slate-400">reps</span>
        </div>
      </div>
    </div>
  )
}
