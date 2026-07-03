import type { DailyMenu, MenuItem, SessionType } from '../types'
import { completion, trainedFraction } from './adherence'
import { addDays, todayISO, weekdayOf } from './date'
import { toPct } from './number'

// トレーナー共有用のテキスト要約（純関数・日本語）。LINE に貼られる前提で簡潔に。
// 種目名はユーザー/トレーナーが登録した表記をそのまま使う。

const JP_WD = ['日', '月', '火', '水', '木', '金', '土']
const jwd = (iso: string): string => JP_WD[weekdayOf(iso)] ?? '?'

const TYPE_LABEL: Record<SessionType, string> = {
  gym: 'ジム',
  personal: 'パーソナル',
  home: '自宅トレ',
  rest: '休養',
  skipped: 'サボり',
}
const TYPE_EMOJI: Record<SessionType, string> = {
  gym: '🏋️',
  personal: '🧑‍🏫',
  home: '🏠',
  rest: '🛌',
  skipped: '❌',
}
const typeOf = (m: DailyMenu): SessionType => m.type ?? 'gym'

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

/** その日のトレ結果をテキスト化。種別で内容を切り替える。 */
export function formatSessionText(menu: DailyMenu): string {
  const t = typeOf(menu)
  const head = `${TYPE_EMOJI[t]} ${menu.date} (${jwd(menu.date)})`

  if (t === 'rest' || t === 'skipped') {
    return `${head} — ${TYPE_LABEL[t]}`
  }
  if (t === 'personal' || t === 'home') {
    const lines = [`${head} — ${TYPE_LABEL[t]} ✅`]
    const core = menu.coreItems ?? []
    if (core.length > 0) {
      lines.push('— 体幹 —')
      for (const it of core) lines.push(coreLine(it))
    }
    return lines.join('\n')
  }

  // gym
  const lines: string[] = [`${head}${menu.workoutName ? ' — ' + menu.workoutName : ''}`]
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

/** 直近7日の状況をまとめたテキスト。 */
export function formatWeeklyText(menus: DailyMenu[], today = todayISO()): string {
  const from = addDays(today, -6)
  const map = new Map(menus.map((m) => [m.date, m]))
  const lines: string[] = [`📅 週次サマリー (${from.slice(5)}–${today.slice(5)})`]

  let trained = 0
  const fracs: number[] = []
  for (let i = 6; i >= 0; i--) {
    const date = addDays(today, -i)
    const menu = map.get(date)
    if (!menu) continue
    const t = typeOf(menu)
    const f = trainedFraction(menu)
    if (f !== null) {
      trained++
      fracs.push(f)
    }
    const detail =
      t === 'gym'
        ? `${menu.workoutName ?? 'ジム'} ${toPct(completion(menu) ?? 0)}%`
        : TYPE_LABEL[t]
    lines.push(`${TYPE_EMOJI[t]} ${jwd(date)} ${date.slice(5)}  ${detail}`)
  }

  if (lines.length === 1) {
    lines.push('今週は記録がありません。')
  } else {
    const avg = fracs.length ? toPct(fracs.reduce((a, b) => a + b, 0) / fracs.length) : 0
    lines.push(`トレーニング: ${trained}回 ・ 平均達成: ${avg}%`)
  }
  return lines.join('\n')
}
