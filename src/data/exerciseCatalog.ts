import type { Exercise } from '../types'

// ゴールドジム想定の標準種目セット。初回起動時に DB へ投入する。
// id は固定文字列にして、再投入やインポート時の重複を防ぐ。
type Seed = Omit<Exercise, 'isCustom' | 'enabled'>

const SEED: Seed[] = [
  // push（胸・肩・三頭）
  { id: 'bench-press', name: 'ベンチプレス', slot: 'push', muscle: '胸' },
  { id: 'incline-db-press', name: 'インクラインダンベルプレス', slot: 'push', muscle: '胸' },
  { id: 'chest-press-machine', name: 'チェストプレス（マシン）', slot: 'push', muscle: '胸' },
  { id: 'cable-fly', name: 'ケーブルフライ', slot: 'push', muscle: '胸' },
  { id: 'shoulder-press', name: 'ショルダープレス', slot: 'push', muscle: '肩' },
  { id: 'side-raise', name: 'サイドレイズ', slot: 'push', muscle: '肩' },
  { id: 'triceps-pushdown', name: 'トライセプスプレスダウン', slot: 'push', muscle: '三頭' },

  // pull（背中・二頭）
  { id: 'lat-pulldown', name: 'ラットプルダウン', slot: 'pull', muscle: '背中' },
  { id: 'seated-row', name: 'シーテッドロウ', slot: 'pull', muscle: '背中' },
  { id: 'bent-over-row', name: 'ベントオーバーロウ', slot: 'pull', muscle: '背中' },
  { id: 'pullup', name: 'チンニング（懸垂）', slot: 'pull', muscle: '背中' },
  { id: 'face-pull', name: 'フェイスプル', slot: 'pull', muscle: '肩後部' },
  { id: 'db-curl', name: 'ダンベルカール', slot: 'pull', muscle: '二頭' },
  { id: 'hammer-curl', name: 'ハンマーカール', slot: 'pull', muscle: '二頭' },

  // legs（脚・臀・体幹）
  { id: 'squat', name: 'バーベルスクワット', slot: 'legs', muscle: '脚' },
  { id: 'leg-press', name: 'レッグプレス', slot: 'legs', muscle: '脚' },
  { id: 'romanian-deadlift', name: 'ルーマニアンデッドリフト', slot: 'legs', muscle: 'ハム' },
  { id: 'leg-extension', name: 'レッグエクステンション', slot: 'legs', muscle: '大腿四頭' },
  { id: 'leg-curl', name: 'レッグカール', slot: 'legs', muscle: 'ハム' },
  { id: 'calf-raise', name: 'カーフレイズ', slot: 'legs', muscle: 'ふくらはぎ' },
  { id: 'hip-thrust', name: 'ヒップスラスト', slot: 'legs', muscle: '臀' },
]

export const DEFAULT_EXERCISES: Exercise[] = SEED.map((e) => ({
  ...e,
  isCustom: false,
  enabled: true,
}))
