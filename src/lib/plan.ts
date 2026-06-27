import type { BodyMetric, Settings } from '../types'
import { diffDays, todayISO } from './date'
import { latestBody } from './metrics'

// 期限つき目標から「大きなプラン」を要約する。
// 現在値（最新記録）→ 目標（期限）に必要な週あたりペースと、直近の実ペースを比較。

export interface PlanLine {
  label: string
  unit: string
  direction: 'down' | 'up' // fat: down, muscle: up
  current?: number
  target: number
  /** 目標までの残り量（好ましい方向を正で表す）。達成済みは 0。 */
  remaining?: number
  /** 期限内に必要な週あたりペース。 */
  requiredPerWeek?: number
  /** 直近記録から算出した実際の週あたりペース。 */
  actualPerWeek?: number
  onTrack?: boolean
}

export interface Plan {
  hasTargets: boolean
  targetDate?: string
  weeksLeft: number | null
  fat?: PlanLine
  muscle?: PlanLine
}

function paceFromHistory(
  metrics: BodyMetric[],
  pick: (m: BodyMetric) => number | undefined,
  direction: 'down' | 'up',
): number | undefined {
  const pts = metrics
    .filter((m) => pick(m) !== undefined)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (pts.length < 2) return undefined
  const first = pts[0]
  const last = pts[pts.length - 1]
  const spanWeeks = diffDays(first.date, last.date) / 7
  if (spanWeeks <= 0) return undefined
  const change = direction === 'down' ? pick(first)! - pick(last)! : pick(last)! - pick(first)!
  return change / spanWeeks
}

function line(
  label: string,
  unit: string,
  direction: 'down' | 'up',
  current: number | undefined,
  target: number,
  weeksLeft: number | null,
  metrics: BodyMetric[],
  pick: (m: BodyMetric) => number | undefined,
): PlanLine {
  const l: PlanLine = { label, unit, direction, current, target }
  if (current === undefined) return l

  const rawRemaining = direction === 'down' ? current - target : target - current
  l.remaining = Math.max(0, rawRemaining)

  if (l.remaining > 0 && weeksLeft !== null && weeksLeft > 0) {
    l.requiredPerWeek = l.remaining / weeksLeft
  }
  l.actualPerWeek = paceFromHistory(metrics, pick, direction)
  if (l.remaining === 0) {
    l.onTrack = true
  } else if (l.requiredPerWeek !== undefined && l.actualPerWeek !== undefined) {
    l.onTrack = l.actualPerWeek >= l.requiredPerWeek
  }
  return l
}

export function buildPlan(settings: Settings, metrics: BodyMetric[], today = todayISO()): Plan {
  const hasFat = settings.targetBodyFatPct !== undefined
  const hasMuscle = settings.targetMuscleKg !== undefined
  const hasTargets = hasFat || hasMuscle

  const weeksLeft = settings.targetDate ? Math.max(0, diffDays(today, settings.targetDate) / 7) : null

  const { fat: latestFat, muscle: latestMuscle } = latestBody(metrics)

  return {
    hasTargets,
    targetDate: settings.targetDate,
    weeksLeft,
    fat: hasFat
      ? line('Body fat', '%', 'down', latestFat, settings.targetBodyFatPct!, weeksLeft, metrics, (m) => m.bodyFatPct)
      : undefined,
    muscle: hasMuscle
      ? line('Muscle', 'kg', 'up', latestMuscle, settings.targetMuscleKg!, weeksLeft, metrics, (m) => m.muscleKg)
      : undefined,
  }
}
