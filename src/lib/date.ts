// 日付ユーティリティ。アプリ内では 'YYYY-MM-DD'（ローカルタイム）を正とする。

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(): string {
  return toISODate(new Date())
}

/** 'YYYY-MM-DD' をローカル0時の Date に変換。 */
export function fromISODate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 曜日(0=日..6=土)。 */
export function weekdayOf(iso: string): number {
  return fromISODate(iso).getDay()
}

/** 土日かどうか（セッション時間の長短に使う）。 */
export function isWeekend(iso: string): boolean {
  const wd = weekdayOf(iso)
  return wd === 0 || wd === 6
}

/** iso から n 日加算（負も可）した 'YYYY-MM-DD'。 */
export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

/** a から b までの差（日数, b - a）。 */
export function diffDays(a: string, b: string): number {
  const ms = fromISODate(b).getTime() - fromISODate(a).getTime()
  return Math.round(ms / 86400000)
}

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export function weekdayLabel(weekday: number): string {
  return WD[weekday] ?? '?'
}
