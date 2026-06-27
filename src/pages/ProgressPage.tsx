import PlanSummary from '../components/PlanSummary'
import AdherenceSummary from '../components/AdherenceSummary'
import MonthCalendar from '../components/MonthCalendar'
import AdherenceChart from '../components/AdherenceChart'
import { useSettings, useMenus, useMetrics } from '../db/hooks'

export default function ProgressPage() {
  const settings = useSettings()
  const menus = useMenus()
  const metrics = useMetrics()

  if (!settings || !menus || !metrics) {
    return <div className="text-slate-400">Loading…</div>
  }

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">Progress</h1>
        <p className="text-sm text-slate-400">Your training history</p>
      </header>
      <PlanSummary settings={settings} metrics={metrics} />
      <AdherenceSummary menus={menus} settings={settings} />
      <MonthCalendar menus={menus} settings={settings} />
      <AdherenceChart menus={menus} />
    </div>
  )
}
