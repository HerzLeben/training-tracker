import { db } from '../db/db'
import type { DailyMenu, Settings, Workout, BodyMetric } from '../types'
import { parseMetricsCSV } from './csv'

// データ所有のための入出力。全データの JSON 往復と、CSV エクスポート。

export interface Backup {
  app: 'training-tracker'
  version: 2
  exportedAt: string
  settings: Settings | null
  workouts: Workout[]
  menus: DailyMenu[]
  metrics: BodyMetric[]
}

async function collect(): Promise<Backup> {
  const [settings, workouts, menus, metrics] = await Promise.all([
    db.settings.get('app'),
    db.workouts.toArray(),
    db.menus.toArray(),
    db.metrics.toArray(),
  ])
  return {
    app: 'training-tracker',
    version: 2,
    exportedAt: new Date().toISOString(),
    settings: settings ?? null,
    workouts,
    menus,
    metrics,
  }
}

/**
 * ファイルを保存/共有する。モバイルでは共有シート（navigator.share）を優先し、
 * Google Drive アプリや「ファイルに保存 → Google Drive」へ直接出せるようにする。
 * 非対応（多くの PC）では通常のダウンロードにフォールバック。
 */
async function saveFile(filename: string, content: string, mime: string): Promise<void> {
  const blob = new Blob([content], { type: mime })
  const file = new File([blob], filename, { type: mime })

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename })
      return
    } catch (err) {
      // キャンセルはそのまま終了。それ以外はダウンロードにフォールバック。
      if (err instanceof DOMException && err.name === 'AbortError') return
    }
  }

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
  await saveFile(`training-backup-${stamp()}.json`, JSON.stringify(data, null, 2), 'application/json')
}

function csvCell(v: string | number | undefined): string {
  if (v === undefined) return ''
  const s = String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** セッション結果を種目1行で CSV 化（実績の重量・回数を含む）。 */
export async function exportMenusCSV(): Promise<void> {
  const menus = await db.menus.orderBy('date').toArray()
  const header = ['date', 'workout', 'exercise', 'targetSets', 'targetReps', 'targetWeightKg', 'weightKg', 'reps', 'done']
  const rows = [header]
  for (const m of menus) {
    for (const it of m.items) {
      rows.push([
        m.date,
        m.workoutName ?? '',
        it.name,
        String(it.targetSets),
        it.targetReps,
        it.targetWeightKg === undefined ? '' : String(it.targetWeightKg),
        it.weightKg === undefined ? '' : String(it.weightKg),
        it.reps === undefined ? '' : String(it.reps),
        it.done ? '1' : '0',
      ])
    }
  }
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n')
  await saveFile(`training-results-${stamp()}.csv`, csv, 'text/csv')
}

/** 体組成を CSV 化。 */
export async function exportMetricsCSV(): Promise<void> {
  const metrics = await db.metrics.orderBy('date').toArray()
  const rows = [['date', 'weightKg', 'bodyFatPct', 'muscleKg']]
  for (const m of metrics)
    rows.push([m.date, csvCell(m.weightKg), csvCell(m.bodyFatPct), csvCell(m.muscleKg)])
  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n')
  await saveFile(`body-metrics-${stamp()}.csv`, csv, 'text/csv')
}

/** 体組成 CSV を取り込み（同日付は上書き）。取り込んだ件数を返す。 */
export async function importMetricsCSV(text: string): Promise<number> {
  const metrics = parseMetricsCSV(text)
  if (metrics.length) await db.metrics.bulkPut(metrics)
  return metrics.length
}

/** JSON バックアップを取り込み（マージ）。件数を返す。 */
export async function importJSON(text: string): Promise<{ workouts: number; menus: number; metrics: number }> {
  const data = JSON.parse(text) as Partial<Backup>
  if (data.app !== 'training-tracker') {
    throw new Error('Not a Training Tracker backup file.')
  }
  await db.transaction('rw', db.settings, db.workouts, db.menus, db.metrics, async () => {
    if (data.settings) await db.settings.put({ ...data.settings, id: 'app' })
    if (data.workouts?.length) await db.workouts.bulkPut(data.workouts)
    if (data.menus?.length) await db.menus.bulkPut(data.menus)
    if (data.metrics?.length) await db.metrics.bulkPut(data.metrics)
  })
  return {
    workouts: data.workouts?.length ?? 0,
    menus: data.menus?.length ?? 0,
    metrics: data.metrics?.length ?? 0,
  }
}
