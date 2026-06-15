// アプリ全体で使うドメイン型。

/** 種目のカテゴリ（種目カタログのタグ）。core は重量を扱わない体幹種目。 */
export type Category = 'push' | 'pull' | 'legs' | 'core'

/** トレーニング日の種別（分割の単位）。カテゴリに加え複合・休養を持つ。 */
export type Slot = Category | 'upper' | 'lower' | 'full' | 'rest'

/** メニュー生成時に内部で決まる強調方針（自動判定）。 */
export type GoalType = 'cut' | 'bulk' | 'maintain'

/** 種目カタログの1件。 */
export interface Exercise {
  id: string
  name: string
  /** push / pull / legs のいずれか。 */
  slot: Category
  /** 主働筋などの部位タグ（例: 胸・背中・肩・脚・腕）。 */
  muscle: string
  /** ユーザーが自分で追加した種目か。 */
  isCustom: boolean
  /** 提案対象に含めるか。 */
  enabled: boolean
  /** 現在のワーク重量(kg)。初期値はカタログで入力、漸進性過負荷で更新。 */
  weightKg?: number
  /** 毎日提示する種目か（例: プランク）。主に core 用。 */
  daily?: boolean
  /** 重量を使わない種目の目安（例: '45–60s', '12–15 reps'）。core 用。 */
  target?: string
}

/** 設定（単一レコード, id = 'app'）。 */
export interface Settings {
  id: 'app'
  /** 週のトレーニング回数（2..6）。これに応じて分割を自動構築する。 */
  weeklyFrequency: number
  /** 目標体脂肪率(%)。現在値との差で減量寄りかを判定。 */
  targetBodyFatPct?: number
  /** 目標筋肉量(kg)。現在値との差で筋肥大寄りかを判定。 */
  targetMuscleKg?: number
  /** 目標の達成期限（YYYY-MM-DD）。プラン要約の必要ペース算出に使う。 */
  targetDate?: string
  /** 曜日(0..6)→スロットの割り当て（weeklyFrequency から自動生成）。 */
  splitPattern: Slot[]
}

/** 当日メニューの1種目（チェック対象）。 */
export interface MenuItem {
  exerciseId: string
  name: string
  muscle: string
  /** push/pull/legs。重量の増分計算などに使う。 */
  category: Category
  targetSets: number
  /** 例: "8-12"。 */
  targetReps: string
  /** その日のターゲット重量(kg)。漸進性過負荷で提案、Today で +/- 調整可。 */
  weightKg?: number
  /** 毎日提示の体幹種目か（プランク等）。core ブロック用。 */
  daily?: boolean
  done: boolean
}

/** ある日の生成済みメニュー。date は 'YYYY-MM-DD'。 */
export interface DailyMenu {
  date: string
  slot: Slot
  items: MenuItem[]
  /** 体幹（コア）種目。プランクは毎日、休養日にも提示する。 */
  coreItems?: MenuItem[]
  /** その日の自動判定方針。 */
  emphasis?: GoalType
  /** 筋トレ部分の目安所要時間（分）。 */
  estMinutes?: number
  /** 休養日メッセージなど。 */
  note?: string
  generatedAt: number
}

/** 体組成の任意記録（不定期）。 */
export interface BodyMetric {
  date: string
  weightKg?: number
  bodyFatPct?: number
  /** 筋肉量(kg)。体組成計の値を手入力。 */
  muscleKg?: number
}
