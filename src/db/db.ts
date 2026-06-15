import Dexie, { type Table } from 'dexie'
import type { Exercise, Settings, DailyMenu, BodyMetric } from '../types'

// IndexedDB スキーマ。Dexie で定義し、dexie-react-hooks の useLiveQuery と組み合わせる。
export class AppDB extends Dexie {
  exercises!: Table<Exercise, string>
  settings!: Table<Settings, string>
  menus!: Table<DailyMenu, string>
  metrics!: Table<BodyMetric, string>

  constructor() {
    super('training-tracker')
    this.version(1).stores({
      exercises: 'id, slot, enabled',
      settings: 'id',
      menus: 'date, slot',
      metrics: 'date',
    })
  }
}

export const db = new AppDB()
