import PlanSummary from '../components/PlanSummary'
import AdherenceSummary from '../components/AdherenceSummary'
import MonthCalendar from '../components/MonthCalendar'
import AdherenceChart from '../components/AdherenceChart'
import { useSettings, useMenus, useMetrics } from '../db/hooks'
import { formatWeeklyText } from '../lib/share'
import { shareText } from '../lib/shareTarget'

export default function ProgressPage() {
  const settings = useSettings()
  const menus = useMenus()
  const metrics = useMetrics()

  if (!settings || !menus || !metrics) {
    return <div className="text-slate-400">Loading…</div>
  }

  const shareWeekly = () => void shareText(formatWeeklyText(menus))

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">Progress</h1>
          <p className="text-sm text-slate-400">Your training history</p>
        </div>
        <button
          onClick={shareWeekly}
          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium active:bg-emerald-700"
        >
          Share week
        </button>
      </header>
      <PlanSummary settings={settings} metrics={metrics} />
      <AdherenceSummary menus={menus} />
      <MonthCalendar menus={menus} />
      <AdherenceChart menus={menus} />
    </div>
  )
}
