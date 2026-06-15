import type { Exercise } from '../types'

// Standard exercise set (gym-oriented). Seeded into the DB on first launch.
// Fixed string ids prevent duplicates on re-seed / import.
type Seed = Omit<Exercise, 'isCustom' | 'enabled'>

const SEED: Seed[] = [
  // push (chest / shoulders / triceps)
  { id: 'bench-press', name: 'Bench Press', slot: 'push', muscle: 'Chest' },
  { id: 'incline-db-press', name: 'Incline Dumbbell Press', slot: 'push', muscle: 'Chest' },
  { id: 'chest-press-machine', name: 'Chest Press (Machine)', slot: 'push', muscle: 'Chest' },
  { id: 'cable-fly', name: 'Cable Fly', slot: 'push', muscle: 'Chest' },
  { id: 'shoulder-press', name: 'Shoulder Press', slot: 'push', muscle: 'Shoulders' },
  { id: 'side-raise', name: 'Side Raise', slot: 'push', muscle: 'Shoulders' },
  { id: 'triceps-pushdown', name: 'Triceps Pushdown', slot: 'push', muscle: 'Triceps' },

  // pull (back / biceps)
  { id: 'lat-pulldown', name: 'Lat Pulldown', slot: 'pull', muscle: 'Back' },
  { id: 'seated-row', name: 'Seated Row', slot: 'pull', muscle: 'Back' },
  { id: 'bent-over-row', name: 'Bent-Over Row', slot: 'pull', muscle: 'Back' },
  { id: 'pullup', name: 'Pull-Up', slot: 'pull', muscle: 'Back' },
  { id: 'face-pull', name: 'Face Pull', slot: 'pull', muscle: 'Rear Delts' },
  { id: 'db-curl', name: 'Dumbbell Curl', slot: 'pull', muscle: 'Biceps' },
  { id: 'hammer-curl', name: 'Hammer Curl', slot: 'pull', muscle: 'Biceps' },

  // legs (quads / hamstrings / glutes / calves)
  { id: 'squat', name: 'Barbell Squat', slot: 'legs', muscle: 'Quads' },
  { id: 'leg-press', name: 'Leg Press', slot: 'legs', muscle: 'Quads' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', slot: 'legs', muscle: 'Hamstrings' },
  { id: 'leg-extension', name: 'Leg Extension', slot: 'legs', muscle: 'Quads' },
  { id: 'leg-curl', name: 'Leg Curl', slot: 'legs', muscle: 'Hamstrings' },
  { id: 'calf-raise', name: 'Calf Raise', slot: 'legs', muscle: 'Calves' },
  { id: 'hip-thrust', name: 'Hip Thrust', slot: 'legs', muscle: 'Glutes' },
]

export const DEFAULT_EXERCISES: Exercise[] = SEED.map((e) => ({
  ...e,
  isCustom: false,
  enabled: true,
}))
