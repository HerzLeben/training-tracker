import type { DailyMenu, Exercise, GoalType, MenuItem, Settings, Slot } from '../types'
import { slotForDate } from './split'
import { getMenu, putMenu, enabledExercisesBySlot, listMenus } from '../db/repo'
import { diffDays } from '../lib/date'

// ルールベースのメニュー生成。
// 入力 = 目標タイプ・直近の達成状況・部位（種目）ローテ。
// ※今回は前回重量・レップによる漸進性過負荷は対象外（チェックのみ）。

interface Scheme {
  baseCount: number // 基本の種目数
  sets: number
  reps: string
}

function schemeFor(goal: GoalType): Scheme {
  switch (goal) {
    case 'bulk':
      return { baseCount: 4, sets: 4, reps: '8-12' }
    case 'cut':
      return { baseCount: 4, sets: 3, reps: '12-15' }
    case 'maintain':
    default:
      return { baseCount: 3, sets: 3, reps: '10' }
  }
}

const REST_NOTE = '今日は休養日です。睡眠と栄養で回復を。軽いストレッチや有酸素は任意。'

/** 直近の達成率に応じたボリューム調整量（種目数・セット数の増減）。 */
function volumeDelta(recentAdherence: number | null): number {
  if (recentAdherence === null) return 0
  if (recentAdherence < 0.6) return -1 // 続かない → 取り組みやすく減らす
  if (recentAdherence >= 0.9) return 1 // 安定 → 少し増やす
  return 0
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

/**
 * スロット対象の種目から count 件を、ローテーション offset を使って選ぶ。
 * 直近の同スロットと同じ顔ぶれになりそうなら 1 周ずらす。
 */
function pickExercises(
  pool: Exercise[],
  count: number,
  rotationIndex: number,
  lastIds: string[],
): Exercise[] {
  if (pool.length === 0) return []
  const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id))
  const n = sorted.length
  const take = Math.min(count, n)

  const select = (offset: number): Exercise[] => {
    const out: Exercise[] = []
    for (let i = 0; i < take; i++) out.push(sorted[(offset + i) % n])
    return out
  }

  let offset = ((rotationIndex * take) % n + n) % n
  let chosen = select(offset)
  // 直近と完全一致し、かつ他に選択肢があるならずらす。
  const sameAsLast =
    lastIds.length === chosen.length && chosen.every((e) => lastIds.includes(e.id))
  if (sameAsLast && n > take) {
    offset = (offset + take) % n
    chosen = select(offset)
  }
  return chosen
}

/** メニューを純粋に組み立てる（DB 非依存）。 */
export function buildMenu(params: {
  date: string
  settings: Settings
  slotPool: Exercise[]
  priorSameSlotCount: number
  lastSameSlotIds: string[]
  recentAdherence: number | null
}): DailyMenu {
  const { date, settings, slotPool, priorSameSlotCount, lastSameSlotIds, recentAdherence } = params
  const slot: Slot = slotForDate(date, settings.splitPattern)

  if (slot === 'rest') {
    return { date, slot, items: [], note: REST_NOTE, generatedAt: stamp() }
  }

  const scheme = schemeFor(settings.goalType)
  const delta = volumeDelta(recentAdherence)
  const count = Math.max(2, scheme.baseCount + delta)
  const sets = Math.max(2, scheme.sets + delta)

  const chosen = pickExercises(slotPool, count, priorSameSlotCount, lastSameSlotIds)
  const items: MenuItem[] = chosen.map((e) => ({
    exerciseId: e.id,
    name: e.name,
    muscle: e.muscle,
    targetSets: sets,
    targetReps: scheme.reps,
    done: false,
  }))
  return { date, slot, items, generatedAt: stamp() }
}

// generatedAt 用。テスト容易性のため分離。
function stamp(): number {
  return Date.now()
}

/**
 * 指定日のメニューを取得。無ければ生成して保存する。
 * regenerate=true で既存を破棄して作り直す（チェックはリセット）。
 */
export async function ensureMenuForDate(
  date: string,
  settings: Settings,
  regenerate = false,
): Promise<DailyMenu> {
  const existing = await getMenu(date)
  if (existing && !regenerate) return existing

  const slot = slotForDate(date, settings.splitPattern)
  const history = await listMenus()

  let menu: DailyMenu
  if (slot === 'rest') {
    menu = buildMenu({
      date,
      settings,
      slotPool: [],
      priorSameSlotCount: 0,
      lastSameSlotIds: [],
      recentAdherence: null,
    })
  } else {
    const pool = await enabledExercisesBySlot(slot)
    const sameSlotBefore = history
      .filter((m) => m.slot === slot && m.date < date)
      .sort((a, b) => a.date.localeCompare(b.date))
    const last = sameSlotBefore[sameSlotBefore.length - 1]
    menu = buildMenu({
      date,
      settings,
      slotPool: pool,
      priorSameSlotCount: sameSlotBefore.length,
      lastSameSlotIds: last ? last.items.map((i) => i.exerciseId) : [],
      recentAdherence: computeRecentAdherence(history, date),
    })
  }

  await putMenu(menu)
  return menu
}
