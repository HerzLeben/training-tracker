import type { Slot } from '../types'
import { weekdayOf } from '../lib/date'

// 週次分割: 曜日(0=日..6=土) → スロットの割り当てを扱う。
// 休養日を除く6日に push/pull/legs を 2 周ぶん割り当て、全身を週内でローテートする。

const CYCLE: Exclude<Slot, 'rest'>[] = ['push', 'pull', 'legs']

/**
 * 休養日を起点に、その翌日から push,pull,legs,push,pull,legs を並べた
 * 曜日→スロットの既定パターン（長さ7, index=曜日）を生成する。
 */
export function defaultSplitPattern(restWeekday: number): Slot[] {
  const pattern: Slot[] = new Array(7).fill('rest')
  let c = 0
  for (let i = 1; i <= 6; i++) {
    const wd = (restWeekday + i) % 7
    pattern[wd] = CYCLE[c % CYCLE.length]
    c++
  }
  pattern[restWeekday % 7] = 'rest'
  return pattern
}

/** 指定日のスロットを splitPattern から引く。 */
export function slotForDate(iso: string, splitPattern: Slot[]): Slot {
  const wd = weekdayOf(iso)
  return splitPattern[wd] ?? 'rest'
}
