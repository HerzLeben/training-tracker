import type { MenuItem } from '../types'
import { CARD, itemBorder } from '../lib/styles'

interface Props {
  items: MenuItem[]
  streak: number
  onToggle: (exerciseId: string, done: boolean) => void
}

export default function CoreBlock({ items, streak, onToggle }: Props) {
  if (items.length === 0) return null
  const doneCount = items.filter((i) => i.done).length

  return (
    <div className={`space-y-2 ${CARD} p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Core</h3>
          <p className="text-xs text-slate-400">Daily — Plank every day</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-orange-400">🔥 {streak}</div>
          <div className="text-[11px] text-slate-500">
            {doneCount}/{items.length} done
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((it) => (
          <label
            key={it.exerciseId}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${itemBorder(it.done)}`}
          >
            <input
              type="checkbox"
              checked={it.done}
              onChange={(e) => onToggle(it.exerciseId, e.target.checked)}
              className="h-6 w-6 shrink-0 accent-emerald-500"
            />
            <div className="min-w-0 flex-1">
              <div className={`truncate font-medium ${it.done ? 'text-emerald-300 line-through' : ''}`}>
                {it.name}
                {it.daily && (
                  <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-sky-300">
                    daily
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400">
                {it.targetSets} × {it.targetReps}
                {it.muscle ? ` · ${it.muscle}` : ''}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}
