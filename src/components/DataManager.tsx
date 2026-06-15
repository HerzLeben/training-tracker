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
      setMsg(`Imported: ${r.exercises} exercises / ${r.menus} menus / ${r.metrics} metrics`)
    } catch (err) {
      setMsg(`Import failed: ${(err as Error).message}`)
    } finally {
      if (fileRef.current) fileRef.current.value = ''
      setTimeout(() => setMsg(''), 4000)
    }
  }

  const btn = 'w-full rounded-xl border border-slate-700 py-2 text-sm active:bg-slate-800'

  return (
    <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <div className="text-sm font-medium text-slate-300">Data</div>
      <p className="text-xs text-slate-500">All data is stored on this device. Back it up or restore it here.</p>
      <button onClick={() => exportJSON()} className={btn}>Export JSON (backup)</button>
      <button onClick={() => exportMenusCSV()} className={btn}>Export menus as CSV</button>
      <button onClick={() => exportMetricsCSV()} className={btn}>Export body metrics as CSV</button>
      <button onClick={() => fileRef.current?.click()} className={btn}>Import JSON (restore)</button>
      <input ref={fileRef} type="file" accept="application/json" onChange={onImport} className="hidden" />
      {msg && <p className="text-center text-sm text-emerald-400">{msg}</p>}
    </div>
  )
}
