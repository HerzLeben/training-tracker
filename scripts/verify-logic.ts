// 純粋ロジック（分割・メニュー組立・集計）の簡易検証。Node 25 の型ストリップで直接実行。
import { defaultSplitPattern, slotForDate } from '../src/engine/split.ts'
import { buildMenu } from '../src/engine/menuEngine.ts'
import { currentStreak, weekCalendar, completion } from '../src/lib/adherence.ts'
import type { DailyMenu, Exercise, Settings } from '../src/types/index.ts'

let pass = 0
let fail = 0
function check(name: string, cond: boolean) {
  if (cond) { pass++; console.log(`  ok  ${name}`) }
  else { fail++; console.error(`FAIL  ${name}`) }
}

// --- 分割: 日曜休みで Mon..Sat に push/pull/legs ×2 ---
const pat = defaultSplitPattern(0)
check('日曜が休養', pat[0] === 'rest')
check('月=push', pat[1] === 'push')
check('火=pull', pat[2] === 'pull')
check('水=legs', pat[3] === 'legs')
check('木=push', pat[4] === 'push')
check('土=legs', pat[6] === 'legs')
check('休養は1日だけ', pat.filter((s) => s === 'rest').length === 1)

// 2025-06-15 は日曜
check('2025-06-15は休養(日)', slotForDate('2025-06-15', pat) === 'rest')
check('2025-06-16はpush(月)', slotForDate('2025-06-16', pat) === 'push')

const settings: Settings = { id: 'app', goalType: 'bulk', restWeekday: 0, splitPattern: pat }

// --- メニュー組立 ---
const pushPool: Exercise[] = [
  { id: 'a', name: 'A', slot: 'push', muscle: '胸', isCustom: false, enabled: true },
  { id: 'b', name: 'B', slot: 'push', muscle: '肩', isCustom: false, enabled: true },
  { id: 'c', name: 'C', slot: 'push', muscle: '三頭', isCustom: false, enabled: true },
  { id: 'd', name: 'D', slot: 'push', muscle: '胸', isCustom: false, enabled: true },
  { id: 'e', name: 'E', slot: 'push', muscle: '肩', isCustom: false, enabled: true },
]

// bulk(baseCount=4) かつ達成率null → 4種目
const m1 = buildMenu({ date: '2025-06-16', settings, slotPool: pushPool, priorSameSlotCount: 0, lastSameSlotIds: [], recentAdherence: null })
check('bulkは4種目', m1.items.length === 4)
check('bulkは4セット', m1.items[0].targetSets === 4)
check('レップ帯8-12', m1.items[0].targetReps === '8-12')

// 直近達成率が低い → 1種目減
const mLow = buildMenu({ date: '2025-06-16', settings, slotPool: pushPool, priorSameSlotCount: 0, lastSameSlotIds: [], recentAdherence: 0.4 })
check('低達成で種目減(3)', mLow.items.length === 3)

// 直近達成率が高い → 1種目増(5)
const mHigh = buildMenu({ date: '2025-06-16', settings, slotPool: pushPool, priorSameSlotCount: 0, lastSameSlotIds: [], recentAdherence: 0.95 })
check('高達成で種目増(5)', mHigh.items.length === 5)

// ローテ: priorSameSlotCount を変えると顔ぶれがずれる
const r0 = buildMenu({ date: '2025-06-16', settings, slotPool: pushPool, priorSameSlotCount: 0, lastSameSlotIds: [], recentAdherence: null }).items.map((i) => i.exerciseId).join(',')
const r1 = buildMenu({ date: '2025-06-19', settings, slotPool: pushPool, priorSameSlotCount: 1, lastSameSlotIds: [], recentAdherence: null }).items.map((i) => i.exerciseId).join(',')
check('ローテで顔ぶれが変化', r0 !== r1)

// rest 日は種目なし＋note
const mRest = buildMenu({ date: '2025-06-15', settings, slotPool: [], priorSameSlotCount: 0, lastSameSlotIds: [], recentAdherence: null })
check('休養は種目0', mRest.items.length === 0 && mRest.slot === 'rest' && !!mRest.note)

// --- 集計: ストリーク/カレンダー ---
const mk = (date: string, doneCount: number, total: number): DailyMenu => ({
  date, slot: 'push', generatedAt: 0,
  items: Array.from({ length: total }, (_, i) => ({
    exerciseId: `x${i}`, name: 'x', muscle: 'm', targetSets: 3, targetReps: '10', done: i < doneCount,
  })),
})

// 木金土(2025-06-12,13,14)達成、日(15)は休養 → today=月16未達(未確定)
const menus: DailyMenu[] = [mk('2025-06-12', 4, 4), mk('2025-06-13', 4, 4), mk('2025-06-14', 4, 4)]
const streak = currentStreak(menus, settings, '2025-06-16')
check('ストリークは3(休養を跨ぐ・当日未確定)', streak === 3)

check('completionは0.5', completion(mk('x', 2, 4)) === 0.5)
const cal = weekCalendar(menus, settings, 7, '2025-06-16')
check('週カレンダーは7日', cal.length === 7)
check('日曜セルはrest', cal.find((c) => c.date === '2025-06-15')?.status === 'rest')
check('木曜セルはdone', cal.find((c) => c.date === '2025-06-12')?.status === 'done')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail === 0 ? 0 : 1)
