// テキストの共有先。サーバー不要で LINE に送る。
// 1) Web Share API（iOS Safari/PWA の共有シート → LINE 選択）
// 2) LINE 共有URL（LINE アプリ/サイトの共有画面）
// 3) クリップボードコピー（最終フォールバック）

type ShareResult = 'shared' | 'line' | 'copied' | 'failed'

export async function shareText(text: string): Promise<ShareResult> {
  // 1) Web Share API
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch (err) {
      // ユーザーがキャンセルした場合はそのまま終了（フォールバックしない）。
      if (err instanceof DOMException && err.name === 'AbortError') return 'shared'
    }
  }

  // 2) LINE 共有URL
  try {
    const url = `https://line.me/R/share?text=${encodeURIComponent(text)}`
    const w = window.open(url, '_blank', 'noopener')
    if (w) return 'line'
  } catch {
    // noop → クリップボードへ
  }

  // 3) クリップボードコピー
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
