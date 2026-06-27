import Dexie, { type Table } from 'dexie'
import type { Workout, Settings, DailyMenu, BodyMetric } from '../types'

// IndexedDB スキーマ。Dexie で定義し、dexie-react-hooks の useLiveQuery と組み合わせる。
export class AppDB extends Dexie {
  workouts!: Table<Workout, string>
  settings!: Table<Settings, string>
  menus!: Table<DailyMenu, string>
  metrics!: Table<BodyMetric, string>

  constructor() {
    super('training-tracker')
    // 重要: マイグレーションは「追加のみ」。menus/metrics/workouts のデータは
    // 今後のアップデートでも削除しないこと（ユーザーのデータを飛ばさないため）。
    // 新フィールドは optional で追加し、ストアの再作成・削除は避ける。
    //
    // v1: exercises ベースの自動生成モデル（廃止）。
    this.version(1).stores({
      exercises: 'id, slot, enabled',
      settings: 'id',
      menus: 'date, slot',
      metrics: 'date',
    })
    // v2: プログラム（workouts）で記録するモデル。exercises ストアは廃止。
    this.version(2).stores({
      exercises: null,
      workouts: 'id',
      settings: 'id',
      menus: 'date',
      metrics: 'date',
    })
  }
}

export const db = new AppDB()
