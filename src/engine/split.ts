import type { Category, Slot } from '../types'
import { weekdayOf } from '../lib/date'

// 週次分割: 週の回数(2..6) から「曜日(0=日..6=土)→スロット」を自動構築する。
// 30分/回の枠を意識し、回数が少ない日は全身/上下、多い日は部位分割にする。

export const MIN_FREQ = 2
export const MAX_FREQ = 6

export function clampFreq(freq: number): number {
  return Math.max(MIN_FREQ, Math.min(MAX_FREQ, Math.round(freq)))
}

// 回数ごとの「トレーニングする曜日」（月始まりで分散）。
const TRAIN_WEEKDAYS: Record<number, number[]> = {
  2: [1, 4], // 月・木
  3: [1, 3, 5], // 月・水・金
  4: [1, 2, 4, 5], // 月・火・木・金
  5: [1, 2, 3, 4, 5], // 月〜金
  6: [1, 2, 3, 4, 5, 6], // 月〜土
}

// 回数ごとのスロット並び（トレーニング曜日に順番に割り当て）。
const SLOT_SEQUENCE: Record<number, Slot[]> = {
  2: ['full', 'full'],
  3: ['full', 'full', 'full'],
  4: ['upper', 'lower', 'upper', 'lower'],
  5: ['upper', 'lower', 'push', 'pull', 'legs'],
  6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
}

/** 週の回数からスロットパターン（長さ7, index=曜日）を生成する。 */
export function splitForFrequency(freq: number): Slot[] {
  const f = clampFreq(freq)
  const days = TRAIN_WEEKDAYS[f]
  const seq = SLOT_SEQUENCE[f]
  const pattern: Slot[] = new Array(7).fill('rest')
  days.forEach((wd, i) => {
    pattern[wd] = seq[i] ?? 'full'
  })
  return pattern
}

/** 指定日のスロットを splitPattern から引く。 */
export function slotForDate(iso: string, splitPattern: Slot[]): Slot {
  const wd = weekdayOf(iso)
  return splitPattern[wd] ?? 'rest'
}

/** スロットが種目を引くべきカテゴリ群。 */
export function categoriesForSlot(slot: Slot): Category[] {
  switch (slot) {
    case 'push':
    case 'pull':
    case 'legs':
      return [slot]
    case 'upper':
      return ['push', 'pull']
    case 'lower':
      return ['legs']
    case 'full':
      return ['push', 'pull', 'legs']
    case 'rest':
    default:
      return []
  }
}
