import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import AdherenceSummary from '../components/AdherenceSummary'
import MonthCalendar from '../components/MonthCalendar'
import AdherenceChart from '../components/AdherenceChart'

export default function ProgressPage() {
  const settings = useLiveQuery(() => db.settings.get('app'), [])
  const menus = useLiveQuery(() => db.menus.toArray(), [])

  if (!settings || !menus) {
    return <div className="text-slate-400">Loading…</div>
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">Progress</h1>
        <p className="text-sm text-slate-400">Your training history</p>
      </header>
      <AdherenceSummary menus={menus} settings={settings} />
      <MonthCalendar menus={menus} settings={settings} />
      <AdherenceChart menus={menus} />
    </div>
  )
}
