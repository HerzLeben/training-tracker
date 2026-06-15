import type { BodyMetric, Category, DailyMenu, Exercise, GoalType, MenuItem, Settings } from '../types'
import { slotForDate, categoriesForSlot } from './split'
import { getMenu, putMenu, listMenus, listEnabledExercises, listMetrics } from '../db/repo'
import { getSettings } from '../db/repo'
import { diffDays } from '../lib/date'

// 動的なメニュー生成。
// 入力 = 週の頻度（→スロット）・目標体脂肪/筋肉量と現在値の差（→方針）・直近達成（→微調整）。
// 制約 = 筋トレ部分が約30分に収まる種目数/セット数にする。
// ※今回も記録はチェックのみ（重量・レップは扱わない）。

const SESSION_BUDGET_MIN = 30 // 筋トレ部分の目安（分）

interface Scheme {
  sets: number
  reps: string
  /** 1種目あたりの目安所要（分）。セット数と休息で概算。 */
  perExerciseMin: number
}

function schemeFor(goal: GoalType): Scheme {
  switch (goal) {
    case 'bulk':
      // 高重量・長め休息。1種目 ≈ 4セット → 約9分。
      return { sets: 4, reps: '8-12', perExerciseMin: 9 }
    case 'cut':
      // 高回数・短め休息で種目数を確保。1種目 ≈ 3セット → 約7分。
      return { sets: 3, reps: '12-15', perExerciseMin: 7 }
    case 'maintain':
    default:
      return { sets: 3, reps: '10', perExerciseMin: 7 }
  }
}

const REST_NOTE = 'Rest day. Recover with sleep and nutrition.'

const EMPHASIS_LABEL: Record<GoalType, string> = {
  cut: 'Fat-loss focus',
  bulk: 'Muscle-gain focus',
  maintain: 'Maintenance',
}

export function emphasisLabel(g: GoalType): string {
  return EMPHASIS_LABEL[g]
}

/** 体組成の最新値（項目ごとに最も新しい記録）を取り出す。 */
export function latestBody(metrics: BodyMetric[]): { fat?: number; muscle?: number } {
  const sorted = [...metrics].sort((a, b) => b.date.localeCompare(a.date))
  const fat = sorted.find((m) => m.bodyFatPct !== undefined)?.bodyFatPct
  const muscle = sorted.find((m) => m.muscleKg !== undefined)?.muscleKg
  return { fat, muscle }
}

/**
 * 目標体脂肪率・目標筋肉量と現在値の差から方針を自動判定。
 * データ不足なら 'maintain'。
 */
export function deriveEmphasis(latest: { fat?: number; muscle?: number }, settings: Settings): GoalType {
  const fatGap =
    latest.fat !== undefined && settings.targetBodyFatPct !== undefined
      ? latest.fat - settings.targetBodyFatPct // >0: 体脂肪を減らす必要
      : null
  const muscleGap =
    latest.muscle !== undefined && settings.targetMuscleKg !== undefined
      ? settings.targetMuscleKg - latest.muscle // >0: 筋肉を増やす必要
      : null

  const fatScore = fatGap !== null && fatGap > 0 ? fatGap : 0
  const muscleScore = muscleGap !== null && muscleGap > 0 ? muscleGap : 0
  if (fatScore === 0 && muscleScore === 0) return 'maintain'

  // 正規化（体脂肪 2% ≒ 筋肉 1kg を同程度の重みとして比較）。
  const fatNorm = fatScore / 2
  const muscleNorm = muscleScore / 1
  return fatNorm >= muscleNorm ? 'cut' : 'bulk'
}

/** 直近 N 日（item を持つメニュー）の平均達成率。なければ null。 */
function computeRecentAdherence(history: DailyMenu[], date: string, days = 7): number | null {
  const recent = history.filter((m) => {
    const d = diffDays(m.date, date)
    return d > 0 && d <= days && m.items.length > 0
  })
  if (recent.length === 0) return null
  const ratios = recent.map((m) => m.items.filter((i) => i.done).length / m.items.length)
  return ratios.reduce((a, b) => a + b, 0) / ratios.length
}

function volumeDelta(recentAdherence: number | null): number {
  if (recentAdherence === null) return 0
  if (recentAdherence < 0.6) return -1
  if (recentAdherence >= 0.9) return 1
  return 0
}

