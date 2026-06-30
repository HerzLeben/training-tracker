import type { Workout } from '../types'

// 本人のトレーナーが作成した週6回プログラム。
// 固定 id なので、再読み込みしても重複せず上書きされる。
// 種目名はトレーナー表記のまま日本語。重量未指定は目標重量なし（Today で実績入力）。
export const SAMPLE_WORKOUTS: Workout[] = [
  {
    id: 'w-chest',
    name: '胸',
    items: [
      { id: 'c1', name: 'スミスインクラインプレス(30°)', muscle: '胸', category: 'push', targetSets: 3, targetReps: '10' },
      { id: 'c2', name: 'ダンベルプレス', muscle: '胸', category: 'push', targetSets: 3, targetReps: '10', targetWeightKg: 12 },
      { id: 'c3', name: 'ダンベルフライ', muscle: '胸', category: 'push', targetSets: 3, targetReps: '10', targetWeightKg: 12 },
      { id: 'c4', name: 'ペックフライ', muscle: '胸', category: 'push', targetSets: 3, targetReps: '12' },
    ],
  },
  {
    id: 'w-shoulder',
    name: '肩',
    items: [
      { id: 's1', name: 'ショルダープレス', muscle: '肩', category: 'push', targetSets: 3, targetReps: '10', targetWeightKg: 12 },
      { id: 's2', name: 'サイドレイズ', muscle: '肩', category: 'push', targetSets: 3, targetReps: '15', targetWeightKg: 6 },
      { id: 's3', name: 'ケーブルアップライトロー', muscle: '肩', category: 'push', targetSets: 3, targetReps: '10' },
      { id: 's4', name: 'ショルダープレスマシン', muscle: '肩', category: 'push', targetSets: 3, targetReps: '10' },
    ],
  },
  {
    id: 'w-biceps',
    name: '腕・二頭',
    items: [
      { id: 'b1', name: 'アームカール(重め)', muscle: '二頭', category: 'pull', targetSets: 2, targetReps: '10', targetWeightKg: 30 },
      { id: 'b2', name: 'アームカール(軽め)', muscle: '二頭', category: 'pull', targetSets: 2, targetReps: '15', targetWeightKg: 20 },
      { id: 'b3', name: 'ダンベルアームカール', muscle: '二頭', category: 'pull', targetSets: 3, targetReps: '10' },
      { id: 'b4', name: 'ダンベルハンマーカール', muscle: '二頭', category: 'pull', targetSets: 3, targetReps: '10' },
      { id: 'b5', name: 'ケーブルアームカール', muscle: '二頭', category: 'pull', targetSets: 3, targetReps: '10' },
    ],
  },
  {
    id: 'w-triceps',
    name: '腕・三頭',
    items: [
      { id: 't1', name: 'ケーブルエクステンション', muscle: '三頭', category: 'push', targetSets: 4, targetReps: '10' },
      { id: 't2', name: 'プレスダウン', muscle: '三頭', category: 'push', targetSets: 4, targetReps: '10', targetWeightKg: 12.5 },
      { id: 't3', name: 'トライセプスエクステンション', muscle: '三頭', category: 'push', targetSets: 3, targetReps: '10' },
      { id: 't4', name: 'キックバック', muscle: '三頭', category: 'push', targetSets: 3, targetReps: '10', targetWeightKg: 5 },
    ],
  },
  {
    id: 'w-legs',
    name: '足',
    items: [
      { id: 'l1', name: 'レッグエクステンション', muscle: '脚', category: 'legs', targetSets: 3, targetReps: '10' },
      { id: 'l2', name: 'レッグカール', muscle: 'ハム', category: 'legs', targetSets: 3, targetReps: '10' },
      { id: 'l3', name: 'レッグプレス', muscle: '脚', category: 'legs', targetSets: 3, targetReps: '10' },
      { id: 'l4', name: 'ヒップアブダクター', muscle: '臀', category: 'legs', targetSets: 3, targetReps: '10' },
    ],
  },
  {
    id: 'w-back',
    name: '背中',
    items: [
      { id: 'k1', name: 'ラットプルダウン', muscle: '背中', category: 'pull', targetSets: 3, targetReps: '10', targetWeightKg: 37.5 },
      { id: 'k2', name: 'ラットプルダウン(Tバーロー)', muscle: '背中', category: 'pull', targetSets: 3, targetReps: '10', targetWeightKg: 30 },
      { id: 'k3', name: 'シーテッドロー', muscle: '背中', category: 'pull', targetSets: 3, targetReps: '10', targetWeightKg: 40 },
      { id: 'k4', name: 'ベントオーバーロー', muscle: '背中', category: 'pull', targetSets: 3, targetReps: '10', targetWeightKg: 35 },
    ],
  },
]

/** 旧お試しデモのワークアウト id（読み込み時に掃除する）。 */
export const LEGACY_SAMPLE_IDS = ['sample-push', 'sample-pull', 'sample-legs']
