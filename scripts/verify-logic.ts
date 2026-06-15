// 純粋ロジック（分割・方針判定・メニュー組立・集計）の簡易検証。
// Node 25 の型ストリップ前提だが、拡張子なし import 解決のため esbuild でバンドルして実行する。
import { splitForFrequency, slotForDate, categoriesForSlot } from '../src/engine/split.ts'
import { buildMenu, deriveEmphasis, latestBody } from '../src/engine/menuEngine.ts'
import { currentStreak, weekCalendar, completion, monthView } from '../src/lib/adherence.ts'
import type { Category, DailyMenu, Exercise, Settings } from '../src/types/index.ts'

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

// --- メニュー組立 + 30分予算 ---
const mkEx = (id: string, cat: Category): Exercise => ({ id, name: id.toUpperCase(), slot: cat, muscle: 'm', isCustom: false, enabled: true })
const byCat: Record<Category, Exercise[]> = {
  push: ['a', 'b', 'c', 'd', 'e'].map((x) => mkEx('p' + x, 'push')),
  pull: ['a', 'b', 'c', 'd', 'e'].map((x) => mkEx('l' + x, 'pull')),
  legs: ['a', 'b', 'c', 'd', 'e'].map((x) => mkEx('g' + x, 'legs')),
}
const args = (over: Record<string, unknown> = {}) => ({
  date: '2025-06-16', settings: baseSettings(), exercisesByCat: byCat,
  emphasis: 'maintain' as const, priorSameSlotCount: 0, lastSameSlotIds: [], recentAdherence: null, ...over,
})

const bulk = buildMenu(args({ emphasis: 'bulk' }) as never)
check('bulkは30分で3種目', bulk.items.length === 3)
check('bulkは4セット', bulk.items[0].targetSets === 4)
check('bulkのest≈27分', bulk.estMinutes === 27)

const cut = buildMenu(args({ emphasis: 'cut' }) as never)
check('cutは30分で4種目', cut.items.length === 4)
check('cutのレップ12-15', cut.items[0].targetReps === '12-15')

const low = buildMenu(args({ emphasis: 'cut', recentAdherence: 0.4 }) as never)
check('低達成で1種目減(3)', low.items.length === 3)

// ローテで顔ぶれが変わる
const r0 = buildMenu(args({ emphasis: 'bulk', priorSameSlotCount: 0 }) as never).items.map((i) => i.exerciseId).join(',')
const r1 = buildMenu(args({ emphasis: 'bulk', priorSameSlotCount: 1 }) as never).items.map((i) => i.exerciseId).join(',')
check('ローテで顔ぶれ変化', r0 !== r1)

// full スロットは複数カテゴリから採用
const full = buildMenu(args({ date: '2025-06-16', settings: baseSettings({ weeklyFrequency: 3, splitPattern: p3 }) }) as never)
const cats = new Set(full.items.map((i) => i.exerciseId[0])) // p/l/g
check('fullは複数部位から採用', full.slot === 'full' && cats.size >= 2)

// rest 日
const rest = buildMenu(args({ date: '2025-06-15' }) as never)
check('休養は種目0+note', rest.slot === 'rest' && rest.items.length === 0 && !!rest.note)

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
