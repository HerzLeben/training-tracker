// 純粋ロジック（分割・方針判定・メニュー組立・集計）の簡易検証。
// Node 25 の型ストリップ前提だが、拡張子なし import 解決のため esbuild でバンドルして実行する。
import { splitForFrequency, slotForDate, categoriesForSlot } from '../src/engine/split.ts'
import { buildMenu, buildCore, deriveEmphasis, latestBody, incrementFor } from '../src/engine/menuEngine.ts'
import { currentStreak, weekCalendar, completion, monthView, coreStreak } from '../src/lib/adherence.ts'
import { buildPlan } from '../src/lib/plan.ts'
import type { BodyMetric, Category, DailyMenu, Exercise, Settings } from '../src/types/index.ts'

let pass = 0
let fail = 0
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`  ok  ${name}`) }
  else { fail++; console.error(`FAIL  ${name}`) }
}

// --- 分割: 週の回数 → パターン ---
const p6 = splitForFrequency(6)
check('freq6: 日曜休養', p6[0] === 'rest')
check('freq6: 月=push', p6[1] === 'push')
check('freq6: 土=legs', p6[6] === 'legs')
check('freq6: 休養1日', p6.filter((s) => s === 'rest').length === 1)

const p3 = splitForFrequency(3)
check('freq3: 月水金がfull', p3[1] === 'full' && p3[3] === 'full' && p3[5] === 'full')
check('freq3: 休養4日', p3.filter((s) => s === 'rest').length === 4)

const p4 = splitForFrequency(4)
check('freq4: 月=upper, 火=lower', p4[1] === 'upper' && p4[2] === 'lower')

check('clamp: freq8→6相当', splitForFrequency(8).filter((s) => s !== 'rest').length === 6)
check('categoriesForSlot(full)=3カテゴリ', categoriesForSlot('full').length === 3)
check('categoriesForSlot(upper)=push,pull', JSON.stringify(categoriesForSlot('upper')) === JSON.stringify(['push', 'pull']))

// 2025-06-16 は月曜
check('freq6 月曜はpush', slotForDate('2025-06-16', p6) === 'push')

// --- 方針の自動判定 ---
const baseSettings = (over: Partial<Settings> = {}): Settings => ({
  id: 'app', weeklyFrequency: 6, splitPattern: p6, ...over,
})
check('目標なし→maintain', deriveEmphasis({ fat: 20, muscle: 30 }, baseSettings()) === 'maintain')
check('体脂肪が目標超→cut', deriveEmphasis({ fat: 25, muscle: 33 }, baseSettings({ targetBodyFatPct: 15, targetMuscleKg: 33 })) === 'cut')
check('筋肉が目標未満→bulk', deriveEmphasis({ fat: 15, muscle: 28 }, baseSettings({ targetBodyFatPct: 15, targetMuscleKg: 33 })) === 'bulk')
check('目標達成済→maintain', deriveEmphasis({ fat: 14, muscle: 34 }, baseSettings({ targetBodyFatPct: 15, targetMuscleKg: 33 })) === 'maintain')

check('latestBodyは項目ごと最新', (() => {
  const ms = [
    { date: '2025-06-10', bodyFatPct: 20 },
    { date: '2025-06-12', muscleKg: 30 },
    { date: '2025-06-14', bodyFatPct: 18 },
  ]
  const l = latestBody(ms)
  return l.fat === 18 && l.muscle === 30
})())

// --- メニュー組立 + 平日/休日の時間予算 ---
const mkEx = (id: string, cat: Category, w?: number): Exercise => ({ id, name: id.toUpperCase(), slot: cat, muscle: 'm', isCustom: false, enabled: true, weightKg: w })
const cols = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const byCat: Record<Category, Exercise[]> = {
  push: cols.map((x) => mkEx('p' + x, 'push')),
  pull: cols.map((x) => mkEx('l' + x, 'pull')),
  legs: cols.map((x) => mkEx('g' + x, 'legs')),
}
const corePool: Exercise[] = [
  { id: 'plank', name: 'Plank', slot: 'core', muscle: 'Core', isCustom: false, enabled: true, daily: true, target: '45–60s' },
  { id: 'cable-crunch', name: 'Cable Crunch', slot: 'core', muscle: 'Abs', isCustom: false, enabled: true, target: '15–20 reps' },
  { id: 'russian-twist', name: 'Russian Twist', slot: 'core', muscle: 'Obliques', isCustom: false, enabled: true, target: '20 reps' },
]
const args = (over: Record<string, unknown> = {}) => ({
  date: '2025-06-16', settings: baseSettings(), exercisesByCat: byCat, corePool, coreRotationIndex: 0,
  emphasis: 'maintain' as const, priorSameSlotCount: 0, lastSameSlotIds: [], recentAdherence: null,
  lastByExercise: {}, ...over,
})

