import { db } from '../db/db'
import type { DailyMenu, Settings, Exercise, BodyMetric } from '../types'

// データ所有のための入出力。全データの JSON 往復と、CSV エクスポート。

export interface Backup {
  app: 'training-tracker'
  version: 1
  exportedAt: string
  settings: Settings | null
  exercises: Exercise[]
  menus: DailyMenu[]
  metrics: BodyMetric[]
}

async function collect(): Promise<Backup> {
  const [settings, exercises, menus, metrics] = await Promise.all([
    db.settings.get('app'),
    db.exercises.toArray(),
    db.menus.toArray(),
    db.metrics.toArray(),
  ])
  return {
    app: 'training-tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: settings ?? null,
    exercises,
    menus,
    metrics,
  }
}

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

const stamp = () => new Date().toISOString().slice(0, 10)

export async function exportJSON(): Promise<void> {
  const data = await collect()
  download(`training-backup-${stamp()}.json`, JSON.stringify(data, null, 2), 'application/json')
}

function csvCell(v: string | number | undefined): string {
  if (v === undefined) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** メニュー（達成記録）を種目1行で CSV 化。 */
export async function exportMenusCSV(): Promise<void> {
  const menus = await db.menus.orderBy('date').toArray()
  const rows = [['date', 'slot', 'exercise', 'muscle', 'sets', 'reps', 'done']]
  for (const m of menus) {
    if (m.items.length === 0) {
      rows.push([m.date, m.slot, '', '', '', '', ''])
      continue
    }
    for (const it of m.items) {
      rows.push([
        m.date,
        m.slot,
        it.name,
        it.muscle,
        String(it.targetSets),
        it.targetReps,
        it.done ? '1' : '0',
      ])
    }
  }
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n')
  download(`training-menus-${stamp()}.csv`, csv, 'text/csv')
}

/** 体組成を CSV 化。 */
export async function exportMetricsCSV(): Promise<void> {
  const metrics = await db.metrics.orderBy('date').toArray()
  const rows = [['date', 'weightKg', 'bodyFatPct', 'muscleKg']]
  for (const m of metrics)
    rows.push([m.date, csvCell(m.weightKg), csvCell(m.bodyFatPct), csvCell(m.muscleKg)])
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n')
  download(`body-metrics-${stamp()}.csv`, csv, 'text/csv')
}

/** JSON バックアップを取り込み（マージ）。件数を返す。 */
export async function importJSON(text: string): Promise<{ exercises: number; menus: number; metrics: number }> {
  const data = JSON.parse(text) as Partial<Backup>
  if (data.app !== 'training-tracker') {
    throw new Error('このアプリのバックアップではありません。')
  }
  await db.transaction('rw', db.settings, db.exercises, db.menus, db.metrics, async () => {
    if (data.settings) await db.settings.put({ ...data.settings, id: 'app' })
    if (data.exercises?.length) await db.exercises.bulkPut(data.exercises)
    if (data.menus?.length) await db.menus.bulkPut(data.menus)
    if (data.metrics?.length) await db.metrics.bulkPut(data.metrics)
  })
  return {
    exercises: data.exercises?.length ?? 0,
    menus: data.menus?.length ?? 0,
    metrics: data.metrics?.length ?? 0,
  }
}
