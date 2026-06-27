import type { BodyMetric } from '../types'

// 体組成記録の取り出しヘルパー。

/** 指定フィールドの最新値（最も新しい日付の非 undefined 値）。 */
export function latestValue(
  metrics: BodyMetric[],
  pick: (m: BodyMetric) => number | undefined,
): number | undefined {
  let best: { date: string; value: number } | undefined
  for (const m of metrics) {
    const v = pick(m)
    if (v === undefined) continue
    if (!best || m.date > best.date) best = { date: m.date, value: v }
  }
  return best?.value
}

/** 体脂肪率・筋肉量の最新値（項目ごとに別の日でも可）。 */
export function latestBody(metrics: BodyMetric[]): { fat?: number; muscle?: number } {
  return {
    fat: latestValue(metrics, (m) => m.bodyFatPct),
    muscle: latestValue(metrics, (m) => m.muscleKg),
  }
}
