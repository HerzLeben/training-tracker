import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'

// IndexedDB をリアクティブに購読する共通フック（コンポーネントから db を直接触らない）。

export const useSettings = () => useLiveQuery(() => db.settings.get('app'), [])

export const useExercises = () => useLiveQuery(() => db.exercises.toArray(), [])

/** 全メニュー（日付昇順）。集計・カレンダー用。 */
export const useMenus = () => useLiveQuery(() => db.menus.orderBy('date').toArray(), [])

/** 指定日のメニュー。 */
export const useMenu = (date: string) => useLiveQuery(() => db.menus.get(date), [date])

/** 体組成（日付昇順）。 */
export const useMetrics = () => useLiveQuery(() => db.metrics.orderBy('date').toArray(), [])

/** 体組成（日付降順）。一覧表示用。 */
export const useMetricsDesc = () =>
  useLiveQuery(() => db.metrics.orderBy('date').reverse().toArray(), [])
