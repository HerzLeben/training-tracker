import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { getSettings, toggleMenuItem } from '../db/repo'
import { ensureMenuForDate } from '../engine/menuEngine'
import { todayISO, weekdayLabel } from '../lib/date'
import TodayMenu from '../components/TodayMenu'

export default function TodayPage() {
  const today = todayISO()
  const settings = useLiveQuery(() => db.settings.get('app'), [])
  const menu = useLiveQuery(() => db.menus.get(today), [today])
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

  const handleRegenerate = async () => {
    const s = await getSettings()
    await ensureMenuForDate(today, s, true)
  }

  const wd = weekdayLabel(new Date(today).getDay())

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-xl font-bold">今日のトレーニング</h1>
        <p className="text-sm text-slate-400">
          {today}（{wd}）
        </p>
      </header>

      {!menu ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">
          メニューを準備中…
        </div>
      ) : (
        <TodayMenu menu={menu} onToggle={handleToggle} onRegenerate={handleRegenerate} />
      )}
    </div>
  )
}
