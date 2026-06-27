import type { BodyMetric } from '../types'

// CSV パース（純関数）。体組成 CSV の取り込みに使う。
// 体重計アプリ等の書き出しにも合うよう、ヘッダー名を緩く判定する。

function splitRow(line: string): string[] {
  // 簡易: カンマ区切り。各セルの前後空白と囲みダブルクオートを除去。
  return line.split(',').map((c) => c.trim().replace(/^"(.*)"$/, '$1'))
}

function toNum(v: string | undefined): number | undefined {
  if (v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isNaN(n) ? undefined : n
}

const DATE_KEYS = ['date', '日付', 'day']
const WEIGHT_KEYS = ['weightkg', 'weight', 'weight(kg)', '体重', '体重kg']
const FAT_KEYS = ['bodyfatpct', 'bodyfat', 'fat', 'bodyfat(%)', '体脂肪', '体脂肪率']
const MUSCLE_KEYS = ['musclekg', 'muscle', 'muscle(kg)', '筋肉', '筋肉量']

/** 体組成 CSV をパースして BodyMetric[] を返す。date 列必須。 */
export function parseMetricsCSV(text: string): BodyMetric[] {
  const rows = text.split(/\r?\n/).map((r) => r.trim()).filter((r) => r.length > 0)
  if (rows.length < 2) return []

  const header = splitRow(rows[0]).map((h) => h.toLowerCase())
  const find = (keys: string[]) => header.findIndex((h) => keys.includes(h))
  const di = find(DATE_KEYS)
  const wi = find(WEIGHT_KEYS)
  const fi = find(FAT_KEYS)
  const mi = find(MUSCLE_KEYS)
  if (di < 0) throw new Error('CSV に date 列が見つかりません。')

  const out: BodyMetric[] = []
  for (let i = 1; i < rows.length; i++) {
    const c = splitRow(rows[i])
    const date = c[di]
    if (!date) continue
    const m: BodyMetric = { date }
    if (wi >= 0) m.weightKg = toNum(c[wi])
    if (fi >= 0) m.bodyFatPct = toNum(c[fi])
    if (mi >= 0) m.muscleKg = toNum(c[mi])
    // 値が全く無い行はスキップ。
    if (m.weightKg === undefined && m.bodyFatPct === undefined && m.muscleKg === undefined) continue
    out.push(m)
  }
  return out
}
