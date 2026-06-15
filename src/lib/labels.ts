import type { GoalType, Slot } from '../types'

export const SLOT_LABEL: Record<Slot, string> = {
  push: 'Push (Chest / Shoulders / Triceps)',
  pull: 'Pull (Back / Biceps)',
  legs: 'Legs',
  core: 'Core',
  upper: 'Upper Body',
  lower: 'Lower Body',
  full: 'Full Body',
  rest: 'Rest',
}

export const SLOT_SHORT: Record<Slot, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
  upper: 'Upper',
  lower: 'Lower',
  full: 'Full',
  rest: 'Rest',
}

export const GOAL_LABEL: Record<GoalType, string> = {
  cut: 'Cut',
  bulk: 'Bulk',
  maintain: 'Maintain',
}
