import type { DailyMenu } from '../types'
import { diffDays, todayISO } from './date'

// 履歴の集計（前回実施日・回数）と、前回の実績重量の取り出し。

export interface WorkoutStats {
  /** 前回このワークアウトを行った日（今日より前）。 */
  lastDate?: string
  /** 前回からの経過日数。 */
  daysSince?: number
  /** これまでの実施回数（今日含む）。 */
  count: number
}

export function workoutStats(menus: DailyMenu[], workoutId: string, today = todayISO()): WorkoutStats {
  const dates = menus
    .filter((m) => m.workoutId === workoutId && m.items.length > 0)
    .map((m) => m.date)
  const past = dates.filter((d) => d < today).sort()
  const lastDate = past[past.length - 1]
  return {
    lastDate,
    daysSince: lastDate ? diffDays(lastDate, today) : undefined,
    count: dates.length,
  }
}

/** 「N日前」表記。 */
export function daysAgoLabel(daysSince: number): string {
  if (daysSince <= 0) return 'today'
  if (daysSince === 1) return 'yesterday'
  return `${daysSince} days ago`
}

/** 種目ごとの「最後に使った重量・回数」（before より前）。前回重量プリセットに使う。 */
export function lastLiftByExercise(
  menus: DailyMenu[],
  before: string,
): Record<string, { weightKg?: number; reps?: number }> {
  const map: Record<string, { weightKg?: number; reps?: number }> = {}
  for (const m of [...menus].sort((a, b) => a.date.localeCompare(b.date))) {
    if (m.date >= before) continue
    for (const it of m.items) map[it.exerciseId] = { weightKg: it.weightKg, reps: it.reps }
  }
  return map
}
