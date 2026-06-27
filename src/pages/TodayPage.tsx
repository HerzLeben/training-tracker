import { useEffect, useRef } from 'react'
import { getSettings, toggleMenuItem, setMenuItemWeight, toggleCoreItem } from '../db/repo'
import { useSettings, useMenu, useMenus } from '../db/hooks'
import { ensureMenuForDate } from '../engine/menuEngine'
import { coreStreak } from '../lib/adherence'
import { todayISO, weekdayLabel } from '../lib/date'
import TodayMenu from '../components/TodayMenu'
import CoreBlock from '../components/CoreBlock'
import { CARD } from '../lib/styles'

export default function TodayPage() {
  const today = todayISO()
  const settings = useSettings()
  const menu = useMenu(today)
  const allMenus = useMenus()
  const ensuredFor = useRef<string | null>(null)

  // 設定が読めたら、当日メニューが無ければ生成・保存する（日付ごとに1回）。
  useEffect(() => {
    if (!settings) return
    if (ensuredFor.current === today) return
    ensuredFor.current = today
    void ensureMenuForDate(today, settings)
  }, [settings, today])

  const handleToggle = (exerciseId: string, done: boolean) => {
    void toggleMenuItem(today, exerciseId, done)
  }

  const handleWeightChange = (exerciseId: string, weightKg: number) => {
    void setMenuItemWeight(today, exerciseId, weightKg)
  }

  const handleCoreToggle = (exerciseId: string, done: boolean) => {
    void toggleCoreItem(today, exerciseId, done)
  }

  const handleRegenerate = async () => {
    const s = await getSettings()
    await ensureMenuForDate(today, s, true)
  }

  const wd = weekdayLabel(new Date(today).getDay())

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">Today's Training</h1>
        <p className="text-sm text-slate-400">
          {today} ({wd})
        </p>
      </header>

      {!menu ? (
        <div className={`${CARD} p-6 text-center text-slate-400`}>
          Preparing your menu…
        </div>
      ) : (
        <>
          <TodayMenu
            menu={menu}
            onToggle={handleToggle}
            onWeightChange={handleWeightChange}
            onRegenerate={handleRegenerate}
          />
          <CoreBlock
            items={menu.coreItems ?? []}
            streak={coreStreak(allMenus ?? [])}
            onToggle={handleCoreToggle}
          />
        </>
      )}
    </div>
  )
}
