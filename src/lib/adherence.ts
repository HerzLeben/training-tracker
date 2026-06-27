import type { DailyMenu, Settings, Slot } from '../types'
import { slotForDate } from '../engine/split'
import { addDays, todayISO, toISODate, weekdayOf } from './date'
import { toPct } from './number'

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

/** 1日分のカレンダーセルを組み立てる。 */
function buildCell(
  date: string,
  settings: Settings,
  map: Map<string, DailyMenu>,
  today: string,
): DayCell {
  const slot = slotForDate(date, settings.splitPattern)
  const menu = map.get(date)
  return { date, weekday: weekdayOf(date), slot, status: statusFor(date, slot, menu, today), pct: completion(menu) }
}

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
    cells.push(buildCell(addDays(today, -i), settings, map, today))
  }
  return cells
}

export interface MonthCell extends DayCell {
  day: number
}

export interface MonthView {
  year: number
  month: number // 0-based
  cells: (MonthCell | null)[] // 42 cells (6 weeks × 7); null = padding
  doneCount: number
  trainingCount: number
}

/** Build a month's worth of calendar cells (6 weeks × 7 columns). */
export function monthView(
  menus: DailyMenu[],
  settings: Settings,
  year: number,
  month: number,
  today = todayISO(),
): MonthView {
  const map = byDate(menus)
  const startPad = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (MonthCell | null)[] = []
  let doneCount = 0
  let trainingCount = 0

  for (let i = 0; i < 42; i++) {
    const dayNum = i - startPad + 1
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push(null)
      continue
    }
    const date = toISODate(new Date(year, month, dayNum))
    const cell = buildCell(date, settings, map, today)
    if (cell.slot !== 'rest' && date <= today) trainingCount++
    if (cell.status === 'done') doneCount++
    cells.push({ ...cell, day: dayNum })
  }
  return { year, month, cells, doneCount, trainingCount }
}

/** 1日の評価。achieved=継続, neutral=スキップ（休養等）, failed=途切れ。 */
type DayEval = 'achieved' | 'neutral' | 'failed'

/**
 * 今日から過去へ遡り、連続達成日数を数える共通ロジック。
 * neutral はストリークを途切れさせず、failed で途切れる。
 * ただし当日(i=0)の failed は「未確定」として途切れさせない。
 */
function walkStreak(today: string, evalDay: (date: string) => DayEval): number {
  let streak = 0
  for (let i = 0; i < 400; i++) {
    const r = evalDay(addDays(today, -i))
    if (r === 'achieved') streak++
    else if (r === 'neutral') continue
    else if (i === 0) continue // 当日はまだ未確定
    else break
  }
  return streak
}

/**
 * 現在のストリーク（達成が続いた連続トレーニング日数）。
 * 休養日は途切れさせず、未達のトレーニング日で途切れる。
 */
export function currentStreak(
  menus: DailyMenu[],
  settings: Settings,
  today = todayISO(),
): number {
  const map = byDate(menus)
  return walkStreak(today, (date) => {
    if (slotForDate(date, settings.splitPattern) === 'rest') return 'neutral'
    return isAchieved(map.get(date)) ? 'achieved' : 'failed'
  })
}

/**
 * デイリーコア（プランク等）の連続達成日数。
 * その日の daily コアが全て done なら継続。
 */
export function coreStreak(menus: DailyMenu[], today = todayISO()): number {
  const map = byDate(menus)
  return walkStreak(today, (date) => {
    const daily = map.get(date)?.coreItems?.filter((c) => c.daily) ?? []
    return daily.length > 0 && daily.every((c) => c.done) ? 'achieved' : 'failed'
  })
}

/** トレーニング日の日次達成率の時系列（チャート用）。 */
export function adherenceSeries(menus: DailyMenu[]): { date: string; pct: number }[] {
  return menus
    .filter((m) => m.items.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ date: m.date, pct: toPct(completion(m) ?? 0) }))
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
  return toPct(sum / inWindow.length)
}
