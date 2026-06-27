import type { DailyMenu } from '../types'
import { addDays, todayISO, toISODate, weekdayOf } from './date'
import { toPct } from './number'

// 達成率・ストリーク・カレンダーの集計ロジック。
// メニューはトレーナー作成のため「休養日」概念は持たず、セッションの有無と達成で判定する。

export const ACHIEVED_THRESHOLD = 0.8

/** メニュー1日の達成率（0..1）。種目なしは null。 */
export function completion(menu: DailyMenu | undefined): number | null {
  if (!menu || menu.items.length === 0) return null
  return menu.items.filter((i) => i.done).length / menu.items.length
}

export function isAchieved(menu: DailyMenu | undefined): boolean {
  const c = completion(menu)
  return c !== null && c >= ACHIEVED_THRESHOLD
}

/** done=達成 / partial=実施したが未達 / none=セッション無し / future=未来。 */
export type DayStatus = 'done' | 'partial' | 'none' | 'future'

export interface DayCell {
  date: string
  weekday: number
  status: DayStatus
  pct: number | null
}

function statusFor(date: string, menu: DailyMenu | undefined, today: string): DayStatus {
  if (date > today) return 'future'
  const c = completion(menu)
  if (c === null) return 'none'
  if (c >= ACHIEVED_THRESHOLD) return 'done'
  return 'partial'
}

const byDate = (menus: DailyMenu[]): Map<string, DailyMenu> =>
  new Map(menus.map((m) => [m.date, m]))

/** 1日分のカレンダーセルを組み立てる。 */
function buildCell(date: string, map: Map<string, DailyMenu>, today: string): DayCell {
  const menu = map.get(date)
  return { date, weekday: weekdayOf(date), status: statusFor(date, menu, today), pct: completion(menu) }
}

/** 今日を末尾とする直近 days 日の各日ステータス。 */
export function weekCalendar(menus: DailyMenu[], days = 7, today = todayISO()): DayCell[] {
  const map = byDate(menus)
  const cells: DayCell[] = []
  for (let i = days - 1; i >= 0; i--) {
    cells.push(buildCell(addDays(today, -i), map, today))
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
  sessionCount: number
}

/** 1か月分のカレンダーセル（6週×7列）を組み立てる。 */
export function monthView(
  menus: DailyMenu[],
  year: number,
  month: number,
  today = todayISO(),
): MonthView {
  const map = byDate(menus)
  const startPad = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (MonthCell | null)[] = []
  let doneCount = 0
  let sessionCount = 0

  for (let i = 0; i < 42; i++) {
    const dayNum = i - startPad + 1
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push(null)
      continue
    }
    const date = toISODate(new Date(year, month, dayNum))
    const cell = buildCell(date, map, today)
    if (cell.status === 'done' || cell.status === 'partial') sessionCount++
    if (cell.status === 'done') doneCount++
    cells.push({ ...cell, day: dayNum })
  }
  return { year, month, cells, doneCount, sessionCount }
}

/** 1日の評価。achieved=継続, neutral=スキップ, failed=途切れ。 */
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
 * 現在のストリーク（達成セッションが続いた日数）。
 * セッションの無い日は途切れさせず、実施したが未達の日で途切れる。
 */
export function currentStreak(menus: DailyMenu[], today = todayISO()): number {
  const map = byDate(menus)
  return walkStreak(today, (date) => {
    const c = completion(map.get(date))
    if (c === null) return 'neutral' // セッション無し（休養扱い）
    return c >= ACHIEVED_THRESHOLD ? 'achieved' : 'failed'
  })
}

/** デイリーコア（プランク等）の連続達成日数。 */
export function coreStreak(menus: DailyMenu[], today = todayISO()): number {
  const map = byDate(menus)
  return walkStreak(today, (date) => {
    const daily = map.get(date)?.coreItems?.filter((c) => c.daily) ?? []
    return daily.length > 0 && daily.every((c) => c.done) ? 'achieved' : 'failed'
  })
}

/** 実施日（item を持つ）の日次達成率の時系列（チャート用）。 */
export function adherenceSeries(menus: DailyMenu[]): { date: string; pct: number }[] {
  return menus
    .filter((m) => m.items.length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ date: m.date, pct: toPct(completion(m) ?? 0) }))
}

/** 直近 windowDays 日の実施日平均達成率（0..100）。データなしは null。 */
export function overallRate(menus: DailyMenu[], windowDays = 30, today = todayISO()): number | null {
  const from = addDays(today, -(windowDays - 1))
  const inWindow = menus.filter((m) => m.items.length > 0 && m.date >= from && m.date <= today)
  if (inWindow.length === 0) return null
  const sum = inWindow.reduce((acc, m) => acc + (completion(m) ?? 0), 0)
  return toPct(sum / inWindow.length)
}
