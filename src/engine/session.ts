import type { DailyMenu, MenuItem, PrescribedExercise, Workout } from '../types'

// セッション組み立て（純関数・DB 非依存）。
// トレーナーのプログラム（Workout）と毎日のコア（dailyCore）から、
// 実績フィールドが空のその日のセッションを作る。

function toItem(p: PrescribedExercise, daily = false): MenuItem {
  return {
    exerciseId: p.id,
    name: p.name,
    muscle: p.muscle,
    category: p.category,
    targetSets: p.targetSets,
    targetReps: p.targetReps,
    targetWeightKg: p.targetWeightKg,
    // 目標重量があれば実績入力の初期値として置いておく（Today で調整可）。
    weightKg: p.targetWeightKg,
    daily: daily || undefined,
    done: false,
  }
}

export function buildSession(
  date: string,
  workout: Workout,
  dailyCore: PrescribedExercise[],
  now: number = Date.now(),
): DailyMenu {
  return {
    date,
    workoutId: workout.id,
    workoutName: workout.name,
    items: workout.items.map((p) => toItem(p)),
    coreItems: dailyCore.map((p) => toItem(p, true)),
    generatedAt: now,
  }
}
