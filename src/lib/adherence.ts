import type { DailyMenu, Settings, Slot } from '../types'
import { slotForDate } from '../engine/split'
import { addDays, todayISO } from './date'

// 達成率・ストリーク・週カレンダーの集計ロジック。

export const ACHIEVED_THRESHOLD = 0.8

/** メニュー1日の達成率（0..1）。種目なし（休養等）は null。 */
export function completion(menu: DailyMenu | undefined): number | null {
  if (!menu || menu.items.length === 0) return null
  return menu.items.filter((i) => i.done).length / menu.items.length
}

export function isAchieved(menu: DailyMenu | undefined): boolean {
  const c = completion(menu)
  return c !== null && c >= ACHIEVED_THRESHOLD
}

export type DayStatus = 'done' | 'partial' | 'missed' | 'rest' | 'future'

export interface DayCell {
  date: string
  weekday: number
  slot: Slot
  status: DayStatus
  pct: number | null
}

function statusFor(date: string, slot: Slot, menu: DailyMenu | undefined, today: string): DayStatus {
  if (slot === 'rest') return 'rest'
  if (date > today) return 'future'
  const c = completion(menu)
  if (c === null) return 'missed'
  if (c >= ACHIEVED_THRESHOLD) return 'done'
  if (c > 0) return 'partial'
  return 'missed'
}

const byDate = (menus: DailyMenu[]): Map<string, DailyMenu> =>
  new Map(menus.map((m) => [m.date, m]))

/** 今日を末尾とする直近 days 日の各日ステータス。 */
export function weekCalendar(
  menus: DailyMenu[],
  settings: Settings,
  days = 7,
  today = todayISO(),
): DayCell[] {
  const map = byDate(menus)
  const cells: DayCell[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(today, -i)
    const slot = slotForDate(date, settings.splitPattern)
    const menu = map.get(date)
    cells.push({
      date,
      weekday: new Date(date).getDay(),
      slot,
      status: statusFor(date, slot, menu, today),
      pct: completion(menu),
    })
  }
  return cells
}

/**
 * 現在のストリーク（達成が続いた連続トレーニング日数）。
 * 休養日は途切れさせず、未達のトレーニング日で途切れる。
 * 当日がトレーニング日でまだ未達の場合は「未確定」として数えずに遡る。
 */
export function currentStreak(
  menus: DailyMenu[],
  settings: Settings,
  today = todayISO(),
): number {
  const map = byDate(menus)
  let streak = 0
  for (let i = 0; i < 400; i++) {
    const date = addDays(today, -i)
    const slot = slotForDate(date, settings.splitPattern)
    if (slot === 'rest') continue
    const achieved = isAchieved(map.get(date))
    if (achieved) {
      streak++
    } else if (i === 0) {
      continue // 当日はまだ未確定 → 途切れさせない
    } else {
      break
    }
  }
  return streak
}

/** トレーニング日の日次達成率の時系列（チャート用）。 */
export function adherenceSeries(menus: DailyMenu[]): { date: string; pct: number }[] {
  return menus
    .filter((m) => m.items.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ date: m.date, pct: Math.round((completion(m) ?? 0) * 100) }))
}

/** 直近 windowDays 日のトレーニング日平均達成率（0..100）。データなしは null。 */
export function overallRate(
  menus: DailyMenu[],
  windowDays = 30,
  today = todayISO(),
): number | null {
  const from = addDays(today, -(windowDays - 1))
  const inWindow = menus.filter((m) => m.items.length > 0 && m.date >= from && m.date <= today)
  if (inWindow.length === 0) return null
  const sum = inWindow.reduce((acc, m) => acc + (completion(m) ?? 0), 0)
  return Math.round((sum / inWindow.length) * 100)
}
