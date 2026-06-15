import { useRef, useState } from 'react'
import { exportJSON, exportMenusCSV, exportMetricsCSV, importJSON } from '../lib/exportImport'

export default function DataManager() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const r = await importJSON(text)
      setMsg(`取り込み完了: 種目${r.exercises} / メニュー${r.menus} / 体組成${r.metrics}`)
    } catch (err) {
      setMsg(`取り込み失敗: ${(err as Error).message}`)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => setMsg(''), 4000)
    }
  }

  const btn = 'w-full rounded-xl border border-slate-700 py-2 text-sm active:bg-slate-800'

  return (
    <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-sm font-medium text-slate-300">データの入出力</div>
      <p className="text-xs text-slate-500">記録は端末内に保存されます。バックアップを取得・復元できます。</p>
      <button onClick={() => exportJSON()} className={btn}>JSON でエクスポート（バックアップ）</button>
      <button onClick={() => exportMenusCSV()} className={btn}>メニュー記録を CSV 出力</button>
      <button onClick={() => exportMetricsCSV()} className={btn}>体組成を CSV 出力</button>
      <button onClick={() => fileRef.current?.click()} className={btn}>JSON をインポート（復元）</button>
      <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
      {msg && <p className="text-center text-sm text-emerald-400">{msg}</p>}
    </div>
  )
}
