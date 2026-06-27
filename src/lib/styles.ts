// 共有スタイルトークン（テーマの一元管理）。Tailwind のクラス断片を定数化して、
// あとで配色やスペーシングを変えやすくする。

/** 標準カードのコンテナ（パディングは利用側で付与）。 */
export const CARD = 'rounded-2xl border border-slate-800 bg-slate-900'

/** 入力フィールド（テキスト/数値/日付）。幅は利用側で付与。 */
export const FIELD = 'rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-base'

/** チェック行の枠線（達成で強調）。 */
export function itemBorder(done: boolean): string {
  return done ? 'border-emerald-700/60 bg-emerald-900/20' : 'border-slate-800 bg-slate-900'
}
