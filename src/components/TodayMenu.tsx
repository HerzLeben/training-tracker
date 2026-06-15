import type { DailyMenu } from '../types'
import { completion } from '../lib/adherence'
import { SLOT_LABEL } from '../lib/labels'
import { emphasisLabel } from '../engine/menuEngine'
import MenuItemRow from './MenuItemRow'

interface Props {
  menu: DailyMenu
  onToggle: (exerciseId: string, done: boolean) => void
  onWeightChange: (exerciseId: string, weightKg: number) => void
  onRegenerate: () => void
}

export default function TodayMenu({ menu, onToggle, onWeightChange, onRegenerate }: Props) {
  const pct = completion(menu)
  const doneCount = menu.items.filter((i) => i.done).length

  if (menu.slot === 'rest') {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
        <div className="mb-2 text-4xl">😴</div>
        <h2 className="mb-1 text-lg font-semibold">Rest Day</h2>
        <p className="text-sm text-slate-400">{menu.note}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-slate-400">Today's menu</div>
          <h2 className="text-lg font-semibold">{SLOT_LABEL[menu.slot]}</h2>
          <div className="mt-0.5 text-xs text-slate-400">
            {menu.emphasis && (
              <span className="mr-2 rounded bg-slate-800 px-1.5 py-0.5 text-sky-300">
                {emphasisLabel(menu.emphasis)}
              </span>
            )}
            {menu.estMinutes ? <span>~{menu.estMinutes} min lifting</span> : null}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-sky-400">
            {pct === null ? '—' : `${Math.round(pct * 100)}%`}
          </div>
          <div className="text-xs text-slate-400">
            {doneCount}/{menu.items.length} exercises
          </div>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${Math.round((pct ?? 0) * 100)}%` }}
        />
      </div>

      <div className="space-y-2">
        {menu.items.map((it) => (
          <MenuItemRow
            key={it.exerciseId}
            item={it}
            onToggle={(done) => onToggle(it.exerciseId, done)}
            onWeightChange={(w) => onWeightChange(it.exerciseId, w)}
          />
        ))}
      </div>

      <button
        onClick={onRegenerate}
        className="w-full rounded-xl border border-slate-800 py-2 text-sm text-slate-400 active:bg-slate-800"
      >
        Regenerate menu (resets checks)
      </button>
    </div>
  )
}
