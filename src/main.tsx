import React from 'react'
import ReactDOM from 'react-dom/client'
import { createHashRouter, RouterProvider, Navigate } from 'react-router-dom'
import App from './App'
import TodayPage from './pages/TodayPage'
import ProgressPage from './pages/ProgressPage'
import BodyPage from './pages/BodyPage'
import SettingsPage from './pages/SettingsPage'
import { ensureSeeded } from './db/repo'
import './index.css'

// PWA としてファイルプロトコル/サブパスでも壊れないよう HashRouter を使用。
const router = createHashRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/today" replace /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'body', element: <BodyPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])

// データ永続化を要求して、OS のストレージ整理での自動削除を避ける（ベストエフォート）。
// データは IndexedDB に保存され、アプリ更新（Service Worker 更新）では消えない。
async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist()
    }
  } catch {
    // 非対応環境では無視
  }
}

// 初回起動時に設定を投入してから描画する。
async function bootstrap() {
  await requestPersistence()
  await ensureSeeded()
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
}

void bootstrap()