/** カテゴリ群の有効種目をラウンドロビンで一列に並べる（部位バランス確保）。 */
function balancedPool(cats: Category[], byCat: Record<Category, Exercise[]>): Exercise[] {
  const lists = cats.map((c) => [...(byCat[c] ?? [])].sort((a, b) => a.id.localeCompare(b.id)))
  const out: Exercise[] = []
  const maxLen = Math.max(0, ...lists.map((l) => l.length))
  for (let i = 0; i < maxLen; i++) {
    for (const l of lists) if (i < l.length) out.push(l[i])
  }
  return out
}

/** ローテ offset を使い、直近と同一顔ぶれを避けて count 件選ぶ。 */
function rotateSelect(pool: Exercise[], count: number, rotationIndex: number, lastIds: string[]): Exercise[] {
  if (pool.length === 0) return []
  const n = pool.length
  const take = Math.min(count, n)
  const select = (offset: number): Exercise[] => {
    const out: Exercise[] = []
    for (let i = 0; i < take; i++) out.push(pool[(offset + i) % n])
    return out
  }
  let offset = (((rotationIndex * take) % n) + n) % n
  let chosen = select(offset)
  const sameAsLast = lastIds.length === chosen.length && chosen.every((e) => lastIds.includes(e.id))
  if (sameAsLast && n > take) chosen = select((offset + take) % n)
  return chosen
}

/** メニューを純粋に組み立てる（DB 非依存）。 */
export function buildMenu(params: {
  date: string
  settings: Settings
  exercisesByCat: Record<Category, Exercise[]>
  emphasis: GoalType
  priorSameSlotCount: number
  lastSameSlotIds: string[]
  recentAdherence: number | null
}): DailyMenu {
  const { date, settings, exercisesByCat, emphasis, priorSameSlotCount, lastSameSlotIds, recentAdherence } = params
  const slot = slotForDate(date, settings.splitPattern)

  if (slot === 'rest') {
    return { date, slot, items: [], note: REST_NOTE, emphasis, estMinutes: 0, generatedAt: stamp() }
  }

  const scheme = schemeFor(emphasis)
  // 30分枠に収まる種目数を算出し、直近達成で ±1 微調整。
  const budgetCount = Math.floor(SESSION_BUDGET_MIN / scheme.perExerciseMin)
  const count = Math.max(2, budgetCount + volumeDelta(recentAdherence))

  const pool = balancedPool(categoriesForSlot(slot), exercisesByCat)
  const chosen = rotateSelect(pool, count, priorSameSlotCount, lastSameSlotIds)

  const items: MenuItem[] = chosen.map((e) => ({
    exerciseId: e.id,
    name: e.name,
    muscle: e.muscle,
    targetSets: scheme.sets,
    targetReps: scheme.reps,
    done: false,
  }))
  return {
    date,
    slot,
    items,
    emphasis,
    estMinutes: items.length * scheme.perExerciseMin,
    generatedAt: stamp(),
  }
}

function stamp(): number {
  return Date.now()
}

function groupByCat(exercises: Exercise[]): Record<Category, Exercise[]> {
  const out: Record<Category, Exercise[]> = { push: [], pull: [], legs: [] }
  for (const e of exercises) out[e.slot].push(e)
  return out
}

/**
 * 指定日のメニューを取得。無ければ生成して保存する。
 * regenerate=true で作り直す（チェックはリセット）。
 */
export async function ensureMenuForDate(
  date: string,
  settings?: Settings,
  regenerate = false,
): Promise<DailyMenu> {
  const existing = await getMenu(date)
  if (existing && !regenerate) return existing

  const cfg = settings ?? (await getSettings())
  const slot = slotForDate(date, cfg.splitPattern)
  const [history, metrics, enabled] = await Promise.all([
    listMenus(),
    listMetrics(),
    listEnabledExercises(),
  ])
  const emphasis = deriveEmphasis(latestBody(metrics), cfg)

  const sameSlotBefore = history
    .filter((m) => m.slot === slot && m.date < date)
    .sort((a, b) => a.date.localeCompare(b.date))
  const last = sameSlotBefore[sameSlotBefore.length - 1]

  const menu = buildMenu({
    date,
    settings: cfg,
    exercisesByCat: groupByCat(enabled),
    emphasis,
    priorSameSlotCount: sameSlotBefore.length,
    lastSameSlotIds: last ? last.items.map((i) => i.exerciseId) : [],
    recentAdherence: slot === 'rest' ? null : computeRecentAdherence(history, date),
  })

  await putMenu(menu)
  return menu
}
