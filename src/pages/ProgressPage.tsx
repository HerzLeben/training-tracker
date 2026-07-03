import { useCallback, useState } from 'react'
import PlanSummary from '../components/PlanSummary'
import AdherenceSummary from '../components/AdherenceSummary'
import MonthCalendar from '../components/MonthCalendar'
import AdherenceChart from '../components/AdherenceChart'
import DayDetail from '../components/DayDetail'
import { useSettings, useMenus, useMetrics } from '../db/hooks'
import { formatWeeklyText } from '../lib/share'
import { shareText } from '../lib/shareTarget'

export default function ProgressPage() {
  const settings = useSettings()
  const menus = useMenus()
  const metrics = useMetrics()
  const [selected, setSelected] = useState<string | null>(null)
  const closeDetail = useCallback(() => setSelected(null), [])

  if (!settings || !menus || !metrics) {
    return <div className="text-slate-500">Loading…</div>
  }

  const shareWeekly = () => void shareText(formatWeeklyText(menus))

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Progress</h1>
          <p className="text-sm text-slate-500">Your training history</p>
        </div>
        <button
          onClick={shareWeekly}
          className="rounded-xl bg-[#01A09B] px-3 py-2 text-sm font-medium text-white active:bg-[#017a75]"
        >
          Share week
        </button>
      </header>
      <PlanSummary settings={settings} metrics={metrics} />
      <AdherenceSummary menus={menus} onSelectDate={setSelected} />
      <MonthCalendar menus={menus} onSelectDate={setSelected} />
      <AdherenceChart menus={menus} />

      {selected && <DayDetail date={selected} onClose={closeDetail} />}
    </div>
  )
}
