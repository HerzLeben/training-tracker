// 共有スタイルトークン（テーマの一元管理）。ライト（白＋緑）の柔らかい配色。

/** 標準カード（白・うっすら緑枠・やわらかい影）。パディングは利用側で付与。 */
export const CARD = 'rounded-2xl border border-emerald-100 bg-white shadow-sm'

/** 入力フィールド（テキスト/数値/日付）。幅は利用側で付与。 */
export const FIELD =
  'rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-800 placeholder:text-slate-400'

/** プライマリボタン（緑）。 */
export const BTN_PRIMARY = 'rounded-xl bg-emerald-600 text-white active:bg-emerald-700'

/** セカンダリボタン（白・枠線）。 */
export const BTN_SECONDARY =
  'rounded-xl border border-slate-300 bg-white text-slate-600 active:bg-slate-50'

/** チェック行の枠線（達成で緑に強調）。 */
export function itemBorder(done: boolean): string {
  return done ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 bg-white'
}

/** カレンダー/週ストリップのステータス配色。 */
export const STATUS_BG: Record<string, string> = {
  done: 'bg-emerald-500 text-white',
  partial: 'bg-amber-400 text-slate-900',
  none: 'bg-slate-100 text-slate-400',
  future: 'bg-slate-50 text-slate-300',
}
