import type { DailyMenu, MenuItem, PrescribedExercise, Workout } from '../types'

// セッション組み立て（純関数・DB 非依存）。
// トレーナーのプログラム（Workout）と毎日のコア（dailyCore）から、
// その日のセッションを作る。重量の初期値は「前回の実績」→「目標重量」の順で決める。

type LastLift = { weightKg?: number; reps?: number }

export function buildSession(
  date: string,
  workout: Workout,
  dailyCore: PrescribedExercise[],
  lastByExercise: Record<string, LastLift> = {},
  now: number = Date.now(),
): DailyMenu {
  const toItem = (p: PrescribedExercise, daily = false): MenuItem => {
    const last = lastByExercise[p.id]
    return {
      exerciseId: p.id,
      name: p.name,
      muscle: p.muscle,
      category: p.category,
      targetSets: p.targetSets,
      targetReps: p.targetReps,
      targetWeightKg: p.targetWeightKg,
      // 前回の実績重量があればそれを初期値に、なければ目標重量。
      weightKg: last?.weightKg ?? p.targetWeightKg,
      daily: daily || undefined,
      done: false,
    }
  }

  return {
    date,
    workoutId: workout.id,
    workoutName: workout.name,
    items: workout.items.map((p) => toItem(p)),
    coreItems: dailyCore.map((p) => toItem(p, true)),
    generatedAt: now,
  }
}
