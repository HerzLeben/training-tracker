import { useState } from 'react'
import { CARD } from '../lib/styles'

// 最新版の取得を手動でトリガーする。Service Worker を更新し、
// 新しい版が有効化されたらリロード（フォールバックで一定時間後にリロード）。
export default function AppUpdate() {
  const [busy, setBusy] = useState(false)

  const update = async () => {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker?.getRegistration()
      navigator.serviceWorker?.addEventListener('controllerchange', () => location.reload())
      await reg?.update()
    } catch {
      // 取得失敗時もとりあえずリロード
    }
    // 新SWが切り替わらなくても確実に再読込（同版なら見た目は変わらない）。
    setTimeout(() => location.reload(), 1500)
  }

  return (
    <div className={`space-y-2 ${CARD} p-4`}>
      <div className="text-sm font-medium text-slate-700">App</div>
      <p className="text-xs text-slate-400">
        Tap to fetch the latest version. Your data stays — it is never cleared by an update.
      </p>
      <button
        onClick={update}
        disabled={busy}
        className="w-full rounded-xl bg-[#01A09B] py-2 text-sm font-medium text-white active:bg-[#017a75] disabled:opacity-60"
      >
        {busy ? 'Updating…' : 'Update app'}
      </button>
    </div>
  )
}
