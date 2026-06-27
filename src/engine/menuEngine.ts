import type { Category, DailyMenu, Exercise, GoalType, MenuItem, Settings, Slot } from '../types'
import { slotForDate, categoriesForSlot } from './split'
import { getMenu, putMenu, listMenus, listEnabledExercises, listMetrics, getSettings } from '../db/repo'
import { diffDays, isWeekend } from '../lib/date'
import { round1 } from '../lib/number'
import { latestBody } from '../lib/metrics'

export { latestBody }

// 動的なメニュー生成。
// 入力 = 週の頻度（→スロット）・目標体脂肪/筋肉量と現在値の差（→方針）・直近達成（→微調整）。
// 重量 = 種目ごとの現在ワーク重量＋漸進性過負荷（前回全達成で増量提案、Today で +/- 調整可）。
// 時間 = 平日は短め(20-30分)・休日は長め(30-45分)に種目数を調整。

const WEEKDAY_BUDGET_MIN = 27 // 平日（20-30分）
const WEEKEND_BUDGET_MIN = 42 // 休日（30-45分）

interface Scheme {
  sets: number
  reps: string
  /** 1種目あたりの目安所要（分）。セット数と休息で概算。 */
  perExerciseMin: number
}

function schemeFor(goal: GoalType): Scheme {
  switch (goal) {
    case 'bulk':
      return { sets: 4, reps: '8-12', perExerciseMin: 9 }
    case 'cut':
      return { sets: 3, reps: '12-15', perExerciseMin: 7 }
    case 'maintain':
    default:
      return { sets: 3, reps: '10', perExerciseMin: 7 }
  }
}

