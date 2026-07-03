import { db } from './db'
import type { Workout, Settings, DailyMenu, BodyMetric, PrescribedExercise, SessionType } from '../types'
import { buildSession } from '../engine/session'
import { round1 } from '../lib/number'
import { lastLiftByExercise } from '../lib/history'
import { SAMPLE_WORKOUTS, LEGACY_SAMPLE_IDS } from '../data/sampleProgram'

// 既定の毎日コア（プランク）。
export const DEFAULT_DAILY_CORE: PrescribedExercise[] = [
  { id: 'plank', name: 'Plank', muscle: 'Core', category: 'core', targetSets: 3, targetReps: '45–60s' },
]

export const defaultSettings = (): Settings => ({
  id: 'app',
  dailyCore: DEFAULT_DAILY_CORE,
})

/** 初回起動時に設定を投入（冪等）。旧スキーマからの移行も行う。 */
export async function ensureSeeded(): Promise<void> {
  const s = await db.settings.get('app')
  // dailyCore が無い = 旧スキーマ → 既定で作り直す（目標値があれば引き継ぐ）。
  if (!s || s.dailyCore === undefined) {
    const carried: Partial<Settings> = s
      ? { targetBodyFatPct: s.targetBodyFatPct, targetMuscleKg: s.targetMuscleKg, targetDate: s.targetDate }
      : {}
    await db.settings.put({ ...defaultSettings(), ...carried })
  }
}

// --- 設定 ---
export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('app')) ?? defaultSettings()
}

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await getSettings()
  await db.settings.put({ ...cur, ...patch, id: 'app' })
}

/** 目標体脂肪率・目標筋肉量・期限を設定（undefined で未設定に戻す）。 */
export async function setTargets(patch: {
  targetBodyFatPct?: number
  targetMuscleKg?: number
  targetDate?: string
}): Promise<void> {
  await updateSettings(patch)
}

export async function setDailyCore(dailyCore: PrescribedExercise[]): Promise<void> {
  await updateSettings({ dailyCore })
}

// --- プログラム（ワークアウト） ---
export async function listWorkouts(): Promise<Workout[]> {
  return db.workouts.toArray()
}

export async function upsertWorkout(w: Workout): Promise<void> {
  await db.workouts.put(w)
}

export async function deleteWorkout(id: string): Promise<void> {
  await db.workouts.delete(id)
}

/** プログラムを読み込む（固定 id なので重複しない）。旧デモは掃除する。 */
export async function loadSampleProgram(): Promise<void> {
  await db.transaction('rw', db.workouts, async () => {
    await db.workouts.bulkDelete(LEGACY_SAMPLE_IDS)
    await db.workouts.bulkPut(SAMPLE_WORKOUTS)
  })
}

// --- セッション（メニュー） ---
export async function getMenu(date: string): Promise<DailyMenu | undefined> {
  return db.menus.get(date)
}

export async function putMenu(menu: DailyMenu): Promise<void> {
  await db.menus.put(menu)
}

export async function listMenus(): Promise<DailyMenu[]> {
  return db.menus.orderBy('date').toArray()
}

/** 指定日のセッションをワークアウトから生成して保存（既存は上書き＝実績リセット）。 */
export async function startSession(date: string, workout: Workout): Promise<DailyMenu> {
  const [settings, history] = await Promise.all([getSettings(), listMenus()])
  const last = lastLiftByExercise(history, date, workout.id)
  const session: DailyMenu = { ...buildSession(date, workout, settings.dailyCore, last), type: 'gym' }
  await db.menus.put(session)
  return session
}

/**
 * ジム以外の種別（personal/home/rest/skipped）で当日を記録する。
 * personal/home は毎日コア（プランク）を含め、rest/skipped は含めない。
 */
export async function markDay(date: string, type: Exclude<SessionType, 'gym'>): Promise<void> {
  const settings = await getSettings()
  const withCore = type === 'personal' || type === 'home'
  const coreItems = withCore
    ? settings.dailyCore.map((p) => ({
        exerciseId: p.id,
        name: p.name,
        muscle: p.muscle,
        category: p.category,
        targetSets: p.targetSets,
        targetReps: p.targetReps,
        daily: true,
        done: false,
      }))
    : []
  await db.menus.put({ date, type, items: [], coreItems, generatedAt: Date.now() })
}

/** 指定日の記録を削除（クリア）。 */
export async function deleteSession(date: string): Promise<void> {
  await db.menus.delete(date)
}

/** 指定日のメニューを読み込み、mutate を適用して保存（無ければ何もしない）。原子的に行う。 */
async function updateMenu(date: string, mutate: (menu: DailyMenu) => void): Promise<void> {
  await db.transaction('rw', db.menus, async () => {
    const menu = await db.menus.get(date)
    if (!menu) return
    mutate(menu)
    await db.menus.put(menu)
  })
}

/** 指定日の種目チェックを更新。 */
export async function toggleMenuItem(date: string, exerciseId: string, done: boolean): Promise<void> {
  await updateMenu(date, (menu) => {
    menu.items = menu.items.map((it) => (it.exerciseId === exerciseId ? { ...it, done } : it))
  })
}

/** 指定日のコア種目チェックを更新。 */
export async function toggleCoreItem(date: string, exerciseId: string, done: boolean): Promise<void> {
  await updateMenu(date, (menu) => {
    if (!menu.coreItems) return
    menu.coreItems = menu.coreItems.map((it) => (it.exerciseId === exerciseId ? { ...it, done } : it))
  })
}

/** 指定日の種目の実績（重量・回数）を更新。 */
export async function setItemResult(
  date: string,
  exerciseId: string,
  patch: { weightKg?: number; reps?: number },
): Promise<void> {
  const clean = {
    ...(patch.weightKg !== undefined ? { weightKg: Math.max(0, round1(patch.weightKg)) } : {}),
    ...(patch.reps !== undefined ? { reps: Math.max(0, Math.round(patch.reps)) } : {}),
  }
  await updateMenu(date, (menu) => {
    menu.items = menu.items.map((it) => (it.exerciseId === exerciseId ? { ...it, ...clean } : it))
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
