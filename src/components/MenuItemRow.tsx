import type { MenuItem } from '../types'

interface Props {
  item: MenuItem
  onToggle: (done: boolean) => void
}

export default function MenuItemRow({ item, onToggle }: Props) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
        item.done
          ? 'border-emerald-700/60 bg-emerald-900/20'
          : 'border-slate-800 bg-slate-900'
      }`}
    >
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
    </label>
  )
}
