import type { MenuItem } from '../types'
import { CARD } from '../lib/styles'
import CoreItemRow from './CoreItemRow'

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
          <h3 className="font-semibold text-slate-800">Core</h3>
          <p className="text-xs text-slate-500">Daily — Plank every day</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-orange-500">🔥 {streak}</div>
          <div className="text-[11px] text-slate-400">
            {doneCount}/{items.length} done
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((it) => (
          <CoreItemRow key={it.exerciseId} item={it} onToggle={(done) => onToggle(it.exerciseId, done)} />
        ))}
      </div>
    </div>
  )
}