/** 漸進性過負荷の増分(kg)。脚は大きめ、上半身は小さめ。 */
export function incrementFor(category: Category): number {
  return category === 'legs' ? 5 : 2.5
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

/**
 * 目標体脂肪率・目標筋肉量と現在値の差から方針を自動判定。
 * データ不足なら 'maintain'。
 */
export function deriveEmphasis(latest: { fat?: number; muscle?: number }, settings: Settings): GoalType {
  const fatGap =
    latest.fat !== undefined && settings.targetBodyFatPct !== undefined
      ? latest.fat - settings.targetBodyFatPct
      : null
  const muscleGap =
    latest.muscle !== undefined && settings.targetMuscleKg !== undefined
      ? settings.targetMuscleKg - latest.muscle
      : null

  const fatScore = fatGap !== null && fatGap > 0 ? fatGap : 0
  const muscleScore = muscleGap !== null && muscleGap > 0 ? muscleGap : 0
  if (fatScore === 0 && muscleScore === 0) return 'maintain'

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

/** 前回その種目で使った重量・達成状況。 */
export interface LastLift {
  weightKg?: number
  done: boolean
}

/** 漸進性過負荷で次回ターゲット重量を決める。前回全達成なら増量、未達なら据え置き。 */
function suggestWeight(ex: Exercise, last: LastLift | undefined): number | undefined {
  if (!last) return ex.weightKg
  const base = last.weightKg ?? ex.weightKg
  if (base === undefined) return undefined
  return last.done ? round1(base + incrementFor(ex.slot)) : base
}

const CORE_SETS = 3

/** 体幹（コア）ブロックを組む。daily 種目（プランク）は毎日、休養日にも入れる。 */
export function buildCore(slot: Slot, corePool: Exercise[], rotationIndex: number): MenuItem[] {
  const toItem = (e: Exercise): MenuItem => ({
    exerciseId: e.id,
    name: e.name,
    muscle: e.muscle,
    category: 'core',
    targetSets: CORE_SETS,
    targetReps: e.target ?? '12–15 reps',
    daily: e.daily,
    done: false,
  })

  const daily = corePool.filter((e) => e.daily).sort((a, b) => a.id.localeCompare(b.id))
  const items = daily.map(toItem)

  // トレーニング日は回転する追加コアを1つ加える（休養日は daily のみ）。
  if (slot !== 'rest') {
    const rotating = corePool.filter((e) => !e.daily).sort((a, b) => a.id.localeCompare(b.id))
    if (rotating.length > 0) {
      const pick = rotating[((rotationIndex % rotating.length) + rotating.length) % rotating.length]
      items.push(toItem(pick))
    }
  }
  return items
}

/** メニューを純粋に組み立てる（DB 非依存）。 */
export function buildMenu(params: {
  date: string
  settings: Settings
  exercisesByCat: Record<Category, Exercise[]>
  corePool: Exercise[]
  coreRotationIndex: number
  emphasis: GoalType
  priorSameSlotCount: number
  lastSameSlotIds: string[]
  recentAdherence: number | null
  lastByExercise: Record<string, LastLift>
}): DailyMenu {
  const {
    date,
    settings,
    exercisesByCat,
    corePool,
    coreRotationIndex,
    emphasis,
    priorSameSlotCount,
    lastSameSlotIds,
    recentAdherence,
    lastByExercise,
  } = params
  const slot = slotForDate(date, settings.splitPattern)
  const coreItems = buildCore(slot, corePool, coreRotationIndex)

  if (slot === 'rest') {
    return { date, slot, items: [], coreItems, note: REST_NOTE, emphasis, estMinutes: 0, generatedAt: stamp() }
  }

  const scheme = schemeFor(emphasis)
  const budget = isWeekend(date) ? WEEKEND_BUDGET_MIN : WEEKDAY_BUDGET_MIN
  const budgetCount = Math.floor(budget / scheme.perExerciseMin)
  const count = Math.max(2, budgetCount + volumeDelta(recentAdherence))

  const pool = balancedPool(categoriesForSlot(slot), exercisesByCat)
  const chosen = rotateSelect(pool, count, priorSameSlotCount, lastSameSlotIds)

  const items: MenuItem[] = chosen.map((e) => ({
    exerciseId: e.id,
    name: e.name,
    muscle: e.muscle,
    category: e.slot,
    targetSets: scheme.sets,
    targetReps: scheme.reps,
    weightKg: suggestWeight(e, lastByExercise[e.id]),
    done: false,
  }))
  return {
    date,
    slot,
    items,
    coreItems,
    emphasis,
    estMinutes: items.length * scheme.perExerciseMin,
    generatedAt: stamp(),
  }
}

function stamp(): number {
  return Date.now()
}

/** push/pull/legs のみを分類（core は別ブロックで扱う）。 */
function groupByCat(exercises: Exercise[]): Record<Category, Exercise[]> {
  const out: Record<Category, Exercise[]> = { push: [], pull: [], legs: [], core: [] }
  for (const e of exercises) out[e.slot].push(e)
  return out
}

/** 過去メニューから、種目ごとの「最後に使った重量・達成」を集める。 */
export function lastLiftByExercise(history: DailyMenu[], before: string): Record<string, LastLift> {
  const map: Record<string, LastLift> = {}
  for (const m of [...history].sort((a, b) => a.date.localeCompare(b.date))) {
    if (m.date >= before) continue
    for (const it of m.items) map[it.exerciseId] = { weightKg: it.weightKg, done: it.done }
  }
  return map
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
  const cfg = settings ?? (await getSettings())
  const slot = slotForDate(date, cfg.splitPattern)
  const [history, metrics, enabled] = await Promise.all([
    listMenus(),
    listMetrics(),
    listEnabledExercises(),
  ])
  const byCat = groupByCat(enabled)
  const pastCount = history.filter((m) => m.date < date).length

  // 既存メニューがあり再生成不要なら、コア未付与のときだけ非破壊で補完する。
  if (existing && !regenerate) {
    if (existing.coreItems === undefined) {
      const backfilled = { ...existing, coreItems: buildCore(existing.slot, byCat.core, pastCount) }
      await putMenu(backfilled)
      return backfilled
    }
    return existing
  }

  const emphasis = deriveEmphasis(latestBody(metrics), cfg)
  const sameSlotBefore = history
    .filter((m) => m.slot === slot && m.date < date)
    .sort((a, b) => a.date.localeCompare(b.date))
  const last = sameSlotBefore[sameSlotBefore.length - 1]

  const menu = buildMenu({
    date,
    settings: cfg,
    exercisesByCat: byCat,
    corePool: byCat.core,
    coreRotationIndex: pastCount,
    emphasis,
    priorSameSlotCount: sameSlotBefore.length,
    lastSameSlotIds: last ? last.items.map((i) => i.exerciseId) : [],
    recentAdherence: slot === 'rest' ? null : computeRecentAdherence(history, date),
    lastByExercise: lastLiftByExercise(history, date),
  })

  await putMenu(menu)
  return menu
}
