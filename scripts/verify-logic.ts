// 純粋ロジック（セッション組み立て・集計・共有テキスト・プラン）の簡易検証。
// esbuild でバンドルして node 実行する。
import { buildSession } from '../src/engine/session.ts'
import {
  completion,
  currentStreak,
  coreStreak,
  weekCalendar,
  monthView,
} from '../src/lib/adherence.ts'
import { formatSessionText, formatWeeklyText } from '../src/lib/share.ts'
import { parseMetricsCSV } from '../src/lib/csv.ts'
import { SAMPLE_WORKOUTS } from '../src/data/sampleProgram.ts'
import { buildPlan } from '../src/lib/plan.ts'
import type { BodyMetric, DailyMenu, PrescribedExercise, Settings, Workout } from '../src/types/index.ts'

let pass = 0
let fail = 0
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`  ok  ${name}`) }
  else { fail++; console.error(`FAIL  ${name}`) }
}

// --- buildSession ---
const workout: Workout = {
  id: 'w1',
  name: 'Push',
  items: [
    { id: 'a', name: 'Bench', muscle: 'Chest', category: 'push', targetSets: 3, targetReps: '10', targetWeightKg: 60 },
    { id: 'b', name: 'OHP', targetSets: 3, targetReps: '12' },
  ],
}
const dailyCore: PrescribedExercise[] = [
  { id: 'plank', name: 'Plank', category: 'core', targetSets: 3, targetReps: '45–60s' },
]
const sess = buildSession('2026-06-27', workout, dailyCore, 0)
check('セッション種目数2', sess.items.length === 2)
check('workoutName を引き継ぐ', sess.workoutName === 'Push')
check('目標重量を実績初期値に', sess.items[0].weightKg === 60)
check('自重種目は重量なし', sess.items[1].weightKg === undefined)
check('実績回数は空', sess.items[0].reps === undefined)
check('未達成で開始', sess.items.every((i) => !i.done))
check('コアは daily フラグ付き1件', (sess.coreItems?.length ?? 0) === 1 && sess.coreItems![0].daily === true)

// --- adherence ---
const mk = (date: string, done: number, total: number, plankDone?: boolean): DailyMenu => ({
  date, workoutName: 'W', generatedAt: 0,
  items: Array.from({ length: total }, (_, i) => ({
    exerciseId: `x${i}`, name: 'X', targetSets: 3, targetReps: '10', done: i < done,
  })),
  coreItems: plankDone === undefined ? undefined : [
    { exerciseId: 'plank', name: 'Plank', category: 'core', targetSets: 3, targetReps: '45–60s', daily: true, done: plankDone },
  ],
})

check('completion=0.5', completion(mk('x', 2, 4)) === 0.5)
check('completion(空)=null', completion(mk('x', 0, 0)) === null)

const week = weekCalendar([mk('2026-06-25', 3, 3), mk('2026-06-26', 1, 3), mk('2026-06-27', 3, 3)], 7, '2026-06-27')
check('週カレンダー7日', week.length === 7)
check('完了日=done', week.find((c) => c.date === '2026-06-25')?.status === 'done')
check('一部=partial', week.find((c) => c.date === '2026-06-26')?.status === 'partial')
check('セッション無し=none', week.find((c) => c.date === '2026-06-24')?.status === 'none')

// ストリーク: セッション無しの日は途切れない／当日未確定で遡る
const gapMenus = [mk('2026-06-24', 3, 3), mk('2026-06-26', 3, 3), mk('2026-06-27', 3, 3)]
check('ストリーク3(抜け日は休養扱い)', currentStreak(gapMenus, '2026-06-27') === 3)
// 前日の未達で途切れる
check('未達で途切れ', currentStreak([mk('2026-06-25', 3, 3), mk('2026-06-26', 1, 3), mk('2026-06-27', 3, 3)], '2026-06-27') === 1)
// コアストリーク
check('コアストリーク3', coreStreak([mk('2026-06-25', 3, 3, true), mk('2026-06-26', 3, 3, true), mk('2026-06-27', 3, 3, true)], '2026-06-27') === 3)

// 月ビュー
const mv = monthView(gapMenus, 2026, 5 /* June */, '2026-06-27')
check('月ビュー42セル', mv.cells.length === 42)
check('実施3日', mv.sessionCount === 3)
check('達成3日', mv.doneCount === 3)

