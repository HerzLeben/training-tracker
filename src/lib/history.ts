import type { DailyMenu } from '../types'
import { diffDays, todayISO } from './date'

// 履歴の集計（前回実施日・回数）と、前回の実績重量の取り出し。

export interface WorkoutStats {
  /** 前回このワークアウトを行った日（今日より前）。 */
  lastDate?: string
  /** 前回からの経過日数。 */
  daysSince?: number
  /** 今日より前の実施回数（今日の進行中セッションや未来日付は含めない）。 */
  count: number
}

export function workoutStats(menus: DailyMenu[], workoutId: string, today = todayISO()): WorkoutStats {
  const past = menus
    .filter((m) => m.workoutId === workoutId && m.items.length > 0 && m.date < today)
    .map((m) => m.date)
    .sort()
  const lastDate = past[past.length - 1]
  return {
    lastDate,
    daysSince: lastDate ? diffDays(lastDate, today) : undefined,
    count: past.length,
  }
}

/** 「N日前」表記。 */
export function daysAgoLabel(daysSince: number): string {
  if (daysSince <= 0) return 'today'
  if (daysSince === 1) return 'yesterday'
  return `${daysSince} days ago`
}

/**
 * 種目ごとの「最後に使った重量・回数」（before より前）。前回重量プリセットに使う。
 * workoutId を渡すと同じワークアウトの履歴だけを対象にする（種目 id 衝突を回避）。
 */
export function lastLiftByExercise(
  menus: DailyMenu[],
  before: string,
  workoutId?: string,
): Record<string, { weightKg?: number; reps?: number }> {
  const map: Record<string, { weightKg?: number; reps?: number }> = {}
  for (const m of [...menus].sort((a, b) => a.date.localeCompare(b.date))) {
    if (m.date >= before) continue
    if (workoutId !== undefined && m.workoutId !== workoutId) continue
    for (const it of m.items) map[it.exerciseId] = { weightKg: it.weightKg, reps: it.reps }
  }
  return map
}
