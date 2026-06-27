import type { Workout } from '../types'

// お試し用のサンプルプログラム（トレーナーが作る想定の例）。
// 固定 id なので、再読み込みしても重複せず上書きされる。重量は仮の初期値。
export const SAMPLE_WORKOUTS: Workout[] = [
  {
    id: 'sample-push',
    name: 'Day A · Push',
    items: [
      { id: 'sp-1', name: 'Bench Press', muscle: 'Chest', category: 'push', targetSets: 3, targetReps: '10', targetWeightKg: 40 },
      { id: 'sp-2', name: 'Incline DB Press', muscle: 'Chest', category: 'push', targetSets: 3, targetReps: '12', targetWeightKg: 14 },
      { id: 'sp-3', name: 'Shoulder Press', muscle: 'Shoulders', category: 'push', targetSets: 3, targetReps: '12', targetWeightKg: 20 },
      { id: 'sp-4', name: 'Triceps Pushdown', muscle: 'Triceps', category: 'push', targetSets: 3, targetReps: '15', targetWeightKg: 25 },
    ],
  },
  {
    id: 'sample-pull',
    name: 'Day B · Pull',
    items: [
      { id: 'pl-1', name: 'Lat Pulldown', muscle: 'Back', category: 'pull', targetSets: 3, targetReps: '10', targetWeightKg: 40 },
      { id: 'pl-2', name: 'Seated Row', muscle: 'Back', category: 'pull', targetSets: 3, targetReps: '12', targetWeightKg: 35 },
      { id: 'pl-3', name: 'Face Pull', muscle: 'Rear Delts', category: 'pull', targetSets: 3, targetReps: '15', targetWeightKg: 15 },
      { id: 'pl-4', name: 'Dumbbell Curl', muscle: 'Biceps', category: 'pull', targetSets: 3, targetReps: '12', targetWeightKg: 10 },
    ],
  },
  {
    id: 'sample-legs',
    name: 'Day C · Legs',
    items: [
      { id: 'lg-1', name: 'Barbell Squat', muscle: 'Quads', category: 'legs', targetSets: 3, targetReps: '10', targetWeightKg: 50 },
      { id: 'lg-2', name: 'Leg Press', muscle: 'Quads', category: 'legs', targetSets: 3, targetReps: '12', targetWeightKg: 80 },
      { id: 'lg-3', name: 'Leg Curl', muscle: 'Hamstrings', category: 'legs', targetSets: 3, targetReps: '12', targetWeightKg: 30 },
      { id: 'lg-4', name: 'Calf Raise', muscle: 'Calves', category: 'legs', targetSets: 3, targetReps: '15', targetWeightKg: 40 },
    ],
  },
]
