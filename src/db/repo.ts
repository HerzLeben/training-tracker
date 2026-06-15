import { db } from './db'
import type { Exercise, Settings, DailyMenu, BodyMetric, GoalType, Slot } from '../types'
import { DEFAULT_EXERCISES } from '../data/exerciseCatalog'
import { defaultSplitPattern } from '../engine/split'

const DEFAULT_REST_WEEKDAY = 0 // 日曜

export const defaultSettings = (): Settings => ({
  id: 'app',
  goalType: 'maintain',
  restWeekday: DEFAULT_REST_WEEKDAY,
  splitPattern: defaultSplitPattern(DEFAULT_REST_WEEKDAY),
})

/** 初回起動時に設定・種目カタログを投入する（冪等）。 */
export async function ensureSeeded(): Promise<void> {
  await db.transaction('rw', db.settings, db.exercises, async () => {
    const s = await db.settings.get('app')
    if (!s) await db.settings.put(defaultSettings())
    const count = await db.exercises.count()
    if (count === 0) await db.exercises.bulkPut(DEFAULT_EXERCISES)
  })
}

// --- 設定 ---
export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('app')) ?? defaultSettings()
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await getSettings()
  await db.settings.put({ ...cur, ...patch, id: 'app' })
}

export async function setGoalType(goalType: GoalType): Promise<void> {
  await updateSettings({ goalType })
}

/** 休養日を変更し、分割パターンも既定で組み直す。 */
export async function setRestWeekday(restWeekday: number): Promise<void> {
  await updateSettings({ restWeekday, splitPattern: defaultSplitPattern(restWeekday) })
}

export async function setSplitPattern(splitPattern: Slot[]): Promise<void> {
  await updateSettings({ splitPattern })
}

// --- 種目カタログ ---
export async function listExercises(): Promise<Exercise[]> {
  return db.exercises.toArray()
}

export async function enabledExercisesBySlot(slot: Exclude<Slot, 'rest'>): Promise<Exercise[]> {
  const all = await db.exercises.where('slot').equals(slot).toArray()
  return all.filter((e) => e.enabled)
}

export async function upsertExercise(ex: Exercise): Promise<void> {
  await db.exercises.put(ex)
}

export async function deleteExercise(id: string): Promise<void> {
  await db.exercises.delete(id)
}

// --- メニュー ---
export async function getMenu(date: string): Promise<DailyMenu | undefined> {
  return db.menus.get(date)
}

export async function putMenu(menu: DailyMenu): Promise<void> {
  await db.menus.put(menu)
}

export async function listMenus(): Promise<DailyMenu[]> {
  return db.menus.orderBy('date').toArray()
}

/** 指定日の種目チェックを更新して保存。 */
export async function toggleMenuItem(date: string, exerciseId: string, done: boolean): Promise<void> {
  const menu = await db.menus.get(date)
  if (!menu) return
  menu.items = menu.items.map((it) =>
    it.exerciseId === exerciseId ? { ...it, done } : it,
  )
  await db.menus.put(menu)
}

// --- 体組成 ---
export async function listMetrics(): Promise<BodyMetric[]> {
  return db.metrics.orderBy('date').toArray()
}

export async function upsertMetric(m: BodyMetric): Promise<void> {
  await db.metrics.put(m)
}

export async function deleteMetric(date: string): Promise<void> {
  await db.metrics.delete(date)
}
