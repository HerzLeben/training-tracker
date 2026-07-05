import { useEffect, useState } from 'react'
import type { MenuItem } from '../types'
import { itemBorder } from '../lib/styles'
import { round1 } from '../lib/number'

interface Props {
  item: MenuItem
  onToggle: (done: boolean) => void
  onResult: (patch: { weightKg?: number; reps?: number }) => void
  onRemove?: () => void
}

// 重量の増減ステップ(kg)。
const STEP = 0.5

function targetText(item: MenuItem): string {
  const reps = item.targetReps?.trim()
  const base = reps ? `${item.targetSets}×${reps}` : `${item.targetSets} sets`
  return item.targetWeightKg !== undefined ? `${base} @${item.targetWeightKg}kg` : base
}

const roundBtn =
  'h-8 w-8 shrink-0 rounded-full bg-slate-200 text-lg leading-none text-slate-700 active:bg-slate-300'
const numField = 'w-14 rounded-lg border border-slate-300 bg-white py-1 text-center text-base tabular-nums text-slate-800'

export default function MenuItemRow({ item, onToggle, onResult, onRemove }: Props) {
  // 入力中は文字列で保持し、blur で確定（"12.5" などの小数入力を邪魔しない）。
  const [wStr, setWStr] = useState(item.weightKg?.toString() ?? '')
  const [rStr, setRStr] = useState(item.reps?.toString() ?? '')
  useEffect(() => setWStr(item.weightKg?.toString() ?? ''), [item.weightKg])
  useEffect(() => setRStr(item.reps?.toString() ?? ''), [item.reps])

  // +/- は「入力中の値」を基準にする（未確定の入力を捨てない）。
  const adjust = (delta: number) => {
    const base = wStr === '' ? (item.weightKg ?? 0) : Number(wStr)
    const from = Number.isNaN(base) ? (item.weightKg ?? 0) : base
    onResult({ weightKg: Math.max(0, round1(from + delta)) })
  }
  const commitW = () => {
    const n = Number(wStr)
    onResult({ weightKg: wStr === '' ? 0 : Number.isNaN(n) ? (item.weightKg ?? 0) : n })
  }
  const commitR = () => {
    const n = Number(rStr)
    onResult({ reps: rStr === '' ? 0 : Number.isNaN(n) ? (item.reps ?? 0) : n })
  }

  return (
    <div className={`rounded-xl border p-3 transition ${itemBorder(item.done)}`}>
      <div className="flex items-center gap-3">
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
            {item.added && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-normal text-amber-700">
                added
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500">
            Target: {targetText(item)}
            {item.muscle ? ` · ${item.muscle}` : ''}
          </div>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="shrink-0 px-1 text-lg leading-none text-slate-400 active:text-rose-500"
            aria-label={`remove ${item.name}`}
          >
            ×
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button onClick={() => adjust(-STEP)} className={roundBtn} aria-label="decrease weight">
            −
          </button>
          <input
            type="text"
            inputMode="decimal"
            value={wStr}
            onChange={(e) => setWStr(e.target.value)}
            onBlur={commitW}
            placeholder="—"
            className={numField}
            aria-label="weight kg"
          />
          <span className="text-xs text-slate-500">kg</span>
          <button onClick={() => adjust(STEP)} className={roundBtn} aria-label="increase weight">
            +
          </button>
        </div>
        <div className="flex items-center gap-1">
          <input
            type="text"
            inputMode="numeric"
            value={rStr}
            onChange={(e) => setRStr(e.target.value)}
            onBlur={commitR}
            placeholder="—"
            className={numField}
            aria-label="reps done"
          />
          <span className="text-xs text-slate-500">reps</span>
        </div>
      </div>
    </div>
  )
}
