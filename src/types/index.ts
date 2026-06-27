// アプリ全体で使うドメイン型。
// メニューはトレーナーが作成（プログラム）し、アプリは結果を記録して LINE で共有する。

/** 種目のカテゴリ（任意のタグ）。core は体幹（重量を扱わない想定）。 */
export type Category = 'push' | 'pull' | 'legs' | 'core'

/** プログラム上の処方（トレーナー指定の目標）。 */
export interface PrescribedExercise {
  id: string
  name: string
  muscle?: string
  category?: Category
  targetSets: number
  /** 例: "8-12" / "10"。 */
  targetReps: string
  /** 目標重量(kg)。自重種目は未設定。 */
  targetWeightKg?: number
}

/** プログラムの1メニュー（例: Day A / Push）。使い回すテンプレート。 */
export interface Workout {
  id: string
  name: string
  items: PrescribedExercise[]
}

/** セッションの1種目（処方＋実績）。 */
export interface MenuItem {
  /** チェック等のキー。処方の id を引き継ぐ。 */
  exerciseId: string
  name: string
  muscle?: string
  category?: Category
  targetSets: number
  targetReps: string
  /** 目標重量(kg)。 */
  targetWeightKg?: number
  /** 実績重量(kg)。 */
  weightKg?: number
  /** 実績回数。 */
  reps?: number
  /** 毎日提示の体幹種目か（プランク等）。 */
  daily?: boolean
  done: boolean
}

/** ある日のセッション。date は 'YYYY-MM-DD'（1日1セッション）。 */
export interface DailyMenu {
  date: string
  workoutId?: string
  workoutName?: string
  items: MenuItem[]
  /** 体幹（コア）。プランクは毎日提示。 */
  coreItems?: MenuItem[]
  generatedAt: number
}

/** 設定（単一レコード, id = 'app'）。 */
export interface Settings {
  id: 'app'
  /** 目標体脂肪率(%)。プラン要約に使用。 */
  targetBodyFatPct?: number
  /** 目標筋肉量(kg)。プラン要約に使用。 */
  targetMuscleKg?: number
  /** 目標の達成期限（YYYY-MM-DD）。 */
  targetDate?: string
  /** 毎日提示する体幹種目（既定: プランク）。 */
  dailyCore: PrescribedExercise[]
}

/** 体組成の任意記録（不定期）。 */
export interface BodyMetric {
  date: string
  weightKg?: number
  bodyFatPct?: number
  muscleKg?: number
}
