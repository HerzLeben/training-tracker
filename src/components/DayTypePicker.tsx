import type { SessionType } from '../types'

export const DAY_TYPES: { type: SessionType; label: string; emoji: string }[] = [
  { type: 'gym', label: 'Gym (menu)', emoji: '🏋️' },
  { type: 'personal', label: 'Personal', emoji: '🧑‍🏫' },
  { type: 'home', label: 'Home', emoji: '🏠' },
  { type: 'rest', label: 'Rest', emoji: '🛌' },
  { type: 'skipped', label: 'Skipped', emoji: '❌' },
]

interface Props {
  title: string
  current?: SessionType
  onSelect: (t: SessionType) => void
  onClear?: () => void
  hideGym?: boolean
}

export default function DayTypePicker({ title, current, onSelect, onClear, hideGym }: Props) {
  const types = hideGym ? DAY_TYPES.filter((d) => d.type !== 'gym') : DAY_TYPES
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-700">{title}</div>
      <div className="grid grid-cols-2 gap-2">
        {types.map((d) => (
          <button
            key={d.type}
            onClick={() => onSelect(d.type)}
            className={`rounded-xl border px-3 py-3 text-left text-sm active:bg-slate-50 ${
              current === d.type ? 'border-[#01A09B] bg-[#e6f6f5] text-slate-800' : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <span className="mr-1" aria-hidden="true">
              {d.emoji}
            </span>
            {d.label}
          </button>
        ))}
      </div>
      {onClear && (
        <button
          onClick={onClear}
          className="w-full rounded-xl border border-slate-200 py-2 text-sm text-rose-500 active:bg-rose-50"
        >
          Clear this day
        </button>
      )}
    </div>
  )
}
