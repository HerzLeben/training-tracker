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

// 初回起動時に設定・種目カタログを投入してから描画する。
async function bootstrap() {
  await ensureSeeded()
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <RouterProvider router={router} />
    </React.StrictMode>,
  )
}

void bootstrap()
