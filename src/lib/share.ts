import type { DailyMenu, MenuItem } from '../types'
import { completion } from './adherence'
import { addDays, todayISO, weekdayOf } from './date'
import { toPct } from './number'

// トレーナー共有用のテキスト要約（純関数・日本語）。LINE に貼られる前提で簡潔に。
// 種目名はユーザー/トレーナーが登録した表記をそのまま使う。

const JP_WD = ['日', '月', '火', '水', '木', '金', '土']
const jwd = (iso: string): string => JP_WD[weekdayOf(iso)] ?? '?'

function targetText(it: MenuItem): string {
  const base = `${it.targetSets}×${it.targetReps}`
  return it.targetWeightKg !== undefined ? `${base} @${it.targetWeightKg}kg` : base
}

function actualText(it: MenuItem): string {
  if (it.weightKg !== undefined && it.reps !== undefined) return `${it.weightKg}kg × ${it.reps}回`
  if (it.weightKg !== undefined) return `${it.weightKg}kg`
  if (it.reps !== undefined) return `${it.reps}回`
  return '—'
}

function itemLine(it: MenuItem): string {
  const mark = it.done ? '✅' : '⬜'
  return `${mark} ${it.name}  ${actualText(it)}  (目標 ${targetText(it)})`
}

function coreLine(it: MenuItem): string {
  return `${it.done ? '✅' : '⬜'} ${it.name} (${targetText(it)})`
}

/** その日のトレ結果をテキスト化。 */
export function formatSessionText(menu: DailyMenu): string {
  const lines: string[] = [`🏋️ ${menu.date} (${jwd(menu.date)})${menu.workoutName ? ' — ' + menu.workoutName : ''}`]

  for (const it of menu.items) lines.push(itemLine(it))

  const core = menu.coreItems ?? []
  if (core.length > 0) {
    lines.push('— 体幹 —')
    for (const it of core) lines.push(coreLine(it))
  }

  const c = completion(menu)
  if (c !== null) {
    const done = menu.items.filter((i) => i.done).length
    lines.push(`達成: ${done}/${menu.items.length} (${toPct(c)}%)`)
  }
  return lines.join('\n')
}

/** 直近7日の実施状況をまとめたテキスト。 */
export function formatWeeklyText(menus: DailyMenu[], today = todayISO()): string {
  const from = addDays(today, -6)
  const map = new Map(menus.map((m) => [m.date, m]))
  const lines: string[] = [`📅 週次サマリー (${from.slice(5)}–${today.slice(5)})`]

  const sessions: { pct: number }[] = []
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i)
    const menu = map.get(date)
    if (!menu || menu.items.length === 0) continue
    const c = completion(menu) ?? 0
    sessions.push({ pct: c })
    const done = menu.items.filter((it) => it.done).length
    lines.push(
      `${jwd(date)} ${date.slice(5)}  ${menu.workoutName ?? 'セッション'}  ${done}/${menu.items.length} (${toPct(c)}%)`,
    )
  }

  if (sessions.length === 0) {
    lines.push('今週はトレーニング記録がありません。')
  } else {
    const avg = sessions.reduce((a, s) => a + s.pct, 0) / sessions.length
    lines.push(`実施: ${sessions.length}回 ・ 平均達成: ${toPct(avg)}%`)
  }
  return lines.join('\n')
}
