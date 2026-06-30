import type { Workout } from '../types'

// The user's trainer-made 6-day-per-week program.
// Fixed ids → idempotent (re-loading overwrites, no duplicates).
// Exercises without a weight have no target weight (log the actual weight on Today).
export const SAMPLE_WORKOUTS: Workout[] = [
  {
    id: 'w-chest',
    name: 'Chest',
    items: [
      { id: 'c1', name: 'Smith Incline Press (30°)', muscle: 'Chest', category: 'push', targetSets: 3, targetReps: '10' },
      { id: 'c2', name: 'Dumbbell Press', muscle: 'Chest', category: 'push', targetSets: 3, targetReps: '10', targetWeightKg: 12 },
      { id: 'c3', name: 'Dumbbell Fly', muscle: 'Chest', category: 'push', targetSets: 3, targetReps: '10', targetWeightKg: 12 },
      { id: 'c4', name: 'Pec Fly', muscle: 'Chest', category: 'push', targetSets: 3, targetReps: '12' },
    ],
  },
  {
    id: 'w-shoulder',
    name: 'Shoulders',
    items: [
      { id: 's1', name: 'Shoulder Press', muscle: 'Shoulders', category: 'push', targetSets: 3, targetReps: '10', targetWeightKg: 12 },
      { id: 's2', name: 'Side Raise', muscle: 'Shoulders', category: 'push', targetSets: 3, targetReps: '15', targetWeightKg: 6 },
      { id: 's3', name: 'Cable Upright Row', muscle: 'Shoulders', category: 'push', targetSets: 3, targetReps: '10' },
      { id: 's4', name: 'Shoulder Press (Machine)', muscle: 'Shoulders', category: 'push', targetSets: 3, targetReps: '10' },
    ],
  },
  {
    id: 'w-biceps',
    name: 'Arms · Biceps',
    items: [
      { id: 'b1', name: 'Arm Curl (heavy)', muscle: 'Biceps', category: 'pull', targetSets: 2, targetReps: '10', targetWeightKg: 30 },
      { id: 'b2', name: 'Arm Curl (light)', muscle: 'Biceps', category: 'pull', targetSets: 2, targetReps: '15', targetWeightKg: 20 },
      { id: 'b3', name: 'Dumbbell Curl', muscle: 'Biceps', category: 'pull', targetSets: 3, targetReps: '10' },
      { id: 'b4', name: 'Hammer Curl', muscle: 'Biceps', category: 'pull', targetSets: 3, targetReps: '10' },
      { id: 'b5', name: 'Cable Curl', muscle: 'Biceps', category: 'pull', targetSets: 3, targetReps: '10' },
    ],
  },
  {
    id: 'w-triceps',
    name: 'Arms · Triceps',
    items: [
      { id: 't1', name: 'Cable Extension', muscle: 'Triceps', category: 'push', targetSets: 4, targetReps: '10' },
      { id: 't2', name: 'Pushdown', muscle: 'Triceps', category: 'push', targetSets: 4, targetReps: '10', targetWeightKg: 12.5 },
      { id: 't3', name: 'Triceps Extension', muscle: 'Triceps', category: 'push', targetSets: 3, targetReps: '10' },
      { id: 't4', name: 'Kickback', muscle: 'Triceps', category: 'push', targetSets: 3, targetReps: '10', targetWeightKg: 5 },
    ],
  },
  {
    id: 'w-legs',
    name: 'Legs',
    items: [
      { id: 'l1', name: 'Leg Extension', muscle: 'Quads', category: 'legs', targetSets: 3, targetReps: '10' },
      { id: 'l2', name: 'Leg Curl', muscle: 'Hamstrings', category: 'legs', targetSets: 3, targetReps: '10' },
      { id: 'l3', name: 'Leg Press', muscle: 'Quads', category: 'legs', targetSets: 3, targetReps: '10' },
      { id: 'l4', name: 'Hip Abductor', muscle: 'Glutes', category: 'legs', targetSets: 3, targetReps: '10' },
    ],
  },
  {
    id: 'w-back',
    name: 'Back',
    items: [
      { id: 'k1', name: 'Lat Pulldown', muscle: 'Back', category: 'pull', targetSets: 3, targetReps: '10', targetWeightKg: 37.5 },
      { id: 'k2', name: 'Lat Pulldown (T-bar Row)', muscle: 'Back', category: 'pull', targetSets: 3, targetReps: '10', targetWeightKg: 30 },
      { id: 'k3', name: 'Seated Row', muscle: 'Back', category: 'pull', targetSets: 3, targetReps: '10', targetWeightKg: 40 },
      { id: 'k4', name: 'Bent-Over Row', muscle: 'Back', category: 'pull', targetSets: 3, targetReps: '10', targetWeightKg: 35 },
    ],
  },
]

/** 旧お試しデモのワークアウト id（読み込み時に掃除する）。 */
export const LEGACY_SAMPLE_IDS = ['sample-push', 'sample-pull', 'sample-legs']