// --- 共有テキスト ---
const shareSession: DailyMenu = {
  date: '2026-06-27', workoutName: 'Push', generatedAt: 0,
  items: [
    { exerciseId: 'a', name: 'Bench', targetSets: 3, targetReps: '10', targetWeightKg: 60, weightKg: 62.5, reps: 10, done: true },
    { exerciseId: 'b', name: 'OHP', targetSets: 3, targetReps: '12', weightKg: 20, reps: 12, done: false },
  ],
  coreItems: [{ exerciseId: 'plank', name: 'Plank', targetSets: 3, targetReps: '45–60s', daily: true, done: true }],
}
const st = formatSessionText(shareSession)
check('共有: ワークアウト名', st.includes('Push'))
check('共有: 実績(重量×回数)', st.includes('62.5kg × 10回'))
check('共有: 目標表記', st.includes('目標 3×10 @60kg'))
check('共有: コア行', st.includes('Plank'))
check('共有: 曜日(日本語)', st.includes('(土)'))
check('共有: 達成率', st.includes('達成: 1/2 (50%)'))

const wt = formatWeeklyText(gapMenus, '2026-06-27')
check('週共有: 見出し', wt.includes('週次サマリー'))
check('週共有: 件数', wt.includes('実施: 3回'))
check('週共有: 平均', wt.includes('平均達成: 100%'))

// --- プラン（変更なし） ---
const planSettings = (over: Partial<Settings> = {}): Settings => ({ id: 'app', dailyCore: [], ...over })
const planMetrics: BodyMetric[] = [
  { date: '2026-05-30', bodyFatPct: 22, muscleKg: 30 },
  { date: '2026-06-27', bodyFatPct: 20, muscleKg: 31 },
]
const plan = buildPlan(planSettings({ targetBodyFatPct: 15, targetMuscleKg: 33, targetDate: '2026-07-25' }), planMetrics, '2026-06-27')
check('プラン: 目標あり', plan.hasTargets === true)
check('プラン: 残り週4', Math.round(plan.weeksLeft ?? 0) === 4)
check('プラン: 体脂肪 残り5', plan.fat?.remaining === 5)
check('プラン: 筋肉 残り2', plan.muscle?.remaining === 2)

// --- CSV 取り込み ---
const csv = 'date,weightKg,bodyFatPct,muscleKg\n2026-06-01,70.5,18.2,32.1\n2026-06-08,70.0,,32.4\n,,,\n2026-06-15,69.4,17.5,'
const parsed = parseMetricsCSV(csv)
check('CSV: 3行取り込み', parsed.length === 3)
check('CSV: 値の解釈', parsed[0].weightKg === 70.5 && parsed[0].bodyFatPct === 18.2 && parsed[0].muscleKg === 32.1)
check('CSV: 空セルは undefined', parsed[1].bodyFatPct === undefined && parsed[1].muscleKg === 32.4)
check('CSV: 末尾欠損OK', parsed[2].date === '2026-06-15' && parsed[2].muscleKg === undefined)
check('CSV: 列順・別名に追従', (() => {
  const p = parseMetricsCSV('Date,Muscle,Weight\n2026-07-01,33,71')
  return p.length === 1 && p[0].muscleKg === 33 && p[0].weightKg === 71
})())
let threw = false
try { parseMetricsCSV('weight,fat\n70,18') } catch { threw = true }
check('CSV: date 列なしはエラー', threw)

// --- トレーナープログラム（6メニュー） ---
const byId = Object.fromEntries(SAMPLE_WORKOUTS.map((w) => [w.id, w]))
check('プログラムは6メニュー', SAMPLE_WORKOUTS.length === 6)
check('6日: 胸/肩/二頭/三頭/足/背中', ['w-chest','w-shoulder','w-biceps','w-triceps','w-legs','w-back'].every((id) => byId[id]))
check('二頭は5種目', byId['w-biceps'].items.length === 5)
check('アームカール重め=2×10@30', (() => {
  const it = byId['w-biceps'].items[0]
  return it.targetSets === 2 && it.targetReps === '10' && it.targetWeightKg === 30
})())
check('背中ラットプルダウン@37.5', byId['w-back'].items[0].targetWeightKg === 37.5)
check('胸スミスは重量なし', byId['w-chest'].items[0].targetWeightKg === undefined)
check('全種目id一意', (() => {
  const ids = SAMPLE_WORKOUTS.flatMap((w) => w.items.map((i) => i.id))
  return new Set(ids).size === ids.length
})())
// buildSession でセッション化できる
const sess2 = buildSession('2026-06-27', byId['w-chest'], dailyCore, 0)
check('胸セッション: 目標重量を実績初期値に', sess2.items[1].weightKg === 12)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
