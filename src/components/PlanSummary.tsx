import type { BodyMetric, Settings } from '../types'
import { buildPlan, type PlanLine } from '../lib/plan'
import { round1 as r1 } from '../lib/number'
import { CARD } from '../lib/styles'

interface Props {
  settings: Settings
  metrics: BodyMetric[]
}

function Row({ line }: { line: PlanLine }) {
  const arrow = line.direction === 'down' ? '↓' : '↑'
  return (
    <div className="rounded-xl bg-slate-800/50 p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-200">{line.label}</span>
        <span className="text-sm text-slate-300">
          {line.current === undefined ? '—' : r1(line.current)}
          <span className="mx-1 text-slate-500">{arrow}</span>
          <span className="text-sky-300">
            {r1(line.target)} {line.unit}
          </span>
        </span>
      </div>
      {line.current === undefined ? (
        <p className="mt-1 text-xs text-slate-500">Log your current value on the Body tab to track pace.</p>
      ) : line.remaining === 0 ? (
        <p className="mt-1 text-xs text-emerald-400">🎉 Target reached.</p>
      ) : (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs">
          <span className="text-slate-400">
            {r1(line.remaining ?? 0)} {line.unit} to go
          </span>
          {line.requiredPerWeek !== undefined && (
            <span className="text-slate-400">
              need {r1(line.requiredPerWeek)} {line.unit}/wk
            </span>
          )}
          {line.actualPerWeek !== undefined && (
            <span className="text-slate-500">
              now {r1(line.actualPerWeek)} {line.unit}/wk
            </span>
          )}
          {line.onTrack !== undefined && (
            <span className={line.onTrack ? 'text-emerald-400' : 'text-amber-400'}>
              {line.onTrack ? '● on track' : '● behind pace'}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default function PlanSummary({ settings, metrics }: Props) {
  const plan = buildPlan(settings, metrics)

  if (!plan.hasTargets) {
    return (
      <div className={`${CARD} p-4 text-sm text-slate-400`}>
        Set target body fat / muscle and a date in <span className="text-slate-200">Settings</span> to
        see your plan here.
      </div>
    )
  }

  return (
    <div className={`space-y-2 ${CARD} p-4`}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-300">Plan</div>
        {plan.targetDate ? (
          <div className="text-xs text-slate-400">
            by {plan.targetDate}
            {plan.weeksLeft !== null && (
              <span className="ml-1 text-slate-500">({Math.ceil(plan.weeksLeft)} wk left)</span>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500">no target date set</div>
        )}
      </div>
      {plan.fat && <Row line={plan.fat} />}
      {plan.muscle && <Row line={plan.muscle} />}
    </div>
  )
}