// 2025-06-16 月曜=平日(27分), 2025-06-21 土曜=休日(42分)
const bulkWeekday = buildMenu(args({ emphasis: 'bulk' }) as never)
check('平日bulkは3種目', bulkWeekday.items.length === 3)
check('bulkは4セット', bulkWeekday.items[0].targetSets === 4)

const cutWeekday = buildMenu(args({ emphasis: 'cut' }) as never)
check('平日cutは3種目(27/7)', cutWeekday.items.length === 3)
const cutWeekend = buildMenu(args({ date: '2025-06-21', emphasis: 'cut' }) as never)
check('休日cutは6種目(42/7)', cutWeekend.items.length === 6)
check('休日>平日の種目数', cutWeekend.items.length > cutWeekday.items.length)
check('cutのレップ12-15', cutWeekday.items[0].targetReps === '12-15')

const low = buildMenu(args({ date: '2025-06-21', emphasis: 'cut', recentAdherence: 0.4 }) as never)
check('低達成で1種目減', low.items.length === 5)

// --- 重量と漸進性過負荷 ---
check('incrementは上半身2.5/脚5', incrementFor('push') === 2.5 && incrementFor('legs') === 5)
const allDone: Record<string, { weightKg?: number; done: boolean }> = {}
cols.forEach((x) => { allDone['p' + x] = { weightKg: 50, done: true } })
const prog = buildMenu(args({ emphasis: 'bulk', lastByExercise: allDone }) as never)
check('前回達成で+2.5kg提案', prog.items.every((i) => i.weightKg === 52.5))

const allFail: Record<string, { weightKg?: number; done: boolean }> = {}
cols.forEach((x) => { allFail['p' + x] = { weightKg: 50, done: false } })
const stay = buildMenu(args({ emphasis: 'bulk', lastByExercise: allFail }) as never)
check('未達は据え置き(50kg)', stay.items.every((i) => i.weightKg === 50))

// 履歴なし → 種目の初期重量を採用
const seeded: Record<Category, Exercise[]> = {
  push: cols.map((x) => mkEx('p' + x, 'push', 40)), pull: byCat.pull, legs: byCat.legs,
}
const init = buildMenu(args({ emphasis: 'bulk', exercisesByCat: seeded }) as never)
check('履歴なしは初期重量40kg', init.items.every((i) => i.weightKg === 40))
check('MenuItemにcategory付与', init.items[0].category === 'push')

// ローテで顔ぶれが変わる
const ra = buildMenu(args({ emphasis: 'bulk', priorSameSlotCount: 0 }) as never).items.map((i) => i.exerciseId).join(',')
const rb = buildMenu(args({ emphasis: 'bulk', priorSameSlotCount: 1 }) as never).items.map((i) => i.exerciseId).join(',')
check('ローテで顔ぶれ変化', ra !== rb)

// full スロットは複数カテゴリから採用
const full = buildMenu(args({ date: '2025-06-16', settings: baseSettings({ weeklyFrequency: 3, splitPattern: p3 }) }) as never)
const cats = new Set(full.items.map((i) => i.exerciseId[0])) // p/l/g
check('fullは複数部位から採用', full.slot === 'full' && cats.size >= 2)

// rest 日（コアは付くが筋トレ種目は0）
const rest = buildMenu(args({ date: '2025-06-15' }) as never)
check('休養は筋トレ0+note', rest.slot === 'rest' && rest.items.length === 0 && !!rest.note)

