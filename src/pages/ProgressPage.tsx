import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import AdherenceSummary from '../components/AdherenceSummary'
import AdherenceChart from '../components/AdherenceChart'

export default function ProgressPage() {
  const settings = useLiveQuery(() => db.settings.get('app'), [])
  const menus = useLiveQuery(() => db.menus.toArray(), [])

  if (!settings || !menus) {
    return <div className="text-slate-400">読み込み中…</div>
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">進捗</h1>
        <p className="text-sm text-slate-400">メニュー達成度の記録</p>
      </header>
      <AdherenceSummary menus={menus} settings={settings} />
      <AdherenceChart menus={menus} />
    </div>
  )
}
