import type { DailyMenu, SessionType } from '../types'
import { addDays, todayISO, toISODate, weekdayOf } from './date'
import { toPct } from './number'

// 達成率・ストリーク・カレンダーの集計。日の種別（gym/personal/home/rest/skipped）で判定する。

export const ACHIEVED_THRESHOLD = 0.8

/** gym メニュー1日の達成率（0..1）。種目なし・不正データは null。 */
export function completion(menu: DailyMenu | undefined): number | null {
  if (!menu || !Array.isArray(menu.items) || menu.items.length === 0) return null
  return menu.items.filter((i) => i.done).length / menu.items.length
}

/** 記録の種別（未設定の既存データは gym 扱い、記録なしは undefined）。 */
function typeOf(menu: DailyMenu | undefined): SessionType | undefined {
  if (!menu) return undefined
  return menu.type ?? 'gym'
}

/**
 * その日の「達成度」(0..1)。トレーニングした日のみ数値、そうでなければ null。
 * personal/home=1、gym=種目達成率、rest/skipped/記録なし=null。
 */
export function trainedFraction(menu: DailyMenu | undefined): number | null {
  const t = typeOf(menu)
  if (t === undefined || t === 'rest' || t === 'skipped') return null
  if (t === 'personal' || t === 'home') return 1
  return completion(menu) // gym
}

/** done=達成 / partial=未達 / rest=休養 / skipped=サボった / none=記録なし / future=未来。 */
export type DayStatus = 'done' | 'partial' | 'rest' | 'skipped' | 'none' | 'future'

export interface DayCell {
  date: string
  weekday: number
  status: DayStatus
  pct: number | null
}

function statusFor(date: string, menu: DailyMenu | undefined, today: string): DayStatus {
  if (date > today) return 'future'
  const t = typeOf(menu)
  if (t === undefined) return 'none'
  if (t === 'rest') return 'rest'
  if (t === 'skipped') return 'skipped'
  if (t === 'personal' || t === 'home') return 'done'
  const c = completion(menu) // gym
  if (c === null) return 'none'
  return c >= ACHIEVED_THRESHOLD ? 'done' : 'partial'
}

const byDate = (menus: DailyMenu[]): Map<string, DailyMenu> =>
  new Map(menus.map((m) => [m.date, m]))

/** 1日分のカレンダーセルを組み立てる。 */
function buildCell(date: string, map: Map<string, DailyMenu>, today: string): DayCell {
  const menu = map.get(date)
  return { date, weekday: weekdayOf(date), status: statusFor(date, menu, today), pct: trainedFraction(menu) }
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
 * 現在のストリーク（トレーニングした日が続いた数）。
 * done・partial（＝トレした日）=継続 / rest・skipped=途切れる / 記録なし=中立。
 */
export function currentStreak(menus: DailyMenu[], today = todayISO()): number {
  const map = byDate(menus)
  return walkStreak(today, (date) => {
    const s = statusFor(date, map.get(date), today)
    if (s === 'done' || s === 'partial') return 'achieved' // トレした日は継続
    if (s === 'none') return 'neutral'
    return 'failed' // rest / skipped
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

/** トレーニングした日の達成率の時系列（チャート用）。 */
export function adherenceSeries(menus: DailyMenu[]): { date: string; pct: number }[] {
  return menus
    .map((m) => ({ date: m.date, f: trainedFraction(m) }))
    .filter((x): x is { date: string; f: number } => x.f !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((x) => ({ date: x.date, pct: toPct(x.f) }))
}

/** 直近 windowDays 日のトレーニング日平均達成率（0..100）。データなしは null。 */
export function overallRate(menus: DailyMenu[], windowDays = 30, today = todayISO()): number | null {
  const from = addDays(today, -(windowDays - 1))
  const fracs = menus
    .filter((m) => m.date >= from && m.date <= today)
    .map((m) => trainedFraction(m))
    .filter((f): f is number => f !== null)
  if (fracs.length === 0) return null
  return toPct(fracs.reduce((a, b) => a + b, 0) / fracs.length)
}