// --- 体幹（コア）ブロック ---
const coreTraining = buildCore('push', corePool, 0)
check('トレ日コアはdaily+追加1 = 2種目', coreTraining.length === 2)
check('コア先頭はプランク(daily)', coreTraining[0].exerciseId === 'plank' && coreTraining[0].daily === true)
check('プランクの目安は45–60s', coreTraining[0].targetReps === '45–60s')
const coreRest = buildCore('rest', corePool, 0)
check('休養日コアはdailyのみ(プランク)', coreRest.length === 1 && coreRest[0].exerciseId === 'plank')
// 回転で追加コアが変わる
const add0 = buildCore('push', corePool, 0).find((c) => !c.daily)?.exerciseId
const add1 = buildCore('push', corePool, 1).find((c) => !c.daily)?.exerciseId
check('追加コアは回転で変化', add0 !== add1)
// メニュー出力に coreItems が含まれる（休養日も）
check('rest にも coreItems', (rest.coreItems?.length ?? 0) === 1)
const train = buildMenu(args({ date: '2025-06-16' }) as never)
check('トレ日メニューに coreItems', (train.coreItems?.length ?? 0) === 2)

// コアのストリーク
const coreMenu = (date: string, plankDone: boolean): DailyMenu => ({
  date, slot: 'push', generatedAt: 0, items: [],
  coreItems: [{ exerciseId: 'plank', name: 'Plank', muscle: 'Core', category: 'core', targetSets: 3, targetReps: '45–60s', daily: true, done: plankDone }],
})
const coreDays = [coreMenu('2025-06-13', true), coreMenu('2025-06-14', true), coreMenu('2025-06-15', true)]
check('コアストリーク3(当日未確定で遡る)', coreStreak(coreDays, '2025-06-16') === 3)
// 06-14 が抜けるとそこで途切れる（06-13 は数えない）
check('抜けで途切れる', coreStreak([coreMenu('2025-06-13', true), coreMenu('2025-06-15', true)], '2025-06-15') === 1)

// --- 大きなプラン ---
const planMetrics: BodyMetric[] = [
  { date: '2025-05-18', bodyFatPct: 22, muscleKg: 30 },
  { date: '2025-06-15', bodyFatPct: 20, muscleKg: 31 },
]
// 期限は4週間後
const planSettings = baseSettings({ targetBodyFatPct: 15, targetMuscleKg: 33, targetDate: '2025-07-13' })
const plan = buildPlan(planSettings, planMetrics, '2025-06-15')
check('プランは目標あり', plan.hasTargets === true)
check('残り週は4', Math.round(plan.weeksLeft ?? 0) === 4)
check('体脂肪 残り5%', plan.fat?.remaining === 5)
check('体脂肪 必要1.25%/週', plan.fat?.requiredPerWeek === 1.25)
check('筋肉 残り2kg', plan.muscle?.remaining === 2)
// 実ペース: 体脂肪は4週で2%減=0.5/週 < 必要1.25 → behind
check('体脂肪はpace不足', plan.fat?.onTrack === false)
// 目標到達済みは onTrack=true
const reached = buildPlan(baseSettings({ targetBodyFatPct: 25 }), planMetrics, '2025-06-15')
check('到達済みはonTrack', reached.fat?.remaining === 0 && reached.fat?.onTrack === true)

// --- 集計 ---
const settings = baseSettings()
const mk = (date: string, doneCount: number, total: number): DailyMenu => ({
  date, slot: 'push', generatedAt: 0,
  items: Array.from({ length: total }, (_, i) => ({
    exerciseId: `x${i}`, name: 'x', muscle: 'm', targetSets: 3, targetReps: '10', done: i < doneCount,
  })),
})
const menus: DailyMenu[] = [mk('2025-06-12', 4, 4), mk('2025-06-13', 4, 4), mk('2025-06-14', 4, 4)]
check('ストリーク3(休養跨ぎ・当日未確定)', currentStreak(menus, settings, '2025-06-16') === 3)
check('completion=0.5', completion(mk('x', 2, 4)) === 0.5)
const cal = weekCalendar(menus, settings, 7, '2025-06-16')
check('週カレンダー7日', cal.length === 7)
check('日曜rest', cal.find((c) => c.date === '2025-06-15')?.status === 'rest')
check('木曜done', cal.find((c) => c.date === '2025-06-12')?.status === 'done')

// --- 月カレンダー ---
const mv = monthView(menus, settings, 2025, 5 /* June */, '2025-06-16')
check('月ビュー42セル', mv.cells.length === 42)
check('6/1は日曜→先頭セル', mv.cells[0]?.date === '2025-06-01')
check('6/30が含まれる', mv.cells.some((c) => c?.date === '2025-06-30'))
check('達成3日カウント', mv.doneCount === 3)
check('6/12セルはdone', mv.cells.find((c) => c?.date === '2025-06-12')?.status === 'done')
check('月末以降の余白はnull', mv.cells[mv.cells.length - 1] === null)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
