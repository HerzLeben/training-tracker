import type { GoalType, Slot } from '../types'

export const SLOT_LABEL: Record<Slot, string> = {
  push: 'プッシュ（胸・肩・三頭）',
  pull: 'プル（背中・二頭）',
  legs: 'レッグ（脚）',
  rest: '休養',
}

export const SLOT_SHORT: Record<Slot, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  rest: '休',
}

export const GOAL_LABEL: Record<GoalType, string> = {
  cut: '減量',
  bulk: '筋肥大',
  maintain: '維持',
}
