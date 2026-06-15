// アプリ全体で使うドメイン型。

/** トレーニングのスロット（週内でローテートする分割の単位）。 */
export type Slot = 'push' | 'pull' | 'legs' | 'rest'

/** 目標タイプ。メニューのセット/レップ帯に影響する。 */
export type GoalType = 'cut' | 'bulk' | 'maintain'

/** 種目カタログの1件。 */
export interface Exercise {
  id: string
  name: string
  /** push / pull / legs のいずれか（rest には種目を持たない）。 */
  slot: Exclude<Slot, 'rest'>
  /** 主働筋などの部位タグ（例: 胸・背中・肩・脚・腕）。 */
  muscle: string
  /** ユーザーが自分で追加した種目か。 */
  isCustom: boolean
  /** 提案対象に含めるか。 */
  enabled: boolean
}

/** 設定（単一レコード, id = 'app'）。 */
export interface Settings {
  id: 'app'
  goalType: GoalType
  /** 休養日の曜日（0=日 .. 6=土）。 */
  restWeekday: number
  /** 曜日(0..6)→スロットの割り当て。休養日は 'rest'。 */
  splitPattern: Slot[]
}

/** 当日メニューの1種目（チェック対象）。 */
export interface MenuItem {
  exerciseId: string
  name: string
  muscle: string
  targetSets: number
  /** 例: "8-12"。 */
  targetReps: string
  done: boolean
}

/** ある日の生成済みメニュー。date は 'YYYY-MM-DD'。 */
export interface DailyMenu {
  date: string
  slot: Slot
  items: MenuItem[]
  /** 休養日メッセージなど。 */
  note?: string
  generatedAt: number
}

/** 体重・体脂肪の任意記録（不定期）。 */
export interface BodyMetric {
  date: string
  weightKg?: number
  bodyFatPct?: number
}
