import { useRef, useState } from 'react'
import { exportJSON, exportMenusCSV, exportMetricsCSV, importJSON, importMetricsCSV } from '../lib/exportImport'
import { CARD } from '../lib/styles'

export default function DataManager() {
  const jsonRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState('')

  const flash = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 4000)
  }

  const onImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const r = await importJSON(await file.text())
      flash(`Imported: ${r.workouts} workouts / ${r.menus} sessions / ${r.metrics} metrics`)
    } catch (err) {
      flash(`Import failed: ${(err as Error).message}`)
    } finally {
      if (jsonRef.current) jsonRef.current.value = ''
    }
  }

  const onImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const n = await importMetricsCSV(await file.text())
      flash(`Imported ${n} body-metric rows.`)
    } catch (err) {
      flash(`Import failed: ${(err as Error).message}`)
    } finally {
      if (csvRef.current) csvRef.current.value = ''
    }
  }

  const btn = 'w-full rounded-xl border border-slate-300 bg-white py-2 text-sm text-slate-700 active:bg-slate-50'

  return (
    <div className={`space-y-2 ${CARD} p-4`}>
      <div className="text-sm font-medium text-slate-700">Data</div>
      <p className="text-xs text-slate-400">
        Stored on this device (kept across app updates). On a phone, the buttons below open the share
        sheet — pick <span className="font-medium">Google Drive</span> or “Save to Files” to keep a backup.
      </p>
      <button onClick={() => exportJSON()} className={btn}>Backup JSON (save / share)</button>
      <button onClick={() => exportMenusCSV()} className={btn}>Export results as CSV</button>
      <button onClick={() => exportMetricsCSV()} className={btn}>Export body metrics as CSV</button>
      <button onClick={() => jsonRef.current?.click()} className={btn}>Import JSON (restore)</button>
      <button onClick={() => csvRef.current?.click()} className={btn}>Import body metrics (CSV)</button>
      <p className="text-[11px] text-slate-400">
        CSV needs a header row with a <span className="font-medium">date</span> column, plus any of
        weightKg / bodyFatPct / muscleKg.
      </p>
      <input ref={jsonRef} type="file" accept="application/json" onChange={onImportJSON} className="hidden" />
      <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={onImportCSV} className="hidden" />
      {msg && <p className="text-center text-sm text-[#01A09B]">{msg}</p>}
    </div>
  )
}
