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

/** Seed settings and exercise catalog on first launch (idempotent); migrate old data. */
export async function ensureSeeded(): Promise<void> {
  await db.transaction('rw', db.settings, db.exercises, async () => {
    const s = await db.settings.get('app')
    // No weeklyFrequency = old schema → rebuild from defaults (carry over targets).
    if (!s || s.weeklyFrequency === undefined) {
      const carried: Partial<Settings> = s
        ? { targetBodyFatPct: s.targetBodyFatPct, targetMuscleKg: s.targetMuscleKg }
        : {}
      await db.settings.put({ ...defaultSettings(), ...carried })
    }
    // Keep default exercises (name/muscle) in sync, preserving the user's
    // enabled toggles. Custom exercises are left untouched.
    const existing = await db.exercises.toArray()
    const byId = new Map(existing.map((e) => [e.id, e]))
    const merged = DEFAULT_EXERCISES.map((d) => ({
      ...d,
      enabled: byId.get(d.id)?.enabled ?? d.enabled,
      weightKg: byId.get(d.id)?.weightKg ?? d.weightKg,
    }))
    await db.exercises.bulkPut(merged)
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

/** 目標体脂肪率・目標筋肉量・期限を設定（undefined で未設定に戻す）。 */
export async function setTargets(patch: {
  targetBodyFatPct?: number
  targetMuscleKg?: number
  targetDate?: string
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

/** 指定日のコア（体幹）種目のチェックを更新して保存。 */
export async function toggleCoreItem(date: string, exerciseId: string, done: boolean): Promise<void> {
  const menu = await db.menus.get(date)
  if (!menu || !menu.coreItems) return
  menu.coreItems = menu.coreItems.map((it) =>
    it.exerciseId === exerciseId ? { ...it, done } : it,
  )
  await db.menus.put(menu)
}

/**
 * 指定日の種目の重量を更新。あわせて種目の現在ワーク重量も同期する
 * （カタログ表示と次回の提案の土台を実態に合わせる）。
 */
export async function setMenuItemWeight(
  date: string,
  exerciseId: string,
  weightKg: number,
): Promise<void> {
  const w = Math.max(0, Math.round(weightKg * 10) / 10)
  await db.transaction('rw', db.menus, db.exercises, async () => {
    const menu = await db.menus.get(date)
    if (menu) {
      menu.items = menu.items.map((it) =>
        it.exerciseId === exerciseId ? { ...it, weightKg: w } : it,
      )
      await db.menus.put(menu)
    }
    const ex = await db.exercises.get(exerciseId)
    if (ex) await db.exercises.put({ ...ex, weightKg: w })
  })
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
