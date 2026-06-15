import { db } from './db'
import type { Exercise, Settings, DailyMenu, BodyMetric } from '../types'
import { DEFAULT_EXERCISES } from '../data/exerciseCatalog'
import { splitForFrequency, clampFreq } from '../engine/split'

const DEFAULT_FREQUENCY = 6

export const defaultSettings = (): Settings => ({
  id: 'app',
  weeklyFrequency: DEFAULT_FREQUENCY,
  targetBodyFatPct: undefined,
  targetMuscleKg: undefined,
  splitPattern: splitForFrequency(DEFAULT_FREQUENCY),
})

/** 初回起動時に設定・種目カタログを投入する（冪等）。古い設定は移行する。 */
export async function ensureSeeded(): Promise<void> {
  await db.transaction('rw', db.settings, db.exercises, async () => {
    const s = await db.settings.get('app')
    // weeklyFrequency が無い = 旧スキーマ → 既定で作り直す（目標値があれば引き継ぐ）。
    if (!s || s.weeklyFrequency === undefined) {
      const carried: Partial<Settings> = s
        ? { targetBodyFatPct: s.targetBodyFatPct, targetMuscleKg: s.targetMuscleKg }
        : {}
      await db.settings.put({ ...defaultSettings(), ...carried })
    }
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

/** 週の回数を変更し、分割パターンも組み直す。 */
export async function setFrequency(freq: number): Promise<void> {
  const f = clampFreq(freq)
  await updateSettings({ weeklyFrequency: f, splitPattern: splitForFrequency(f) })
}

/** 目標体脂肪率・目標筋肉量を設定（undefined で未設定に戻す）。 */
export async function setTargets(patch: {
  targetBodyFatPct?: number
  targetMuscleKg?: number
}): Promise<void> {
  await updateSettings(patch)
}

// --- 種目カタログ ---
export async function listExercises(): Promise<Exercise[]> {
  return db.exercises.toArray()
}

export async function listEnabledExercises(): Promise<Exercise[]> {
  return (await db.exercises.toArray()).filter((e) => e.enabled)
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
